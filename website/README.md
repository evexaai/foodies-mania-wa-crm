# Foodies Mania website

The customer-facing site, a chat widget, and a chat-to-order page. Orders from any
of them land on the CRM's **Delivery Orders** board, and the customer's tracker
follows the order as the counter works it.

## Run it

From the CRM folder (one level up):

```sh
node server.mjs
```

| | |
| --- | --- |
| Website | http://localhost:5500/website/ |
| Chat to order | http://localhost:5500/website/order-chat |
| CRM | http://localhost:5500/ (sign in as `shahnawaz` / `fm@2025`) |

To see an order go end to end, keep the CRM open and signed in in one tab, and
place an order on the website or in the chat in another tab of the same browser.

## Layout

```
index.html          the ordering site: hero, menu, cart, checkout, tracker, chat bubble
order-chat.html     WhatsApp-style chat ordering, with the order panel on the right
css/site.css        site design tokens and components (same palette as the CRM)
css/chat.css        the chat bubble and shared message styles
css/order-chat.css  the WhatsApp look for the chat page
js/menu.js          THE menu: categories, items, sizes, deals, areas, payment details
js/cart.js          one cart shared by the menu, the widget and the chat page
js/agent.js         the order-taking agent (demo brain, English + Roman Urdu)
js/chatui.js        draws a chat transcript for either chat surface
js/bridge.js        website ⇄ CRM: sends orders, receives status
js/site.js          the website page
js/order-chat.js    the chat page
tools/fetch-images.py  downloads the menu photos into assets/food/
```

## Where to change things

- **Prices, dishes, deals, delivery fees:** `js/menu.js`. Prices and deals come from
  foodies-mania.com. The delivery areas and fees match the CRM's list.
- **Payment account numbers:** `FM_PAY` in `js/menu.js`. They are **demo
  placeholders** and appear with a DEMO tag at checkout.
- **Photos:** each item's `img` is a Pexels photo id. Change it, then run
  `python tools/fetch-images.py` to download the new one. Pexels photos are free to
  use commercially, and no credit is required.
- **What the agent says:** `js/agent.js`. Every line exists in English and Roman Urdu,
  and the agent answers in whichever language the customer writes in.

## How the CRM link works (demo)

Both apps run on the same origin, so the browser connects them. The website puts
the order in `localStorage` (`fm.web.queue`) and announces it on the
`BroadcastChannel("fm-web")`. The CRM takes it, adds the customer if they're
new, and notifies the counter. Each status change goes back through
`fm.web.status`. This only works within one browser. With a real backend,
`Bridge.send()` and the status feed are the two pieces to swap for API calls.

Pickup orders show a **Handed over** button on the board instead of **Assign rider**.

## Connecting the LLM later

`Agent.think()` in `js/agent.js` is the one method to replace. Send it the
transcript, the cart and the menu, and act on the tool calls that come back
(`add_to_cart`, `remove_from_cart`, `set_details`, `place_order`). The cart,
checkout, CRM hand-off and tracking already work, so nothing else needs to
change. The API key must stay on a server, for example a Vercel function at
`/api/chat`. It must never go in this folder.
