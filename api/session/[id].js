// File-based dynamic route: this file handles GET /api/session/:id
// (the [id] part becomes req.query.id).
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.id)
    res.status(200).json({
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || null,
    })
  } catch (err) {
    res.status(404).json({ error: "Session not found" })
  }
}