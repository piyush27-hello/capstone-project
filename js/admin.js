// admin.js — Admin Panel
import { api, isLoggedIn, getUser } from './api.js';

// Aliases so the rest of the file reads clearly
const apiUpload      = (path, fd) => api.postForm(path, fd);
const apiUploadPatch = (path, fd) => api.patchForm(path, fd);

// Guard: must be logged-in admin
if (!isLoggedIn()) window.location.href = '/login.html';

// ── Add Product Form ──────────────────────────────────────────────────────

const addForm      = document.getElementById('add-product-form');
const prodName     = document.getElementById('prod-name');
const prodBrand    = document.getElementById('prod-brand');
const prodPrice    = document.getElementById('prod-price');
const prodImage    = document.getElementById('prod-image');
const addStatus    = document.getElementById('admin-product-status');

async function loadBrandsForSelect() {
  const { data } = await api.get('/products/brands');
  const brands = data.brands || [];
  const watchSeries = ['G-Shock', 'Edifice', 'Oceanus', 'Pro Trek', 'Databank', 'Sheen', 'Baby-G', 'Wave Ceptor', 'Other'];
  const all = [...new Set([...watchSeries, ...brands])];
  if (prodBrand) {
    prodBrand.innerHTML = all.map(b => `<option value="${b}">${b}</option>`).join('');
  }
}

function showAddStatus(msg, type = '') {
  if (!addStatus) return;
  addStatus.textContent = msg;
  addStatus.className = 'notice' + (type ? ` notice-${type}` : '');
  addStatus.classList.remove('hidden');
  setTimeout(() => addStatus.classList.add('hidden'), 4000);
}

addForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const files = prodImage?.files;
  if (!files || files.length === 0) { showAddStatus('Please select at least one image.', 'error'); return; }

  const btn = addForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Adding…';

  const fd = new FormData();
  fd.append('name',  prodName?.value.trim()  || '');
  fd.append('brand', prodBrand?.value.trim() || '');
  fd.append('price', prodPrice?.value        || '0');
  for (const f of files) fd.append('images', f);

  const { ok, message } = await apiUpload('/admin/products', fd);

  if (ok) {
    showAddStatus('✓ Watch added successfully!', 'success');
    addForm.reset();
    loadProducts();
  } else {
    showAddStatus(message || 'Failed to add watch.', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Add Watch →';
});

// ── Products Table ────────────────────────────────────────────────────────

const productsEl = document.getElementById('admin-products');

async function loadProducts() {
  if (!productsEl) return;
  productsEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">Loading watches…</div>`;

  const { data, ok } = await api.get('/products');
  if (!ok) {
    productsEl.innerHTML = `<div class="notice notice-error">Failed to load watches.</div>`;
    return;
  }

  const products = data.products || [];
  if (products.length === 0) {
    productsEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">No watches yet.</div>`;
    return;
  }

  productsEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Model</th>
            <th>Series</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
          <tr>
            <td>
              ${p.imageUrl
                ? `<img src="${p.imageUrl}" style="width:52px;height:52px;object-fit:cover;border:1px solid var(--border);" />`
                : '<span style="color:var(--text-faint);">⌚</span>'}
            </td>
            <td style="color:var(--text);font-weight:600;">${p.name}</td>
            <td style="color:var(--red);">${p.brand}</td>
            <td style="color:var(--amber);">₹${Number(p.price).toLocaleString('en-IN')}</td>
            <td>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-sm" data-edit="${p._id}" data-name="${p.name}" data-brand="${p.brand}" data-price="${p.price}">Edit</button>
                <button class="btn btn-sm" data-del="${p._id}" style="color:var(--red);border-color:var(--red);">Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Edit handlers
  productsEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      openEditModal(btn.dataset.edit, btn.dataset.name, btn.dataset.brand, btn.dataset.price);
    });
  });

  // Delete handlers
  productsEl.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this watch? This cannot be undone.')) return;
      const { ok, message } = await api.delete(`/admin/products/${btn.dataset.del}`);
      if (ok) loadProducts();
      else alert(message || 'Delete failed.');
    });
  });
}

// ── Edit Modal ────────────────────────────────────────────────────────────

const editModal  = document.getElementById('edit-modal');
const editName   = document.getElementById('edit-name');
const editBrand  = document.getElementById('edit-brand');
const editPrice  = document.getElementById('edit-price');
const editImage  = document.getElementById('edit-image');
const saveEditBtn = document.getElementById('save-edit');

let editingId = null;

function openEditModal(id, name, brand, price) {
  editingId = id;
  if (editName)  editName.value  = name;
  if (editBrand) editBrand.value = brand;
  if (editPrice) editPrice.value = price;
  if (editImage) editImage.value = '';
  editModal?.classList.remove('hidden');
}

