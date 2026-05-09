// cart.js — Cart page
import { api, isLoggedIn } from './api.js';

if (!isLoggedIn()) window.location.href = '/login.html';

const cartItemsEl  = document.getElementById('cart-items');
const cartTotalEl  = document.getElementById('cart-total');
const cartNoticeEl = document.getElementById('cart-notice');
const proceedBtn   = document.getElementById('proceed-btn');

// Checkout modal
const modal          = document.getElementById('checkout-modal');
const addressInput   = document.getElementById('checkout-address');
const cancelBtn      = document.getElementById('checkout-cancel');
const placeBtn       = document.getElementById('checkout-place');

let cartData = { items: [], cartTotal: 0 };

function showNotice(msg, type = '') {
  cartNoticeEl.textContent = msg;
  cartNoticeEl.className = 'notice' + (type ? ` notice-${type}` : '');
  cartNoticeEl.classList.remove('hidden');
}

function renderCart() {
  const { items, cartTotal } = cartData;

  if (!items || items.length === 0) {
    cartItemsEl.innerHTML = `<div class="notice" style="text-align:center;padding:40px;">
      Your cart is empty. <a href="/index.html" style="color:var(--red);">Browse watches →</a>
    </div>`;
    cartTotalEl.textContent = '₹0';
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
        <div class="cart-item-price">₹${Number(p.price).toLocaleString('en-IN')} × ${it.quantity} = ₹${Number(it.lineTotal).toLocaleString('en-IN')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn btn-sm" data-action="dec" data-id="${it.productId}" data-qty="${it.quantity}">−</button>
          <span style="font-family:var(--font-mono);font-size:0.9rem;min-width:20px;text-align:center;">${it.quantity}</span>
          <button class="btn btn-sm" data-action="inc" data-id="${it.productId}" data-qty="${it.quantity}">+</button>
        </div>
        <button class="btn btn-sm" data-action="remove" data-id="${it.productId}" style="color:var(--red);border-color:var(--red);">Remove</button>
      </div>
    </div>`;
  }).join('');

  cartTotalEl.textContent = `₹${Number(cartTotal).toLocaleString('en-IN')}`;

  // Qty / remove handlers
  cartItemsEl.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const pid    = btn.dataset.id;
      const qty    = Number(btn.dataset.qty);

      if (action === 'inc') await updateQty(pid, qty + 1);
      if (action === 'dec') await updateQty(pid, qty - 1);
      if (action === 'remove') await updateQty(pid, 0);
    });
  });
}

async function loadCart() {
  cartItemsEl.innerHTML = `<div class="notice" style="padding:24px;color:var(--text-faint);">Loading…</div>`;
  const { data, ok } = await api.get('/cart');
  if (ok) {
    cartData = data;
    renderCart();
  } else {
    showNotice('Failed to load cart.', 'error');
  }
}

async function updateQty(productId, quantity) {
  const { ok, message } = await api.post('/cart/update', { productId, quantity });
  if (ok) {
    await loadCart();
  } else {
    showNotice(message || 'Update failed.', 'error');
  }
}

// Proceed button opens modal
proceedBtn?.addEventListener('click', () => {
  if (!cartData.items || cartData.items.length === 0) {
    showNotice('Your cart is empty.', 'error');
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
    // No items array → server uses cart
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

loadCart();
