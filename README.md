# K's Kitchen by Koral: order management demo

A working demo for a vegetarian home kitchen in Mumbai that currently takes orders
over WhatsApp. One flow, end to end: a customer places an order on the public site,
it shows up on the admin dashboard, and the chef moves it through the pipeline.
No payments, riders, or login. That is by design.

Instagram: [@kskitchen_by_koral_](https://www.instagram.com/kskitchen_by_koral_/)

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173).

- **Customer site:** `/`. Mobile-first; open it in a phone-sized window or device emulation.
- **Admin dashboard:** `/admin`. Pipeline sidebar (Open → Accepted → Ready to deliver → Completed), order cards with WhatsApp chat buttons.
- **Menu management:** `/admin/menu`. Add, edit, delete, availability toggle.

`npm run build` produces a static bundle in `dist/` you can host anywhere.

## Try the whole flow

1. On `/`, add a few dishes, tap the cart bar, fill the one-step checkout (Lodha Park
   is the default customer type; tick **Jain preparation** and add a free-from note),
   and place the order.
2. Open `/admin`: the order is in **Open** with the Jain flag and note on the card.
   If both tabs are open, it appears without even refreshing.
3. **Accept** it, then **Mark ready**, then **Mark completed**.
4. On `/admin/menu`, toggle an item unavailable or edit its price, and the customer
   menu updates immediately.

## What was chosen and why

- **React only (Vite), no backend.** Per the demo brief. Data lives in
  `localStorage`, behind a small data layer (`src/lib/store.js`) whose tables mirror
  the real schema (`customers`, `menu_items`, `orders`, `order_items`), including
  the nullable future columns (`payment_method`, `paid`, `paid_at`, `rider_id`).
  The UI only talks to that module's functions (`listOrders`, `createOrder`,
  `setOrderStatus`, …), so swapping in a real API + Postgres later means rewriting
  one file, not the UI.
- **Repeat customers** are recognised by phone number: type a known number at
  checkout and the address fields prefill.
- **No auth**, all pages reachable by URL. The admin routes are already separated
  under `/admin`, so a login guard can wrap that route group later.
- **Clean URLs** (`/admin`, no `#`). The dev server handles this out of the box;
  a static host needs an SPA fallback to `index.html` (a `public/_redirects` file
  for Netlify is included; most hosts have an equivalent one-liner).
- Dish photos are free-license placeholders from Wikimedia Commons
  (`public/images/ATTRIBUTION.md`), to be replaced with K's Kitchen's own photos.

## Resetting demo data

All data is in your browser. To start fresh, run
`localStorage.removeItem('kk_db_v1')` in the devtools console (or clear site data)
and reload; the menu re-seeds with 25 dishes across North Indian, Gujarati,
Japanese, Italian, and Dessert.

## Out of scope (left ready to add)

Payments (cash/UPI), riders, analytics, per-item customisation, WhatsApp API
automation, accounts: the schema and structure anticipate all of these without
needing a migration or rework.
