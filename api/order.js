import { db, hasDb, body, str, num, phoneKey, clientIp } from './_db.js';

/**
 * The customer's end of the line.
 *
 *   POST /api/order          place an order
 *   GET  /api/order?device=  what this device has ordered, and whether the
 *                            restaurant has taken it on
 *
 * A customer never signs in. The browser keeps a device id, the server keeps
 * the same id against the order, and a GET only ever returns orders carrying
 * the id it was asked with. Nobody can read anybody else's orders by guessing
 * an order number, because the number alone is not enough.
 */
export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      const device = str(req.query?.device, 80);
      if (!device) return res.status(400).json({ error: 'device is required' });
      const rows = await sql`
        select id, status, kind, total, placed_at, approved_at
        from fm_orders
        where device_id = ${device} and placed_at > now() - interval '2 days'
        order by placed_at desc limit 20`;
      return res.status(200).json({ orders: rows });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const b = body(req);
    const phone = phoneKey(b.phone);
    const name = str(b.name, 120);
    const id = str(b.id, 40);
    const items = Array.isArray(b.items) ? b.items.slice(0, 60) : [];
    if (!id) return res.status(400).json({ error: 'id is required' });
    if (!phone) return res.status(400).json({ error: 'a valid 03xx number is required' });
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!items.length) return res.status(400).json({ error: 'the order has no items' });

    const kind = b.type === 'pickup' ? 'pickup' : 'delivery';
    const total = num(b.total);
    // a payment screenshot is a shrunk JPEG data URL; anything larger is dropped
    const shotRaw = str(b.shot, 1_600_000);
    const shot = shotRaw.startsWith('data:image/') ? shotRaw : '';

    const order = {
      id, phone, name,
      device: str(b.device, 80),
      ip: clientIp(req),
      kind,
      area: str(b.area, 120),
      address: str(b.addr, 400),
      note: str(b.note, 400),
      pay: str(b.pay, 20) || 'COD',
      txn: str(b.txn, 80),
      shot,
      src: str(b.src, 20) || 'web',
      items: JSON.stringify(items.map(i => ({
        id: str(i.id, 40), name: str(i.name, 120), size: str(i.size, 40),
        cat: str(i.cat, 40), price: num(i.price), qty: num(i.qty) || 1, note: str(i.note, 200)
      }))),
      subtotal: num(b.subtotal), fee: num(b.fee), total
    };

    await sql`
      insert into fm_customers (phone, name, area, address, device_id, orders, spent)
      values (${phone}, ${name}, ${order.area}, ${order.address}, ${order.device}, 1, ${total})
      on conflict (phone) do update set
        name       = excluded.name,
        area       = coalesce(nullif(excluded.area, ''), fm_customers.area),
        address    = coalesce(nullif(excluded.address, ''), fm_customers.address),
        device_id  = excluded.device_id,
        orders     = fm_customers.orders + 1,
        spent      = fm_customers.spent + ${total},
        last_seen  = now()`;

    const rows = await sql`
      insert into fm_orders (id, phone, name, device_id, ip, kind, area, address, note, pay, txn, shot, src, items, subtotal, fee, total)
      values (${order.id}, ${phone}, ${name}, ${order.device}, ${order.ip}, ${kind}, ${order.area}, ${order.address},
              ${order.note}, ${order.pay}, ${order.txn}, ${order.shot}, ${order.src}, ${order.items}::jsonb,
              ${order.subtotal}, ${order.fee}, ${total})
      on conflict (id) do nothing
      returning id, status, placed_at`;

    if (!rows.length) {
      const [existing] = await sql`select id, status, placed_at from fm_orders where id = ${id}`;
      return res.status(200).json({ ok: true, order: existing, duplicate: true });
    }
    return res.status(201).json({ ok: true, order: rows[0] });
  } catch (e) {
    console.error('order:', e);
    return res.status(500).json({ error: 'could not save the order' });
  }
}
