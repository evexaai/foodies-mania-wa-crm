# Foodies Mania CRM

WhatsApp order console — AI takes the order, you approve it, the kitchen cooks it,
a rider takes it to the door.

This is the single-file prototype (`Foodies Mania CRM.html`) split into a real
project. No build step, no framework, no dependencies — plain HTML, CSS and JS.

## The website

The customer-facing ordering site, chat widget and chat-to-order page live in
[`website/`](website/README.md). Their orders land on the Delivery Orders board.

## Run it

```sh
node server.mjs      # or: npm run dev
```

Then open http://localhost:5500/ — the page live-reloads whenever you save a file
under `index.html`, `css/`, `js/` or `assets/`.

The website is at http://localhost:5500/website/ and the chat page at
http://localhost:5500/website/order-chat.

Set a different port with `PORT=3000 node server.mjs`.

## Layout

```
index.html        document shell + all markup (SVG icon sprite, login, app chrome)
css/base.css      the reset / safe-area rules
css/styles.css    design tokens (:root) + every component style
js/app.js         the whole app: demo data, router, page renderers
assets/logo.webp  the logo (was inlined twice as base64)
server.mjs        zero-dependency static server with live reload
```

## What the controls do

- **Light / dark mode** — the sun/moon button in the top bar. Light mode keeps the
  same warm brand colours, just lifted, with a white working area. Behind the
  content sits a still brand wash — two soft orange radial gradients, no movement
  — tuned per theme with `--grad1` / `--grad2`. The sign-in screen stays dark on
  purpose. Your choice is remembered between visits.
- **Collapsible sidebar** — the ☰ button in the top bar. On a desktop it collapses
  the rail to icons with just the Foodies Mania mark on top; on a phone or tablet
  the same button opens the sidebar as a drawer, so it never collapses there.
- **Full screen** — double-click the Foodies Mania mark at the top of the sidebar.
  That is the only way in, and it takes the whole dashboard.
- **Notifications you can get rid of** — every pop-up has an x, and on a phone you
  can flick it to the right. Hovering one stops its timer. At most two stack on a
  phone, three on a desktop. The switch inside the bell panel turns pop-ups off
  altogether: alerts still land in the panel and still count on the bell, they
  just stop appearing over your work. The bell shows a slash while that is off.
