// profile.js — My Profile page
import { api, isLoggedIn, getUser } from './api.js';

if (!isLoggedIn()) window.location.href = '/login.html';

const avatarEl    = document.getElementById('profile-avatar');
const nameEl      = document.getElementById('profile-name');
const emailEl     = document.getElementById('profile-email');
const mobileEl    = document.getElementById('profile-mobile');
const cartItemsEl = document.getElementById('profile-cart-items');
const cartTotalEl = document.getElementById('profile-cart-total');
const proceedBtn  = document.getElementById('profile-proceed');

// Checkout modal
const modal        = document.getElementById('checkout-modal');
const addressInput = document.getElementById('checkout-address');
const cancelBtn    = document.getElementById('checkout-cancel');
const placeBtn     = document.getElementById('checkout-place');

let cartData = { items: [], cartTotal: 0 };

// ── Profile info ──────────────────────────────────────────────────────────

async function loadProfile() {
  const { data, ok } = await api.get('/auth/me');
  const u = ok ? data.user : getUser();
  if (!u) return;

  if (avatarEl) avatarEl.textContent = (u.name || '?')[0].toUpperCase();
  if (nameEl)   nameEl.textContent   = u.name   || '—';
  if (emailEl)  emailEl.textContent  = u.email  || '—';
  if (mobileEl) mobileEl.textContent = u.mobileNumber || '—';
}

// ── Cart summary ──────────────────────────────────────────────────────────

function renderCartItems() {
  if (!cartItemsEl) return;
  const { items, cartTotal } = cartData;

  if (!items || items.length === 0) {
    cartItemsEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">
      Cart is empty. <a href="/index.html" style="color:var(--red);">Browse watches →</a>
    </div>`;
    if (cartTotalEl) cartTotalEl.textContent = '₹0';
    return;
  }

  cartItemsEl.innerHTML = items.map((it) => {
    const p = it.product;
    const img = p.imageUrl
      ? `<img class="cart-item-img" src="${p.imageUrl}" alt="${p.name}" />`
      : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--text-faint);">⌚</div>`;

    return `
    <div class="cart-item">
      ${img}
      <div class="cart-item-info">
        <div class="cart-item-brand">${p.brand}</div>
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">₹${Number(p.price).toLocaleString('en-IN')} × ${it.quantity}</div>
      </div>
      <div style="font-family:var(--font-mono);color:var(--amber);font-size:0.95rem;flex-shrink:0;">
        ₹${Number(it.lineTotal).toLocaleString('en-IN')}
      </div>
    </div>`;
  }).join('');

  if (cartTotalEl) cartTotalEl.textContent = `₹${Number(cartTotal).toLocaleString('en-IN')}`;
}

async function loadCart() {
  const { data, ok } = await api.get('/cart');
  if (ok) {
    cartData = data;
    renderCartItems();
  }
}

// ── Checkout ──────────────────────────────────────────────────────────────

proceedBtn?.addEventListener('click', () => {
  if (!cartData.items || cartData.items.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  if (addressInput) addressInput.value = '';
  modal?.classList.remove('hidden');
});

cancelBtn?.addEventListener('click', () => modal?.classList.add('hidden'));
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

placeBtn?.addEventListener('click', async () => {
  const address = addressInput?.value.trim();
  if (!address) { alert('Please enter a delivery address.'); return; }

  placeBtn.disabled = true;
  placeBtn.textContent = 'Placing…';

  const { ok, message } = await api.post('/orders/checkout', {
    deliveryAddress: address,
    paymentMethod: 'COD'
  });

  if (ok) {
    modal.classList.add('hidden');
    window.location.href = '/orders.html';
  } else {
    alert(message || 'Order failed.');
    placeBtn.disabled = false;
    placeBtn.textContent = 'Place Order';
  }
});

// ── Init ──────────────────────────────────────────────────────────────────

loadProfile();
loadCart();
