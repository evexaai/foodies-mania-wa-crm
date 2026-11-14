import { db, hasDb, body, str, staffOk } from './_db.js';

/**
 * The dashboard's end of the line.
 *
 *   GET  /api/orders?since=<iso>   every website order, newest first
 *   POST /api/orders               { id, status } once the counter moves one
 *
 * Open until STAFF_KEY is set in the environment; after that both calls need
 * that key in the x-fm-key header, which the dashboard asks for once.
 */
const ALLOWED = ['new', 'approved', 'preparing', 'ready', 'out', 'delivered', 'cancelled'];

export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });
  if (!staffOk(req)) return res.status(401).json({ error: 'staff key required' });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      const since = str(req.query?.since, 40);
      const rows = since
        ? await sql`select o.*, c.orders as customer_orders, c.spent as customer_spent, c.first_seen as customer_since
                    from fm_orders o left join fm_customers c on c.phone = o.phone
                    where o.updated_at > ${since}::timestamptz order by o.placed_at desc limit 200`
        : await sql`select o.*, c.orders as customer_orders, c.spent as customer_spent, c.first_seen as customer_since
                    from fm_orders o left join fm_customers c on c.phone = o.phone
                    where o.placed_at > now() - interval '2 days' order by o.placed_at desc limit 200`;
      return res.status(200).json({ orders: rows, now: new Date().toISOString() });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const b = body(req);
    const id = str(b.id, 40), status = str(b.status, 20);
    if (!id || !ALLOWED.includes(status)) return res.status(400).json({ error: 'id and a known status are required' });

    const rows = await sql`
      update fm_orders
         set status = ${status},
             approved_at = case when ${status} = 'approved' and approved_at is null then now() else approved_at end,
             updated_at = now()
       where id = ${id}
       returning id, status, approved_at`;
    if (!rows.length) return res.status(404).json({ error: 'no such order' });
    return res.status(200).json({ ok: true, order: rows[0] });
  } catch (e) {
    console.error('orders:', e);
    return res.status(500).json({ error: 'could not reach the order book' });
  }
}
