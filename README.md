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

website/           customer site: see website/README.md
  index.html, menu.html, order-chat.html
  css/  js/  assets/ (food photos, hero images, logo)
  tools/           scripts that fetch and save the menu photos

dashboard/         staff CRM: see dashboard/README.md
  index.html, manifest.webmanifest, sw.js
  css/  js/  assets/
  reference/       the original single-file prototype, kept for reference
```

## Hosting

The repository is hosted on Vercel. The dashboard is at `/dashboard/`, the
website at `/website/`, and the bare address sends visitors to the dashboard.
