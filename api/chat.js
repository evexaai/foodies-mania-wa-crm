import { db, hasDb, body, str, phoneKey } from './_db.js';

/**
 * The customer's end of a conversation.
 *
 *   POST /api/chat           add one line to this device's conversation
 *   GET  /api/chat?device=   anything said since the id you already have
 *
 * The website's chat answers the customer itself, from the AI agent in the
 * page. This endpoint is the carbon copy: every line, the customer's and the
 * agent's, is written here so the counter can read the conversation while it
 * is happening and, if it wants, answer in it. A reply typed on the dashboard
 * comes back through the GET and appears in the customer's chat.
 *
 * As everywhere else, the device id is the only key. A GET returns the
 * conversation belonging to the id it was asked with and no other.
 */
export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      const device = str(req.query?.device, 80);
      if (!device) return res.status(400).json({ error: 'device is required' });
      const after = Number(req.query?.after) || 0;
      const rows = await sql`
        select id, who, text, at from fm_messages
        where device_id = ${device} and id > ${after}
        order by id limit 50`;
      const [th] = await sql`select taken_by from fm_threads where device_id = ${device}`;
      return res.status(200).json({ msgs: rows, staff: th?.taken_by || '' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const b = body(req);
    const device = str(b.device, 80);
    const text = str(b.text, 2000);
    const who = b.who === 'bot' ? 'bot' : 'me';
    if (!device) return res.status(400).json({ error: 'device is required' });
    if (!text) return res.status(400).json({ error: 'text is required' });

    const channel = b.channel === 'page' ? 'page' : 'bubble';
    const phone = phoneKey(b.phone);
    const name = str(b.name, 120);

    const [row] = await sql`
      insert into fm_messages (device_id, who, text, channel)
      values (${device}, ${who}, ${text}, ${channel})
      returning id`;

    // Only what the customer says counts as unread at the counter: the agent
    // answering itself is not something anyone needs to be chased about.
    await sql`
      insert into fm_threads (device_id, phone, name, channel, unread, last_text, last_who)
      values (${device}, ${phone}, ${name}, ${channel}, ${who === 'me' ? 1 : 0}, ${text}, ${who})
      on conflict (device_id) do update set
        phone      = coalesce(nullif(${phone}, ''), fm_threads.phone),
        name       = coalesce(nullif(${name}, ''), fm_threads.name),
        channel    = ${channel},
        unread     = case when ${who} = 'me' then fm_threads.unread + 1 else fm_threads.unread end,
        last_text  = ${text},
        last_who   = ${who},
        updated_at = now()`;

    return res.status(201).json({ ok: true, id: row.id });
  } catch (e) {
    console.error('chat:', e);
    return res.status(500).json({ error: 'could not save the message' });
  }
}
