// The cart is the single source of truth. localStorage is just a snapshot so a
// refresh doesn't wipe it.
const KEY = "rawdrops_cart"

// Basic shape check so a stale/corrupt snapshot from an older version of the
// site can't crash the render layer (e.g. after a product schema change).
function isValidLine(item) {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    typeof item.qty === "number" &&
    item.qty > 0
  )
}

// Load once on startup. Fall back to [] if nothing is saved, corrupt, or the
// wrong shape.
let cart = load()

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY))
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidLine)
  } catch {
    return []
  }
}

// The ONLY function that touches storage. Call it after every change. DRY.
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {
    // storage full or unavailable (private browsing) — fail silently,
    // cart still works for the rest of the session
  }
}

export const getCart = () => cart

export const addToCart = (product) => {
  const existing = cart.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += 1 // already there -> bump the quantity
  } else {
    cart.push({ ...product, qty: 1 }) // spread copy + new field, original untouched
  }
  persist()
}

export const removeFromCart = (id) => {
  cart = cart.filter((item) => item.id !== id)
  persist()
}

// Change quantity by a delta. Removes the line if it hits zero.
export const changeQty = (id, delta) => {
  const item = cart.find((i) => i.id === id)
  if (!item) return
  item.qty += delta
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== id)
  }
  persist()
}

export const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0)

export const getItemCount = () => cart.reduce((sum, item) => sum + item.qty, 0)

// Called on the success page once Stripe confirms the payment went through.
export const clearCart = () => {
  cart = []
  persist()
}