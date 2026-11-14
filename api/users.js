import { createHash, randomBytes } from 'node:crypto';
import { db, hasDb, staffOk, body, str } from './_db.js';

/**
 * Who may open the order desk.
 *
 *   GET  /api/users              the list: names and logins, never a password
 *   POST /api/users              add one, or remove one
 *   POST /api/users {signin:1}   check a name and password at sign-in
 *
 * A password is never stored. Each user gets a random salt, and what is kept
 * is a SHA-256 of that salt and the password together, so the rows are of no
 * use to anyone who reads them.
 *
 * While there are no users at all, anybody may sign in. That is what makes a
 * fresh install usable: the first thing the owner does is add themselves, and
 * from that moment the desk is closed to everyone else.
 */
const hashOf = (salt, pass) => createHash('sha256').update(salt + ':' + pass).digest('hex');

export default async function handler(req, res) {
  if (!hasDb()) return res.status(503).json({ error: 'no database', offline: true });

  try {
    const { sql, ready } = db();
    await ready;

    if (req.method === 'GET') {
      if (!staffOk(req)) return res.status(401).json({ error: 'staff key required' });
      const rows = await sql`select login, name, created_at from fm_users order by created_at`;
      return res.status(200).json({ users: rows });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const b = body(req);
    const login = str(b.login, 60).toLowerCase();

    // signing in: open to anyone, because this is what the sign-in screen asks
    if (b.signin) {
      const [u] = await sql`select * from fm_users where login = ${login}`;
      const [{ n }] = await sql`select count(*)::int n from fm_users`;
      if (!n) return res.status(200).json({ ok: true, name: str(b.login, 60) || 'Counter', open: true });
      if (!u) return res.status(200).json({ ok: false });
      const ok = hashOf(u.salt, str(b.pass, 200)) === u.hash;
      return res.status(200).json({ ok, name: ok ? u.name : '' });
    }

    if (!staffOk(req)) return res.status(401).json({ error: 'staff key required' });
    if (!login) return res.status(400).json({ error: 'a login is required' });

    if (b.remove) {
      await sql`delete from fm_users where login = ${login}`;
      return res.status(200).json({ ok: true, removed: login });
    }

    const name = str(b.name, 120) || login;
    const pass = str(b.pass, 200);
    if (pass.length < 4) return res.status(400).json({ error: 'the password needs at least 4 characters' });
    const salt = randomBytes(12).toString('hex');

    await sql`
      insert into fm_users (login, name, salt, hash)
      values (${login}, ${name}, ${salt}, ${hashOf(salt, pass)})
      on conflict (login) do update set name = ${name}, salt = ${salt}, hash = ${hashOf(salt, pass)}`;

    return res.status(201).json({ ok: true, login, name });
  } catch (e) {
    console.error('users:', e);
    return res.status(500).json({ error: 'could not save the user' });
  }
}
