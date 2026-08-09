// One reusable price formatter, used everywhere. DRY.
export const formatPrice = (n) => `$${n.toFixed(2)}`

// Escape user/CMS-controlled strings before interpolating into innerHTML.
// The current data.js is a static local array so this isn't strictly needed
// today, but data.js is written to be swapped for a real endpoint later —
// once that data is not fully trusted, skipping this becomes an XSS bug.
// Cheap insurance now, no behavior change today.
const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c])

// cardTemplate builds ONE card. renderProducts handles the loop.
// Never write the same markup twice.
const cardTemplate = ({ id, name, price, image, category, description }) => `
  <article class="product-card">
    <div class="product-card__media">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(name)} kombucha bottle" loading="lazy" />
      <span class="product-card__tag">${escapeHtml(category)}</span>
    </div>
    <div class="product-card__body">
      <h3 class="product-card__name">${escapeHtml(name)}</h3>
      <p class="product-card__desc">${escapeHtml(description)}</p>
      <div class="product-card__footer">
        <span class="price">${formatPrice(price)}</span>
        <button class="btn-add" data-id="${escapeHtml(id)}">
          Add
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </article>
`

// Build the whole string once, then write innerHTML once. One DOM write, not N.
export const renderProducts = (list, container) => {
  container.innerHTML = list.map(cardTemplate).join("")
}

// Cart line item template.
const cartItemTemplate = ({ id, name, price, image, qty }) => `
  <div class="cart-item" data-line="${escapeHtml(id)}">
    <img class="cart-item__img" src="${escapeHtml(image)}" alt="" />
    <div class="cart-item__info">
      <p class="cart-item__name">${escapeHtml(name)}</p>
      <p class="cart-item__price">${formatPrice(price)}</p>
    </div>
    <div class="cart-item__qty">
      <button class="qty-btn" data-dec="${escapeHtml(id)}" aria-label="Decrease quantity">&minus;</button>
      <span aria-label="Quantity">${qty}</span>
      <button class="qty-btn" data-inc="${escapeHtml(id)}" aria-label="Increase quantity">+</button>
    </div>
    <button class="cart-item__remove" data-remove="${escapeHtml(id)}" aria-label="Remove ${escapeHtml(name)}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
      </svg>
    </button>
  </div>
`

const emptyTemplate = () => `
  <div class="cart-empty">
    <p class="cart-empty__title">Your cart is empty</p>
    <p class="cart-empty__note">Pick a drop before this week&apos;s batch runs out.</p>
  </div>
`

// Render the cart contents (or empty state) into the side-cart body.
export const renderCart = (cart, container) => {
  container.innerHTML = cart.length ? cart.map(cartItemTemplate).join("") : emptyTemplate()
}