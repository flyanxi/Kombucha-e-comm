Languages: [English](README.md) | [Русский](README.ru.md)
---
# Kombucha E-Commerce 🫙

A modern, small-batch kombucha storefront featuring a seamless shopping experience and secure payment processing. Built with Vanilla JS and Vite, integrated with Stripe Checkout, and powered by Vercel Serverless Functions.

## Project Features

* **Dynamic Storefront:** Interactive catalog grid and an off-canvas shopping cart with persistent `localStorage` state.
* **Secure Payments:** Full Stripe Checkout integration (PCI-DSS compliant). Payment credentials never touch the codebase.
* **Serverless Architecture:** Vercel API routes (`api/`) securely handle checkout session creation and server-to-server webhook verification.
* **Trustworthy Order Flow:** Verifies actual payment success via Stripe webhooks before confirming orders, preventing client-side manipulation.

## Technologies

* **Frontend:** Vanilla JavaScript (ES modules, no bloated frameworks), HTML5, custom CSS.
* **Build Tool:** Vite 6.
* **Backend:** Vercel Serverless Functions (Node.js).
* **Payment Gateway:** Stripe Checkout API & Webhooks.

## How to Run Locally

*Note: You must use Vercel CLI to run this project locally so the `/api` serverless functions work correctly.*

1. Clone the repository and install dependencies: `npm install`
2. Create a Stripe account and get your Test API keys.
3. Copy `.env.example` to `.env` and add your `STRIPE_SECRET_KEY`.
4. Run the local development server: `vercel dev` (serves both frontend and API on port 3000).

## Deployment & Going Live

Deploy directly via Vercel's GitHub integration. When switching to production:
1. Update Vercel Environment Variables with your **Live** Stripe keys.
2. Set up a production webhook in the Stripe Dashboard (`checkout.session.completed`) and add the `STRIPE_WEBHOOK_SECRET`.