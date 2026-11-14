import { db, hasDb, staffOk, body, str } from './_db.js';

/**
 * What the counter has changed about the menu.
 *
 *   GET  /api/menu   open to anyone: the website reads it on every page load
 *   POST /api/menu   the counter's end: switch an item or a category off, or
 *                    change a price
 *
 * The menu itself lives in one file, website/js/menu.js, and both sites read
 * it. This table holds only the handful of facts that change during a night,
 * so there is never a second copy of the menu to keep in step. A row exists
 * only for something that has been changed; everything else is on, at the
 * price in the file.
 */
export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      const rows = await sql`select item_id, kind, available, price from fm_menu`;
      // The website asks for this on every load, so let a browser hold it for
      // a few seconds but never a proxy: a sold-out item must not be cached.
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        items: rows.filter(r => r.kind === 'item'),
        cats: rows.filter(r => r.kind === 'cat'),
        now: new Date().toISOString()
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }
    if (!staffOk(req)) return res.status(401).json({ error: 'staff key required' });

    const b = body(req);
    const id = str(b.id, 60);
    if (!id) return res.status(400).json({ error: 'id is required' });
    const kind = b.kind === 'cat' ? 'cat' : 'item';
    const available = b.available !== false;
    // null means "no change to the price": the file's price stands
    const price = b.price == null || b.price === '' ? null : Math.max(0, Math.round(Number(b.price) || 0));

    await sql`
      insert into fm_menu (item_id, kind, available, price)
      values (${id}, ${kind}, ${available}, ${price})
      on conflict (item_id) do update set
        kind       = ${kind},
        available  = ${available},
        price      = ${price},
        updated_at = now()`;

    return res.status(200).json({ ok: true, id, kind, available, price });
  } catch (e) {
    console.error('menu:', e);
    return res.status(500).json({ error: 'could not save the change' });
  }
}
