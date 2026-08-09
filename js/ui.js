// wiring & event listeners
import { products } from "./data.js"
import { renderProducts, renderCart, formatPrice } from "./render.js"
import { getCart, addToCart, removeFromCart, changeQty, calculateTotal } from "./cart.js"
import { updateBadge, showToast } from "./ui.js"

/* ---------- element refs ---------- */
const catalog = document.querySelector("[data-catalog]")
const cartPanel = document.querySelector("[data-cart]")
const overlay = document.querySelector("[data-overlay]")
const cartItemsEl = document.querySelector("[data-cart-items]")
const cartTotalEl = document.querySelector("[data-cart-total]")
const openBtn = document.querySelector("[data-cart-open]")
const closeBtn = document.querySelector("[data-cart-close]")
const checkoutBtn = document.querySelector("[data-checkout]")
const header = document.querySelector("[data-header]")

/* ---------- helper: repaint everything that reflects cart state ---------- */
const syncCartUI = () => {
  renderCart(getCart(), cartItemsEl)
  cartTotalEl.textContent = formatPrice(calculateTotal())
  updateBadge()
}

/* ---------- off-canvas open / close ---------- */
const openCart = () => {
  overlay.hidden = false
  // next frame so the overlay can transition its opacity in
  requestAnimationFrame(() => {
    cartPanel.classList.add("is-open")
    overlay.classList.add("is-open")
  })
  cartPanel.setAttribute("aria-hidden", "false")
  openBtn.setAttribute("aria-expanded", "true")
  document.body.classList.add("no-scroll")
  closeBtn.focus() // move focus into the panel for keyboard/screen-reader users
}

const closeCart = () => {
  cartPanel.classList.remove("is-open")
  overlay.classList.remove("is-open")
  cartPanel.setAttribute("aria-hidden", "true")
  openBtn.setAttribute("aria-expanded", "false")
  document.body.classList.remove("no-scroll")
  // hide the overlay from the a11y tree after it fades out
  overlay.addEventListener("transitionend", () => (overlay.hidden = true), { once: true })
  openBtn.focus() // return focus to the trigger that opened the panel
}

/* ---------- initial paint ---------- */
renderProducts(products, catalog)
syncCartUI() // reflect any persisted cart on load

/* ---------- event delegation: ONE listener for all "Add" buttons ---------- */
catalog.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-add")
  if (!btn) return
  const product = products.find((p) => p.id === btn.dataset.id)
  addToCart(product)
  syncCartUI()
  showToast(`${product.name} added to cart`)
})

/* ---------- event delegation inside the cart (qty + remove) ---------- */
cartItemsEl.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]")
  const dec = e.target.closest("[data-dec]")
  const rem = e.target.closest("[data-remove]")

  if (inc) changeQty(inc.dataset.inc, 1)
  else if (dec) changeQty(dec.dataset.dec, -1)
  else if (rem) removeFromCart(rem.dataset.remove)
  else return

  syncCartUI()
})

/* ---------- open / close wiring ---------- */
openBtn.addEventListener("click", openCart)
closeBtn.addEventListener("click", closeCart)
overlay.addEventListener("click", closeCart)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart()
})

checkoutBtn.addEventListener("click", async () => {
  const cart = getCart()
  if (!cart.length) {
    showToast("Your cart is empty")
    return
  }

  checkoutBtn.disabled = true
  const originalLabel = checkoutBtn.textContent
  checkoutBtn.textContent = "Redirecting…"

  try {
    // Send only id + qty — the server looks up the real price from its own
    // product catalog. Never trust a price the browser sends you.
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((item) => ({ id: item.id, qty: item.qty })),
      }),
    })

    if (!res.ok) throw new Error("Checkout request failed")
    const { url } = await res.json()
    if (!url) throw new Error("No checkout URL returned")

    window.location.href = url // hand off to Stripe's hosted payment page
  } catch (err) {
    console.error(err)
    showToast("Couldn't start checkout — please try again")
    checkoutBtn.disabled = false
    checkoutBtn.textContent = originalLabel
  }
})

/* ---------- subtle header shadow on scroll ---------- */
window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8)
}, { passive: true })