saveEditBtn?.addEventListener('click', async () => {
  if (!editingId) return;

  saveEditBtn.disabled = true;
  saveEditBtn.textContent = 'Saving…';

  const fd = new FormData();
  fd.append('name',  editName?.value.trim()  || '');
  fd.append('brand', editBrand?.value.trim() || '');
  fd.append('price', editPrice?.value        || '0');
  const files = editImage?.files;
  if (files && files.length > 0) {
    for (const f of files) fd.append('images', f);
  }

  const { ok, message } = await apiUploadPatch(`/admin/products/${editingId}`, fd);

  if (ok) {
    editModal.classList.add('hidden');
    loadProducts();
  } else {
    alert(message || 'Update failed.');
  }

  saveEditBtn.disabled = false;
  saveEditBtn.textContent = 'Save Changes';
});

// ── Users Table ───────────────────────────────────────────────────────────

const usersEl = document.getElementById('admin-users');

async function loadUsers() {
  if (!usersEl) return;
  usersEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">Loading users…</div>`;

  const { data, ok } = await api.get('/admin/users');
  if (!ok) {
    usersEl.innerHTML = `<div class="notice notice-error">Failed to load users.</div>`;
    return;
  }

  const users = data.users || [];
  if (users.length === 0) {
    usersEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">No users yet.</div>`;
    return;
  }

  usersEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Role</th>
          <th>Status</th>
          <th>Toggle</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
        <tr>
          <td style="color:var(--text);">${u.name}</td>
          <td style="color:var(--text-muted);">${u.email}</td>
          <td style="color:var(--text-muted);">${u.mobileNumber || '—'}</td>
          <td><span class="status-badge ${u.role === 'admin' ? 'pending' : 'delivered'}">${u.role}</span></td>
          <td><span class="status-badge ${u.active ? 'delivered' : 'cancelled'}">${u.active ? 'Active' : 'Inactive'}</span></td>
          <td>
            <button class="btn btn-sm" data-uid="${u._id}" data-active="${u.active}">
              ${u.active ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  usersEl.querySelectorAll('[data-uid]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newActive = btn.dataset.active === 'true' ? false : true;
      const { ok, message } = await api.patch(`/admin/users/${btn.dataset.uid}`, { active: newActive });
      if (ok) loadUsers();
      else alert(message || 'Update failed.');
    });
  });
}

// ── Orders Table ──────────────────────────────────────────────────────────

const ordersEl = document.getElementById('admin-orders');

const STATUS_OPTIONS = ['Placed', 'Shipped', 'Delivered', 'Cancelled'];

function statusCls(s = '') {
  const v = s.toLowerCase();
  if (v === 'delivered') return 'delivered';
  if (v === 'cancelled') return 'cancelled';
  return 'pending';
}

async function loadOrders() {
  if (!ordersEl) return;
  ordersEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">Loading orders…</div>`;

  const { data, ok } = await api.get('/admin/orders');
  if (!ok) {
    ordersEl.innerHTML = `<div class="notice notice-error">Failed to load orders.</div>`;
    return;
  }

  const entries = data.orders || [];
  if (entries.length === 0) {
    ordersEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">No orders yet.</div>`;
    return;
  }

  ordersEl.innerHTML = entries.map(({ order, user }) => {
    const items = (order.items || []).map(it => `${it.name} × ${it.quantity}`).join(', ');
    const cls   = statusCls(order.status);

    return `
    <div class="order-card status-${cls}" style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;">
      <div>
        <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
        <div class="order-name" style="font-size:0.95rem;">${items}</div>
        <div class="order-meta" style="margin-top:4px;">
          👤 ${user?.name || 'Unknown'} &nbsp;·&nbsp; ${user?.email || ''}
        </div>
        <div class="order-meta" style="margin-top:2px;">
          <span style="color:var(--amber);font-family:var(--font-mono);">₹${Number(order.totalPrice).toLocaleString('en-IN')}</span>
          &nbsp;·&nbsp; ${order.paymentMethod}
          &nbsp;·&nbsp; ${new Date(order.createdAt).toLocaleDateString('en-IN')}
        </div>
        <div class="order-meta" style="margin-top:2px;font-size:0.8rem;color:var(--text-faint);">
          📍 ${order.deliveryAddress}
        </div>
        <div class="status-badge ${cls}" style="margin-top:8px;">${order.status}</div>
      </div>
      <div>
        <select class="field" style="font-size:0.75rem;padding:6px 10px;" data-order-id="${order._id}">
          ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-primary" style="margin-top:6px;width:100%;" data-update="${order._id}">Update</button>
      </div>
    </div>`;
  }).join('');

  ordersEl.querySelectorAll('[data-update]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.update;
      const select = ordersEl.querySelector(`select[data-order-id="${id}"]`);
      const status = select?.value;
      if (!status) return;

      btn.disabled = true;
      btn.textContent = '…';

      const { ok, message } = await api.patch(`/admin/orders/${id}/status`, { status });
      if (ok) {
        await loadOrders();
      } else {
        alert(message || 'Update failed.');
        btn.disabled = false;
        btn.textContent = 'Update';
      }
    });
  });
}

// ── Guard: verify admin role after auth/me ────────────────────────────────

async function init() {
  const { data, ok } = await api.get('/auth/me');
  if (!ok || data.user?.role !== 'admin') {
    alert('Admin access required.');
    window.location.href = '/index.html';
    return;
  }

  loadBrandsForSelect();
  loadProducts();
  loadUsers();
  loadOrders();
}

init();
