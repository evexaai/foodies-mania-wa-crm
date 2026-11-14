# Foodies Mania

Two projects that work together:

| Folder | What it is | Who uses it |
| --- | --- | --- |
| [`website/`](website/README.md) | The ordering website, the chat widget and the order-by-chat page | Customers |
| [`dashboard/`](dashboard/README.md) | The CRM: orders board, kitchen, riders, live chats, menu, settings | Restaurant staff |

An order placed on the website lands on the dashboard's **Delivery Orders** board,
and the customer's tracker on the website moves as the staff work the order. The
two talk through the browser, so they must be served from the same address
(see [How the website reaches the dashboard](website/README.md)).

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer. From this folder:

```sh
node server.mjs      # or: npm run dev
```

| | |
| --- | --- |
| Website | http://localhost:5500/website/ |
| Order by chat | http://localhost:5500/website/order-chat |
| Dashboard | http://localhost:5500/dashboard/ (sign in as `shahnawaz` / `fm@2025`) |

Pages reload by themselves when you save a file. Use another port with
`PORT=3000 node server.mjs`.

## Folder layout

```
README.md          this file
server.mjs         local server for both projects, with live reload
package.json       npm run dev
vercel.json        hosting settings (Vercel)
.vercelignore      files kept out of the hosted site

api/               the order book: three small functions, one database
  _db.js           the Neon connection and the two tables
  order.js         the customer's end: place an order, read your own
  orders.js        the counter's end: read them all, move one along

website/           customer site: see website/README.md
  index.html, menu.html, order-chat.html
  css/  js/  assets/ (food photos, hero images, logo)
  tools/           scripts that fetch and save the menu photos

dashboard/         staff CRM: see dashboard/README.md
  index.html, manifest.webmanifest, sw.js
  css/  js/  assets/
  reference/       the original single-file prototype, kept for reference
```

## The order book (Neon)

Every website order is written to a Postgres database at [Neon](https://neon.tech),
and the dashboard reads it from there. That is what makes an order survive a
closed tab: the counter sees it on any computer, and the customer sees the
restaurant's answer when they come back, on the same phone, without signing in.

Two tables, both made on first use, so there is nothing to run by hand:

| | |
| --- | --- |
| `fm_customers` | one row per **phone number**, which is the key: name, area, address, how many orders, how much spent, first and last seen |
| `fm_orders` | one row per order: who, what, where, how they paid, the transaction ID or screenshot, and the status |

**To switch it on**

1. Make a project at [neon.tech](https://neon.tech) (the free plan is plenty).
2. Copy the **pooled** connection string, the one with `-pooler` in the host.
3. In Vercel → the project → Settings → Environment Variables, add
   `DATABASE_URL` with that value, for Production and Preview.
4. Redeploy.

Locally, put the same line in a `.env` file and start the server with it:

```sh
DATABASE_URL="postgres://..." node server.mjs
```

**Without it nothing breaks.** The functions answer "no database" and the two
sites fall back to talking through the browser, which is how the demo has
always worked. An order placed while the database is unreachable waits in the
browser and is sent the moment it can be.

**`STAFF_KEY` (optional)** locks the dashboard's end of the API. Set it in
Vercel and the dashboard asks for it once, then remembers it. Leave it unset
and the endpoint is open, which is fine while the dashboard itself is not
public.

## Hosting

The repository is hosted on Vercel. The dashboard is at `/dashboard/`, the
website at `/website/`, the API at `/api/`, and the bare address sends visitors
to the dashboard.
