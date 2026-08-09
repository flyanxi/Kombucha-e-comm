// Vercel serverless function — one per file, routed automatically by
// filename: this handles POST /api/checkout.
import Stripe from "stripe"
import { products } from "../js/data.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty" })
    }

    // Vercel gives you the deployment's own URL for free (VERCEL_URL) so
    // preview deployments work without manually setting PUBLIC_URL each
    // time. Set PUBLIC_URL yourself once you're on a custom domain.
    const publicUrl = (
      process.env.PUBLIC_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${req.headers.host}`)
    ).replace(/\/$/, "")

    const line_items = items.map(({ id, qty }) => {
      const product = products.find((p) => p.id === id)
      if (!product) throw new Error(`Unknown product id: ${id}`)

      const quantity = Math.min(50, Math.max(1, Math.floor(Number(qty) || 1)))

      return {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(product.price * 100), // Stripe wants integer cents
          product_data: {
            name: product.name,
            description: product.description,
            images: [`${publicUrl}${product.image}`],
          },
        },
      }
    })

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${publicUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "EE", "LV", "LT", "DE", "FR"],
      },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error("Checkout error:", err.message)
    res.status(500).json({ error: "Could not start checkout" })
  }
}