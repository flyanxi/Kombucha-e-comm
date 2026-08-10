# Kombucha e-commerce 🫙

A small-batch kombucha storefront — vanilla JS frontend (built with [Vite](https://vitejs.dev)) with a real Stripe Checkout integration, deployed on [Vercel](https://vercel.com).

*[Читать на русском](README.ru.md)*

Catalog grid, off-canvas cart, and a real payment flow: clicking **Checkout** creates a Stripe Checkout Session and redirects to Stripe's own hosted payment page — card numbers never touch this codebase, which is also what keeps you out of PCI-DSS scope.

## Stack

- Vite 6 — frontend build
- Vanilla JavaScript (ES modules, no framework)
- Vercel serverless functions (`api/`) — create Stripe sessions, verify webhooks
- [Stripe Checkout](https://stripe.com/docs/payments/checkout) — hosted payment page + webhooks

## Before you start: get Stripe keys

You need your own Stripe account — no payment credentials are (or should ever be) baked into this code.

Stripe gives you **two separate keys** — always use the right one for the situation:

| | Test key (`sk_test_...`) | Live key (`sk_live_...`) |
|---|---|---|
| **When to use it** | While building and testing | Only once you're ready to accept real payments from real customers |
| **Where to get it** | [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) — available immediately | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) — requires [activating your account](https://dashboard.stripe.com/account/onboarding) first (business details, bank account) |
| **Cards it accepts** | Only [Stripe's test cards](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) | Real cards only |
| **Does it charge money?** | No — completely free to use as much as you want | Yes — real charges, real payouts to your bank |
| **Webhook** | Its own separate webhook endpoint (`whsec_...`) | A **different**, separate webhook endpoint — test and live webhooks are independent, set both up separately |

Set up the webhook in Stripe Dashboard → Webhooks → Add destination → destination type **Webhook endpoint** (not Amazon EventBridge or Azure Event Grid), URL `https://your-project.vercel.app/api/webhook`, event `checkout.session.completed`; add the resulting signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`.

**Start here:**

1. Create a free account at [stripe.com](https://dashboard.stripe.com/register).
2. Grab your **test** secret key from [API keys](https://dashboard.stripe.com/test/apikeys) (starts with `sk_test_`).
3. Copy `.env.example` to `.env` and paste it in: STRIPE_SECRET_KEY=sk_test_...
4. Build and test everything end-to-end with the test key — see [Going live](#going-live) below for the checklist to switch to `sk_live_...` once you're actually ready to take real money.

## Getting started

```bash
npm install -g vercel     # one-time, if you don't have it
pnpm install               # or npm install
vercel link                 # links this folder to a Vercel project (creates one if needed)
cp .env.example .env
vercel dev                   # serves the frontend AND api/ functions together, at :3000
```

`vercel dev` is what makes `/api/checkout` etc. actually work locally — plain `vite dev` on its own won't run the serverless functions.

```bash
pnpm build      # builds the frontend to dist/, to sanity-check it compiles
```

## How the payment flow works

1. Person clicks **Checkout**. The browser sends only `{ id, qty }` pairs for cart items to `POST /api/checkout` — never a price.
2. `api/checkout.js` looks up the real price for each `id` from `js/data.js` (the same catalog the storefront renders from) and creates a Stripe Checkout Session with those server-verified line items.
3. The browser is redirected to Stripe's hosted checkout page (`session.url`) to enter card details.
4. Stripe redirects back to `/success.html?session_id=...` or `/cancel.html`.
5. `/success.html` asks `GET /api/session/:id` to look the session up; only once Stripe confirms `payment_status: "paid"` does it clear the local cart and show a confirmation.
6. Separately, Stripe also calls `POST /api/webhook` server-to-server when payment completes — this is the trustworthy signal for actually fulfilling an order (reaching `/success.html` alone isn't proof of payment, since someone could load that URL without ever paying). Hook your fulfillment logic (save the order, email a receipt, update inventory) into the `checkout.session.completed` handler in `api/webhook.js`.

## Project structure
├── index.html / success.html / cancel.html
├── css/styles.css
├── js/
│ ├── data.js # product catalog — single source of truth for prices
│ ├── cart.js # cart state + localStorage persistence
│ ├── render.js # DOM templates
│ ├── ui.js # toast + badge helpers
│ ├── main.js # event wiring, calls /api/checkout
│ └── success.js # confirms payment on the success page
├── api/
│ ├── checkout.js # POST /api/checkout — creates the Stripe session
│ ├── webhook.js # POST /api/webhook — verifies payment server-to-server
│ └── session/[id].js # GET /api/session/:id — used by success.html
├── public/
└── .env.example
## Deploying

```bash
vercel --prod
```

Or connect the GitHub repo directly in the Vercel dashboard — it'll auto-deploy on every push to `main`, plus a preview deployment for every PR. No custom CI workflow needed; Vercel's own GitHub integration handles it.

Either way, set your environment variables in **Vercel → Project → Settings → Environment Variables**:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (see above)

Note: preview deployments get their own URL each time, so a webhook pointed at your production domain won't fire for previews.

## Going live

When you're ready to accept real money:

1. [Activate your Stripe account](https://dashboard.stripe.com/account/onboarding) (business details, bank account) — required before live charges work.
2. Swap `sk_test_...` for your **live** secret key (`sk_live_...`) in Vercel's env vars, and set up a separate live-mode webhook endpoint in Stripe (test and live webhooks are independent).
3. Depending on where you're based and what you're selling, you may have obligations around sales tax/VAT, business registration, and consumer protection law for shipping food/beverage products — worth a quick check with an accountant or lawyer for your jurisdiction before launch. [Stripe Tax](https://stripe.com/tax) can help automate tax calculation if you go that route.

## Things to know

- **Cart is localStorage only** — per-browser, not synced across devices or tied to an account.
- **No inventory tracking or order database** — the webhook handler currently just logs; wire it up to a database (e.g. Vercel Postgres, Supabase) if you need real order records.
- **Product images are placeholders** — swap the files in `public/images/` for real photography before shipping.
- **No tests** — `cart.js` is pure functions and would be the easiest place to start.