// shop.js — Homepage product listing, search, sidebar brands, buy now modal
import { api, isLoggedIn } from './api.js';

const brandList   = document.getElementById('brand-list');
const grid        = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const searchBtn   = document.getElementById('search-btn');
const clearBtn    = document.getElementById('clear-btn');

let activeBrand = '';

// ── Render ────────────────────────────────────────────────────────────────

function renderBrands(brands) {
  if (!brandList) return;
  brandList.innerHTML = '';

  // "All" option
  const all = document.createElement('div');
  all.className = 'side-item' + (activeBrand === '' ? ' active' : '');
  all.textContent = 'All Series';
  all.addEventListener('click', () => { activeBrand = ''; loadProducts(); renderBrands(brands); });
  brandList.appendChild(all);

  brands.forEach((b) => {
    const el = document.createElement('div');
    el.className = 'side-item' + (activeBrand === b ? ' active' : '');
    el.textContent = b;
    el.addEventListener('click', () => {
      activeBrand = b;
      loadProducts();
      renderBrands(brands);
    });
    brandList.appendChild(el);
  });
}

function renderProducts(products) {
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `<div class="notice" style="grid-column:1/-1;text-align:center;padding:40px;">
      No watches found. Try a different search or series.
    </div>`;
    return;
  }

  grid.innerHTML = products.map((p) => {
    const img = p.imageUrl
      ? `<img class="card-img" src="${p.imageUrl}" alt="${p.name}" loading="lazy" />`
      : `<div class="card-img-placeholder">⌚</div>`;

    return `
    <div class="card" data-id="${p._id}">
      <div class="card-badge">${p.brand}</div>
      <a href="/product.html?id=${p._id}" class="card-img-wrap" style="text-decoration:none;">
        ${img}
      </a>
      <div class="card-body">
        <div class="card-brand">${p.brand}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-price">₹${Number(p.price).toLocaleString('en-IN')}</div>
        <div class="card-actions">
          <button class="btn btn-sm" data-action="cart" data-id="${p._id}">+ Cart</button>
          <button class="btn btn-primary btn-sm" data-action="buy" data-id="${p._id}" data-name="${p.name}" data-price="${p.price}">Buy Now</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Attach action listeners
  grid.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id     = btn.dataset.id;
      if (action === 'cart')   handleAddToCart(id, btn);
      if (action === 'buy')    openBuyModal(id, btn.dataset.name, Number(btn.dataset.price));
    });
  });
}

// ── Data loading ──────────────────────────────────────────────────────────

async function loadBrands() {
  const { data } = await api.get('/products/brands');
  renderBrands(data.brands || []);
}

async function loadProducts() {
  if (grid) grid.innerHTML = `<div class="notice" style="grid-column:1/-1;padding:24px;color:var(--text-faint);">Loading watches…</div>`;

  const search = searchInput?.value.trim() || '';
  const params = new URLSearchParams();
  if (activeBrand) params.set('brand', activeBrand);
  if (search)       params.set('search', search);

  const { data, ok } = await api.get(`/products?${params.toString()}`);
  if (ok) {
    renderProducts(data.products || []);
  } else {
    if (grid) grid.innerHTML = `<div class="notice notice-error" style="grid-column:1/-1;">Failed to load watches.</div>`;
  }
}

// ── Cart ──────────────────────────────────────────────────────────────────

async function handleAddToCart(productId, btn) {
  if (!isLoggedIn()) {
    window.location.href = `/login.html`;
    return;
  }

  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '…';

  const { ok, message } = await api.post('/cart/add', { productId, quantity: 1 });

  btn.disabled = false;
  if (ok) {
    btn.textContent = '✓ Added';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  } else {
    btn.textContent = orig;
    alert(message || 'Could not add to cart.');
  }
}

// ── Buy Now Modal ─────────────────────────────────────────────────────────

const buyModal   = document.getElementById('buy-now-modal');
const buyCancel  = document.getElementById('buy-cancel');
const buyPlace   = document.getElementById('buy-place');
const buyAddress = document.getElementById('buy-address');

let buyProductId = null;

function openBuyModal(productId) {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }
  buyProductId = productId;
  if (buyAddress) buyAddress.value = '';
  buyModal?.classList.remove('hidden');
}

buyCancel?.addEventListener('click', () => buyModal?.classList.add('hidden'));
buyModal?.addEventListener('click', (e) => {
  if (e.target === buyModal) buyModal.classList.add('hidden');
});

buyPlace?.addEventListener('click', async () => {
  const address = buyAddress?.value.trim();
  if (!address) { alert('Please enter a delivery address.'); return; }

  buyPlace.disabled = true;
  buyPlace.textContent = 'Placing…';

  const { ok, message } = await api.post('/orders/checkout', {
    deliveryAddress: address,
    paymentMethod: 'COD',
    items: [{ productId: buyProductId, quantity: 1 }]
  });

  if (ok) {
    buyModal.classList.add('hidden');
    window.location.href = '/orders.html';
  } else {
    alert(message || 'Order failed. Please try again.');
    buyPlace.disabled = false;
    buyPlace.textContent = 'Place Order';
  }
});

// ── Search ────────────────────────────────────────────────────────────────

searchBtn?.addEventListener('click', loadProducts);
clearBtn?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  loadProducts();
});
searchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadProducts();
});

// ── Init ──────────────────────────────────────────────────────────────────

loadBrands();
loadProducts();
