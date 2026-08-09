// Stripe signs the webhook payload and expects to verify it against the RAW
// request bytes — Vercel's automatic JSON body parsing would corrupt that,
// so it's turned off below and the body is read manually.
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder")

export const config = {
  api: {
    bodyParser: false,
  },
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks)))
    req.on("error", reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("⚠️  STRIPE_WEBHOOK_SECRET is not set — set it in your Vercel project's env vars.")
    return res.status(500).json({ error: "Webhook secret not configured" })
  }

  const signature = req.headers["stripe-signature"]
  const rawBody = await readRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    // This server-to-server event is the trustworthy signal that money
    // actually moved — the browser reaching /success.html is not proof on
    // its own. Hook up real fulfillment here: save the order, send a
    // confirmation email, update inventory, etc.
    console.log("✅ Payment confirmed:", session.id, session.customer_details?.email)
  }

  res.status(200).json({ received: true })
}