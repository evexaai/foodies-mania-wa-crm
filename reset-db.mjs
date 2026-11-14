/**
 * Empty the order book.
 *
 * Run once, by hand, to hand the project over as a clean start:
 *
 *   node reset-db.mjs
 *
 * It empties the orders, the customers, the conversations, the menu changes
 * and the users. The tables themselves stay, so the apps carry on working and
 * the first real order fills them again. Nothing else in the project reads
 * this file, and nothing runs it for you.
 */
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
} catch {}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set, so there is nothing to empty.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const TABLES = ['fm_orders', 'fm_customers', 'fm_messages', 'fm_threads', 'fm_menu', 'fm_users'];

const count = async () => {
  const out = {};
  for (const t of TABLES) {
    try { out[t] = (await sql.query(`select count(*)::int n from ${t}`))[0].n } catch { out[t] = '-' }
  }
  return out;
};

console.log('before:', await count());
for (const t of TABLES) {
  try { await sql.query(`delete from ${t}`) } catch (e) { console.error(t, e.message) }
}
console.log('after: ', await count());
console.log('\nThe board is empty. Open Settings, Users and add the first user:');
console.log('until there is one, anybody who finds the address can sign in.');
