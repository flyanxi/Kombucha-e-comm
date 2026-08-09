import { clearCart } from "./cart.js"

const eyebrowEl = document.querySelector("[data-status-eyebrow]")
const titleEl = document.querySelector("[data-status-title]")
const noteEl = document.querySelector("[data-status-note]")
const summaryEl = document.querySelector("[data-summary]")

const params = new URLSearchParams(window.location.search)
const sessionId = params.get("session_id")

const formatMoney = (cents, currency) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency?.toUpperCase() || "USD" }).format(
    (cents || 0) / 100,
  )

async function confirmOrder() {
  if (!sessionId) {
    eyebrowEl.textContent = "Something's missing"
    titleEl.textContent = "No order found"
    noteEl.textContent = "This page is only meant to be reached from Stripe after checkout."
    return
  }

  try {
    const res = await fetch(`/api/session/${encodeURIComponent(sessionId)}`)
    if (!res.ok) throw new Error("Session lookup failed")
    const session = await res.json()

    if (session.status === "paid") {
      // Only clear the cart once the server confirms payment actually went
      // through — never clear it just because this page loaded.
      clearCart()

      eyebrowEl.textContent = "Payment confirmed"
      titleEl.textContent = "Thanks for your order!"
      noteEl.textContent = session.customerEmail
        ? `A receipt is on its way to ${session.customerEmail}.`
        : "Your drops are being packed for the next brew-day shipment."

      summaryEl.hidden = false
      summaryEl.textContent = `Total charged: ${formatMoney(session.amountTotal, session.currency)}`
    } else {
      eyebrowEl.textContent = "Payment pending"
      titleEl.textContent = "Still processing"
      noteEl.textContent = "Your payment hasn't been confirmed yet. If this doesn't update shortly, contact support."
    }
  } catch (err) {
    console.error(err)
    eyebrowEl.textContent = "Couldn't confirm"
    titleEl.textContent = "Something went wrong"
    noteEl.textContent = "We couldn't verify this order right now. Check your email for a Stripe receipt."
  }
}

confirmOrder()