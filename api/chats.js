import { db, hasDb, staffOk, body, str } from './_db.js';

/**
 * The counter's end of the conversations.
 *
 *   GET  /api/chats              every conversation, newest first
 *   GET  /api/chats?device=      one conversation in full
 *   POST /api/chats              answer in one, or hand it back to the AI
 *
 * A reply written here is stored as who = 'staff'. The customer's page is
 * polling its own conversation, so it arrives in their chat within seconds,
 * and from then on the agent in their page keeps quiet: taken_by is what tells
 * it a person has taken over.
 */
export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });
  if (!staffOk(req)) return res.status(401).json({ error: 'staff key required' });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      const device = str(req.query?.device, 80);

      if (device) {
        const msgs = await sql`
          select id, who, text, at from fm_messages
          where device_id = ${device} order by id limit 400`;
        const [th] = await sql`
          select t.*, c.orders as customer_orders, c.spent as customer_spent, c.area, c.address
          from fm_threads t
          left join fm_customers c on c.phone = t.phone
          where t.device_id = ${device}`;
        return res.status(200).json({ thread: th || null, msgs });
      }

      // The list: only conversations that have been alive in the last two days.
      const rows = await sql`
        select t.device_id, t.phone, t.name, t.channel, t.taken_by, t.unread,
               t.last_text, t.last_who, t.started_at, t.updated_at,
               c.orders as customer_orders, c.spent as customer_spent
        from fm_threads t
        left join fm_customers c on c.phone = t.phone
        where t.updated_at > now() - interval '2 days'
        order by t.updated_at desc limit 80`;
      return res.status(200).json({ threads: rows, now: new Date().toISOString() });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const b = body(req);
    const device = str(b.device, 80);
    if (!device) return res.status(400).json({ error: 'device is required' });

    // reading a conversation clears its unread count
    if (b.read) {
      await sql`update fm_threads set unread = 0 where device_id = ${device}`;
      return res.status(200).json({ ok: true });
    }

    // handing the conversation back to the AI
    if (b.release) {
      await sql`update fm_threads set taken_by = null, updated_at = now() where device_id = ${device}`;
      return res.status(200).json({ ok: true, released: true });
    }

    const text = str(b.text, 2000);
    const by = str(b.by, 80) || 'Counter';
    if (!text) return res.status(400).json({ error: 'text is required' });

    const [row] = await sql`
      insert into fm_messages (device_id, who, text, channel)
      values (${device}, 'staff', ${text}, 'staff')
      returning id, at`;
    await sql`
      insert into fm_threads (device_id, taken_by, unread, last_text, last_who)
      values (${device}, ${by}, 0, ${text}, 'staff')
      on conflict (device_id) do update set
        taken_by   = ${by},
        unread     = 0,
        last_text  = ${text},
        last_who   = 'staff',
        updated_at = now()`;

    return res.status(201).json({ ok: true, id: row.id, at: row.at });
  } catch (e) {
    console.error('chats:', e);
    return res.status(500).json({ error: 'could not reach the conversations' });
  }
}
