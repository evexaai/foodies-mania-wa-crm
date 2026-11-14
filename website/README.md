# Foodies Mania website

The customer-facing site, a chat widget, and a chat-to-order page. Orders from any
of them land on the dashboard's **Delivery Orders** board, and the customer's tracker
follows the order as the counter works it.

## Run it

From the main folder (one level up):

```sh
node server.mjs
```

| | |
| --- | --- |
| Website | http://localhost:5500/website/ |
| Chat to order | http://localhost:5500/website/order-chat |
| Dashboard | http://localhost:5500/dashboard/ (sign in as `shahnawaz` / `fm@2025`) |

To see an order go end to end, keep the dashboard open and signed in in one tab, and
place an order on the website or in the chat in another tab of the same browser.

## Layout

```
index.html          the ordering site: hero, menu, cart, checkout, tracker, chat bubble
order-chat.html     ordering by chat, with the order panel on the right
css/site.css        site design tokens and components (same palette as the desk)
css/chat.css        the chat bubble and shared message styles
css/order-chat.css  the look of the chat page
js/menu.js          THE menu: categories, items, sizes, deals, areas, payment details
js/cart.js          one cart shared by the menu, the widget and the chat page
js/agent.js         the order-taking agent (demo brain, English + Roman Urdu)
js/chatui.js        draws a chat transcript for either chat surface
js/bridge.js        website ⇄ order desk: sends orders, receives the answer
js/site.js          the website page
js/order-chat.js    the chat page
tools/fetch-images.py  downloads the menu photos into assets/food/
```

## Where to change things

- **Prices, dishes, deals, delivery fees:** `js/menu.js`. Prices and deals come from
  foodies-mania.com. The order desk reads this same file, so the two cannot drift apart.
- **Payment account numbers:** `FM_PAY` in `js/menu.js`. They are **demo
  placeholders** and appear with a DEMO tag at checkout.
- **Photos:** each item's `img` is a Pexels photo id. Change it, then run
  `python tools/fetch-images.py` to download the new one. Pexels photos are free to
  use commercially, and no credit is required.
- **What the agent says:** `js/agent.js`. Every line exists in English and Roman Urdu,
  and the agent answers in whichever language the customer writes in.

## Where an order goes

An order leaves the checkout by two roads at once, and either one alone is
enough. It is written to the database behind `/api/order`, which is where the
dashboard reads it from, and it is also queued in this browser, which is how
the demo works with no database at all. An order placed with no signal waits
in an outbox and goes the moment there is one.

Coming back, the customer is told one thing: whether the restaurant has taken
the order on. They never sign in. The browser keeps a device id, the order
carries it, and the server only hands back orders bearing the id it was asked
with, so an order number on its own opens nothing.

## How the order desk link works

The database is the link. An order goes to `POST /api/order`, the desk reads it
from `/api/orders`, and the answer comes back to this page on its next poll.
Delivery and pickup travel the same way; the desk shows which it is and offers
**Delivered** or **Picked up** accordingly.

The browser bridge is still there underneath, as a fallback: the order is also
put in `localStorage` (`fm.web.queue`) and announced on
`BroadcastChannel("fm-web")`, which is how the whole thing works on a laptop
with no connection, as long as both are open in the same browser.

**The chat is linked too.** Every line of a conversation, the customer's and
the agent's, is copied to `POST /api/chat`, so the counter can read it while it
is happening. If somebody there answers, the reply arrives here within about
five seconds, the agent steps aside, and the customer is talking to a person
until the counter hands it back.

**The menu is linked too.** `GET /api/menu` says what the counter has switched
off or repriced, and this site re-reads it every forty-five seconds. A
sold-out item goes grey, its Add button becomes **Sold out tonight**, the agent
stops offering it, and if it was already in the cart it comes out with a line
saying why.

## Connecting the LLM later

`Agent.think()` in `js/agent.js` is the one method to replace. Send it the
transcript, the cart and the menu, and act on the tool calls that come back
(`add_to_cart`, `remove_from_cart`, `set_details`, `place_order`). The cart,
checkout, CRM hand-off and tracking already work, so nothing else needs to
change. The API key must stay on a server, in a Vercel function alongside the ones in
`api/`. It must never go in this folder.
