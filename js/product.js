// product.js — Single watch detail page
import { api, isLoggedIn } from './api.js';

const container = document.getElementById('product-detail');
const id = new URLSearchParams(window.location.search).get('id');

async function init() {
  if (!id) {
    container.innerHTML = `<div class="notice notice-error">No watch ID provided.</div>`;
    return;
  }

  container.innerHTML = `<div class="notice" style="padding:32px;text-align:center;color:var(--text-faint);">Loading…</div>`;

  const { data, ok } = await api.get(`/products/${id}`);
  if (!ok || !data.product) {
    container.innerHTML = `<div class="notice notice-error">Watch not found.</div>`;
    return;
  }

  const p      = data.product;
  const images = p.imageUrls?.length ? p.imageUrls : [p.imageUrl].filter(Boolean);

  document.title = `${p.name} — Piyush Watch`;

  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <a href="/index.html" style="font-family:var(--font-mono);font-size:0.75rem;letter-spacing:0.1em;color:var(--red);">← Back to Collection</a>
    </div>
    <div class="product-detail">
      <!-- Images -->
      <div class="product-images">
        <img id="main-img" class="product-main-img" src="${images[0] || ''}" alt="${p.name}" />
        ${images.length > 1 ? `
        <div class="product-thumbs">
          ${images.map((url, i) => `
            <img class="product-thumb ${i === 0 ? 'active' : ''}" src="${url}" alt="View ${i+1}" data-idx="${i}" />
          `).join('')}
        </div>` : ''}
      </div>

      <!-- Info -->
      <div class="product-info-panel">
        <div class="product-brand-tag">// ${p.brand}</div>
        <h1 class="product-title">${p.name}</h1>

        <div class="product-price-big">₹${Number(p.price).toLocaleString('en-IN')}</div>

        <div class="notice" style="font-size:0.85rem;">
          ✅ Authentic &nbsp;·&nbsp; 🚚 Insured Delivery &nbsp;·&nbsp; 💳 Cash on Delivery
        </div>

        <div class="product-actions">
          <button id="btn-cart" class="btn">+ Add to Cart</button>
          <button id="btn-buy"  class="btn btn-primary">Buy Now</button>
        </div>

        <div id="prod-msg" class="notice hidden" style="margin-top:0;"></div>
      </div>
    </div>
  `;

  // Thumbnail switcher
  container.querySelectorAll('.product-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      container.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      document.getElementById('main-img').src = images[Number(thumb.dataset.idx)];
    });
  });

  const msgEl = document.getElementById('prod-msg');
  function showMsg(text, type = '') {
    msgEl.textContent = text;
    msgEl.className = 'notice' + (type ? ` notice-${type}` : '');
  }

  // Add to cart
  document.getElementById('btn-cart')?.addEventListener('click', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
    const btn = document.getElementById('btn-cart');
    btn.disabled = true;
    btn.textContent = '…';
    const { ok, message } = await api.post('/cart/add', { productId: id, quantity: 1 });
    btn.disabled = false;
    btn.textContent = '+ Add to Cart';
    if (ok) {
      showMsg('✓ Added to cart! Go to Cart to checkout.', 'success');
    } else {
      showMsg(message || 'Could not add to cart.', 'error');
    }
  });

  // Buy now — use inline modal
  document.getElementById('btn-buy')?.addEventListener('click', () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }
    openBuyModal();
  });

  // Inline buy modal
  const modalHtml = `
    <div id="buy-modal" class="modal-backdrop hidden">
      <div class="modal">
        <h2>Buy Now — COD</h2>
        <div style="margin-bottom:16px;">
          <div class="label">Delivery Address</div>
          <textarea id="buy-address" class="field" rows="3" placeholder="Enter your full delivery address…"></textarea>
        </div>
        <div class="notice" style="margin-bottom:4px;">Payment: <strong>Cash on Delivery</strong></div>
        <div class="modal-actions">
          <button id="buy-cancel" class="btn">Cancel</button>
          <button id="buy-confirm" class="btn btn-primary">Place Order</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  function openBuyModal() {
    document.getElementById('buy-address').value = '';
    document.getElementById('buy-modal').classList.remove('hidden');
  }

  document.getElementById('buy-cancel').addEventListener('click', () => {
    document.getElementById('buy-modal').classList.add('hidden');
  });

  document.getElementById('buy-confirm').addEventListener('click', async () => {
    const address = document.getElementById('buy-address').value.trim();
    if (!address) { alert('Please enter a delivery address.'); return; }

    const btn = document.getElementById('buy-confirm');
    btn.disabled = true;
    btn.textContent = 'Placing…';

    const { ok, message } = await api.post('/orders/checkout', {
      deliveryAddress: address,
      paymentMethod: 'COD',
      items: [{ productId: id, quantity: 1 }]
    });

    if (ok) {
      document.getElementById('buy-modal').classList.add('hidden');
      window.location.href = '/orders.html';
    } else {
      alert(message || 'Order failed.');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });
}

init();
