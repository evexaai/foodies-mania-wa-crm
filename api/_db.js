import { neon } from '@neondatabase/serverless';

/**
 * The one place that talks to Neon.
 *
 * The connection string never reaches the browser: it lives in the DATABASE_URL
 * environment variable and is only read inside these functions. Use Neon's
 * *pooled* string, because a serverless function opens a fresh connection per
 * invocation and an unpooled endpoint runs out of them under real traffic.
 *
 * Two tables, both prefixed fm_ so this can share a database with other work:
 *   fm_customers  one row per phone number, which is the key the restaurant
 *                 already knows a customer by
 *   fm_orders     one row per order, tied to that phone and to the device that
 *                 placed it, so a customer can be shown their own orders
 *                 without ever signing in
 *   fm_messages   every line of every website chat, so the counter can read a
 *                 conversation that is happening right now and answer in it
 *   fm_threads    one row per chatting device: who they are and whether a
 *                 member of staff has taken the conversation over from the AI
 *   fm_menu       the few menu facts the counter controls: whether an item or a
 *                 whole category is being offered, and a changed price. The
 *                 website reads it, so switching something off here sells out
 *                 on the site within seconds
 */
export const hasDb = () => !!process.env.DATABASE_URL;

let schema = null;

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);
  // created once per cold start, then reused
  schema = schema || (async () => {
    await sql`create table if not exists fm_customers (
      phone       text primary key,
      name        text not null,
      area        text,
      address     text,
      device_id   text,
      orders      integer not null default 0,
      spent       numeric(12,2) not null default 0,
      first_seen  timestamptz not null default now(),
      last_seen   timestamptz not null default now()
    )`;
    await sql`create table if not exists fm_orders (
      id          text primary key,
      phone       text not null,
      name        text not null,
      device_id   text,
      ip          text,
      kind        text not null default 'delivery',
      area        text,
      address     text,
      note        text,
      pay         text not null default 'COD',
      txn         text,
      shot        text,
      src         text,
      items       jsonb not null,
      subtotal    numeric(12,2) not null default 0,
      fee         numeric(12,2) not null default 0,
      total       numeric(12,2) not null default 0,
      status      text not null default 'new',
      placed_at   timestamptz not null default now(),
      approved_at timestamptz,
      updated_at  timestamptz not null default now()
    )`;
    await sql`create index if not exists fm_orders_device on fm_orders (device_id, placed_at desc)`;
    await sql`create index if not exists fm_orders_placed on fm_orders (placed_at desc)`;
    await sql`create index if not exists fm_orders_phone  on fm_orders (phone, placed_at desc)`;

    await sql`create table if not exists fm_threads (
      device_id   text primary key,
      phone       text,
      name        text,
      channel     text not null default 'bubble',
      taken_by    text,
      unread      integer not null default 0,
      last_text   text,
      last_who    text,
      started_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now()
    )`;
    await sql`create table if not exists fm_messages (
      id          bigserial primary key,
      device_id   text not null,
      who         text not null,
      text        text not null,
      channel     text,
      at          timestamptz not null default now()
    )`;
    await sql`create index if not exists fm_messages_dev on fm_messages (device_id, id)`;
    await sql`create index if not exists fm_threads_up   on fm_threads (updated_at desc)`;

    await sql`create table if not exists fm_menu (
      item_id     text primary key,
      kind        text not null default 'item',
      available   boolean not null default true,
      price       numeric(10,2),
      updated_at  timestamptz not null default now()
    )`;
  })().catch(e => { schema = null; throw e; });
  return { sql, ready: schema };
}

/** The dashboard's endpoints are open until STAFF_KEY is set; then they need it. */
export function staffOk(req) {
  const key = process.env.STAFF_KEY;
  if (!key) return true;
  const sent = req.headers['x-fm-key'] || '';
  return sent === key;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return String(Array.isArray(fwd) ? fwd[0] : (fwd || req.socket?.remoteAddress || '')).split(',')[0].trim().slice(0, 45);
}

export function body(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b) } catch { return {} } }
  return b;
}

export const str = (v, n) => String(v ?? '').trim().slice(0, n);
export const num = v => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0 };

/** The phone number is the key, so it is always stored the same way: 03xxxxxxxxx */
export function phoneKey(v) {
  const d = String(v ?? '').replace(/\D/g, '').replace(/^92/, '0').replace(/^0{2,}/, '0');
  return /^03\d{9}$/.test(d) ? d : '';
}
