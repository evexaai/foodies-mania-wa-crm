# Foodies Mania order desk

One screen for the website's orders. An order arrives, you approve it, and the
customer sees that it is on the way. Plain HTML, CSS and JavaScript, no build
step and no framework.

There is no WhatsApp in this, and no riders, kitchen screen, bulk messaging,
payments report or promotions. Those belonged to an earlier idea of what this
was for. What is left is what the counter actually does on a shift.

## The five pages

| | |
| --- | --- |
| **Dashboard** | Tonight at a glance: what needs approving, what is out, what has been taken, what is selling |
| **Orders** | The board. Every order, delivery and pickup, with Approve and Cancel on the card itself |
| **Live Conversations** | The chats happening on the website right now, and a box to answer in |
| **Menu Management** | The website's own menu, with a switch per item and per section, and the price |
| **Customers** | One row per phone number: what they order, how often, how much |

Settings holds the alert sound, installing the desk as an app, and a plain
statement of what it is connected to.

## Where everything comes from

Nothing here is sample data. Orders, customers and conversations are read from
the same Neon database the website writes to:

| | |
| --- | --- |
| `GET /api/orders` | the board, with each customer's history joined on |
| `POST /api/orders` | approve, cancel, mark delivered |
| `GET /api/chats` | the conversations, and one in full with `?device=` |
| `POST /api/chats` | answer in one, mark it read, or hand it back to the AI |
| `GET /api/menu` | what has been switched off or repriced |
| `POST /api/menu` | switch something off, or change a price |

The desk asks for news every six seconds while the tab is in front, and stops
when it is not. A change you make is sent at once and shown at once; if the
send fails, the board goes back to what the database last said and tells you so.

**Without `DATABASE_URL`** the API answers "no database" and the desk falls
back to listening to the browser, so an order placed on a website open in the
same browser still lands here. The header says **No database** when that
happens. Setting the database up is in the [README one level up](../README.md).

## The menu is not kept here

Both the website and this desk read one file, `website/js/menu.js`, which this
page loads before its own script. The items, prices, categories, delivery areas
and opening hours on this screen are literally the ones the customer is
ordering from, so the two cannot drift apart.

Menu Management writes only what changes during a night, an item or a section
switched off and a changed price, into `fm_menu`. The website re-reads that
every forty-five seconds, so switching something off here sells it out on the
site within seconds: the card goes grey, the Add button becomes **Sold out
tonight**, the agent stops offering it, and if it was already in somebody's
cart it comes out with a line telling them why.

To add a dish, change a description or change a photo, edit
`website/js/menu.js`. That file is the menu.

## Taking over a conversation

The chat on the website answers by itself. Every line of it, the customer's and
the agent's, is written to the database as it is said, and that is what Live
Conversations reads.

Write a reply and the agent in their page steps aside. From then on the
customer is talking to you, and the agent stays quiet until you press **Hand
back to AI**. Your reply reaches their screen within about five seconds,
labelled so they know it is a person.

## Signing in

Any login ID and password work. The desk sits behind the counter and the
sign-in only keeps the board off the screen while a phone is handed round. What
actually protects the orders is `STAFF_KEY` on the server: set it and the API
refuses anyone without it, and the desk asks for the key once and remembers it
on that computer.

## The rest of the controls

- **Light / dark**: the sun/moon button. Remembered between visits.
- **Sidebar**: the ☰ button collapses the rail to icons on a desktop and opens
  it as a drawer on a phone.
- **Sound**: a chime for a new order, and the customer's name read out if that
  is left on. A browser will not play a sound until the page has been clicked
  once, so click anywhere at the start of a shift.
- **Pop-ups**: every one has an x, and on a phone you can flick it away. The
  switch in the bell panel stops them appearing without stopping the count.
- **Full screen**: double-click the Foodies Mania mark at the top of the sidebar.
- **Install it**: Settings → Install the app, so it opens from the home screen
  with no address bar. A service worker keeps the shell available offline. Live
  orders are never cached, because a stale board shown as though it were live is
  worse than an empty one.

## Files

```
index.html                 the shell: icons, sign-in, the frame
css/base.css, styles.css   everything it looks like
js/app.js                  all of it: state, the API, the five pages
sw.js                      offline shell, network first
manifest.webmanifest       so it installs as an app
reference/                 the original single-file prototype, kept as it was
```

To run it, see the [README one level up](../README.md).