- **Smooth scrolling** — [Lenis](https://lenis.darkroom.engineering/) drives the
  wheel on the working area, and cards below the fold rise in as you reach them.
  Touch is deliberately left native, because a phone already scrolls better than
  anything put in front of it. Both respect **prefers-reduced-motion**: if your
  system has animations turned off you get plain native scrolling, which is the
  correct behaviour but worth knowing if you expected the glide.
- **Install it as an app** — Settings → Install the app has a Download button that
  fires the browser's own install prompt, a link to copy onto another device,
  and the manual steps for iPhone, Android or desktop when the prompt is not
  offered. Chrome also shows its install icon in the address bar. Once installed
  it opens in its own window and still works if the line drops.
- **Who is signed in decides what they see** — the login ID is matched against
  Settings → Users. The sidebar only shows the sections that user is allowed to
  open, and going anywhere else is refused. Sign in as `shahnawaz` for the owner's
  view or `hamza` for a rider's.
- **The owner's dashboard** — four numbers, a period picker and one card that
  changes what it shows, rather than everything at once. Pick **Today**,
  **Yesterday**, **Last 7 days**, **Last 30 days** or your own dates and the
  numbers, the chart and the card all follow. Every bar on the chart opens the
  orders behind it, and the takeaway tile opens the names and numbers that got
  the number. The live pipeline strip only appears for tonight, because that is
  the only period it means anything for.
- **A rider's own screen** — a user with the Rider role gets two pages built for a
  phone: his home, with To take, To give and what is on the bike, and an Orders
  page with his drops only, split into *On the bike* and *Delivered*. Tapping one
  opens the customer, their number, the address, the items, and a box to leave a
  note the counter can read. When the counter assigns him a drop he gets a
  notification — riders never get the voice. There is nothing to accept: he rides,
  then taps **Mark delivered**, and the cash moves from To take to To give.

## Where to change things

**Colours, fonts, spacing** — `css/styles.css`, the `:root` block at the top, and
the `html[data-theme="light"]` block right under it for the light palette.
Everything else reads from those variables, so changing `--or` reskins the app in
both themes.

`css/styles.css` is then sectioned: `login`, `app shell`, `primitives`, `KPI`,
`orders board`, `drawer & modal`, `conversations`, `riders`, `customers`, `bulk`,
`menu`, `settings`, `responsive`, and the additions at the end (theme, sidebar,
category switch, thumbnails, roles, rider screen, dismissible pop-ups).

**Content and behaviour** — `js/app.js`, also sectioned with banner comments:

| Section | What lives there |
| --- | --- |
| `menu` | real items and prices, and whether a category is switched on |
| `delivery areas` | zones and their delivery fees |
| `people` | demo customers, riders, staff |
| `voice + chime` | voice selection, the pronunciation map, the alert lines |
| `actions` | the glue that moves an order between pages |
| `live chats` | the AI order-taking simulation |
| `simulation loop` | the timers that make the demo move |
| `router + chrome` | nav, drawer, modal, notifications, theme, sidebar |
| `DASHBOARD` … `SETTINGS` | one renderer per page |
| `login + boot` | sign-in and startup |

**Markup / icons** — `index.html`. The icon sprite is the `<svg>` at the top:
`<symbol id="i-…">` for UI icons, `f-…` for food icons, used as
`<svg class="i"><use href="#i-bike"/></svg>`.

**Menu availability** — a single item has a switch, and so does a whole category:
pick a category pill and its on/off switch appears right under the pills. `isOn(item)`
is the one check the AI agent uses; it is true only when the item and its category
are both on, so switching off BBQ silently takes all twelve BBQ items off the menu
the agent quotes from.

**Rider money** — three numbers, each one clickable for the orders behind it:

Two people watch the same money from opposite ends, so each sees it differently.

**On the rider's own screen**

| | what it means |
| --- | --- |
| `riderTake(r)` | **To take** — cash-on-delivery orders still at the customer |
| `riderGive(r)` | **To give** — cash in his pocket, waiting to be handed in |

Marking a drop delivered moves it straight from the first to the second.

**On the counter's screen**

| | what it means |
| --- | --- |
| `toTake(r)` | **To take** — everything he owes, on the road or in his pocket |
| `collected(r)` | **Collected** — cash actually handed in tonight; it only grows |

Delivering changes nothing here, because the money is still out of the till
either way. **Receive** is the only thing that moves it: To take falls by what
was counted and Collected rises by the same amount.

So one Rs 500 cash order travels like this:

| | rider To take | rider To give | counter To take | counter Collected |
| --- | --- | --- | --- | --- |
| assigned | +500 | — | +500 | — |
| delivered | −500 | +500 | unchanged | — |
| handed in | — | −500 | −500 | +500 |

Prepaid orders never enter any of it. Collected is backed by a ledger of
hand-ins (`r.handins`) rather than a guess, so the figure and the list behind
it always agree, even after part payments.

**The kitchen screen** is a ticket rail: one docket per order, oldest first, a
timer that turns amber then red, and tappable lines so a cook can strike items
off as they are plated. Start cooking and Ready are the only two buttons. On a
phone it collapses to a single column with the pass behind a tab. The same
queue also shows as the *In kitchen* column on the Delivery Orders board.

**Staff access** — `PERMS` lists every section of the CRM and `ROLES` gives the
two roles, Admin and Rider, their defaults. Adding a user asks for a role and then
lets you tick sections individually; the role is only the starting point. A Rider
user is also tied to a rider on the board (`riderId`), which is how his screen
knows whose drops to show.

**Install / offline** — `manifest.webmanifest` and `sw.js` at the project root.
The worker is network-first, so a deploy is picked up straight away and the cache
is only a fallback for a dropped connection. `assets/icon.svg` is the app icon.

## Notes

- All state is in memory. A reload resets the demo — nothing is persisted and there
  is no backend. The only things remembered are your theme and sidebar choice.
- The only network request is the Google Fonts stylesheet.
- The whole chain is connected: the AI agent takes an order in a chat, that order
  appears on the board for approval, moves through the kitchen column to a rider,
  and the moment the rider marks it delivered the customer gets a closing message,
  the cash moves onto that rider's sheet and the customer's history updates.
- Voice uses the browser's own speech engine, so how human it sounds depends on
  which voices the device has. The app ranks them and takes the best — the online
  "Natural" / "Neural" voices sound like a person, the built-in offline ones do
  not — and you can also pick one by hand in Settings → Notifications & voice. A
  pronunciation layer fixes the words an English engine mangles, so the owner
  reads as SHAH-NAWAAZ. For a voice that sounds the same on every device you need
  a cloud TTS service, which needs an API key and a small backend.
- Settings → WhatsApp is read-only: status, the number, and a way to reach Evexa
  AI at evexaai.com. Put your real account-manager details in `evexaModal()` in
  `js/app.js`.
- The original `Foodies Mania CRM.html` is kept as-is for reference.
