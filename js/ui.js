// Small, reusable UI feedback helpers. Each does one job and is called from
// exactly one place in main.js.
import { getItemCount } from "./cart.js"

const badge = document.querySelector("[data-badge]")

export const updateBadge = () => {
  const count = getItemCount()
  badge.textContent = count
  badge.classList.toggle("is-active", count > 0)
}

// Reusable, self-cleaning toast. No library needed.
export const showToast = (message) => {
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.setAttribute("role", "status")
  toast.textContent = message
  document.body.appendChild(toast)

  // Next frame -> add class so the CSS transition actually runs.
  requestAnimationFrame(() => toast.classList.add("is-visible"))

  setTimeout(() => {
    toast.classList.remove("is-visible")
    toast.addEventListener("transitionend", () => toast.remove(), { once: true })
  }, 2200)
}