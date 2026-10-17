# Foodies Mania CRM

WhatsApp order console — AI takes the order, you approve it, the kitchen cooks it,
a rider takes it to the door.

This is the single-file prototype (`Foodies Mania CRM.html`) split into a real
project. No build step, no framework, no dependencies — plain HTML, CSS and JS.

## Run it

```sh
node server.mjs      # or: npm run dev
```

Then open http://localhost:5500/ — the page live-reloads whenever you save a file
under `index.html`, `css/`, `js/` or `assets/`.

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
  That is the only way in, and it takes the whole dashboard. The kitchen screen no
  longer has its own full-screen button.
- **Kitchen lock** — the Kitchen page opens on one bar reading `Kitchen Manager`.
  The password is empty, so pressing the arrow enters. Put a real one in
  `S.set.kitchenPass` when you want it to bite. There is a Lock button on the
  kitchen screen to step back out.

## Where to change things

**Colours, fonts, spacing** — `css/styles.css`, the `:root` block at the top, and
the `html[data-theme="light"]` block right under it for the light palette.
Everything else reads from those variables, so changing `--or` reskins the app in
both themes.

`css/styles.css` is then sectioned: `login`, `app shell`, `primitives`, `KPI`,
`orders board`, `drawer & modal`, `conversations`, `kitchen`, `riders`,
`customers`, `bulk`, `menu`, `settings`, `responsive`, and the additions block at
the end (theme, sidebar, kitchen lock, category availability, thumbnails, roles).

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

**Menu availability** — a single item has a switch, and so does a whole category.
`isOn(item)` is the one check the AI agent uses; it is true only when the item and
its category are both on.

**Campaign thumbnails** — each entry in `TPL` (in the `BULK MESSAGE` section)
carries a `bg` gradient and three `art` icon ids. That is what draws the picture in
the phone preview, and it changes as you pick a different message. Swap in real
product photos by replacing `bg` with `url(assets/your-photo.jpg) center/cover`.

**Staff access** — `PERMS` lists every section of the CRM and `ROLES` gives Admin,
Kitchen and Rider their defaults. Adding a user asks for a role and then lets you
tick sections individually; the role is only the starting point.

## Notes

- All state is in memory. A reload resets the demo — nothing is persisted and there
  is no backend. The only things remembered are your theme and sidebar choice.
- The only network request is the Google Fonts stylesheet.
- Voice uses the browser's own speech engine, so how human it sounds depends on
  which voices the device has. The app ranks them and takes the best — the online
  "Natural" / "Neural" voices sound like a person, the built-in offline ones do
  not — and you can also pick one by hand in Settings → Notifications & voice. A
  pronunciation layer fixes the words an English engine mangles, so the owner
  reads as SHAH-NAWAAZ. For a voice that sounds the same on every device you need
  a cloud TTS service, which needs an API key and a small backend.
- The Evexa AI contact panel in Settings → WhatsApp links to `evexa.ai`. Put your
  real account-manager details in `evexaModal()` in `js/app.js`.
- The original `Foodies Mania CRM.html` is kept as-is for reference.
