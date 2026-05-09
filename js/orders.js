// orders.js — My Orders page
import { api, isLoggedIn } from './api.js';

if (!isLoggedIn()) window.location.href = '/login.html';

const emptyEl  = document.getElementById('orders-empty');
const recentEl = document.getElementById('recent-orders');
const prevEl   = document.getElementById('prev-orders');

function statusClass(status = '') {
  const s = status.toLowerCase();
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled') return 'cancelled';
  return 'pending';
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return ''; }
}

function renderOrder(order) {
  const cls = statusClass(order.status);
  const items = (order.items || [])
    .map(it => `${it.name} × ${it.quantity}`)
    .join(', ');

  return `
  <div class="order-card status-${cls}">
    <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
    <div class="order-name">${items || 'Order'}</div>
    <div class="order-meta">
      <span style="font-family:var(--font-mono);color:var(--amber);">
        ₹${Number(order.totalPrice).toLocaleString('en-IN')}
      </span>
      &nbsp;·&nbsp; ${order.paymentMethod || 'COD'}
      &nbsp;·&nbsp; ${formatDate(order.createdAt)}
    </div>
    <div class="order-meta" style="margin-top:4px;font-size:0.8rem;color:var(--text-faint);">
      📍 ${order.deliveryAddress || '—'}
    </div>
    <div class="status-badge ${cls}">${order.status || 'Placed'}</div>
  </div>`;
}

async function loadOrders() {
  if (recentEl) recentEl.innerHTML = `<div class="notice" style="color:var(--text-faint);">Loading…</div>`;
  if (prevEl)   prevEl.innerHTML   = '';

  const { data, ok } = await api.get('/orders/me');

  if (!ok) {
    if (recentEl) recentEl.innerHTML = `<div class="notice notice-error">Failed to load orders.</div>`;
    return;
  }

  const orders = data.orders || [];

  if (orders.length === 0) {
    emptyEl?.classList.remove('hidden');
    if (recentEl) recentEl.innerHTML = '';
    if (prevEl)   prevEl.innerHTML   = '';
    return;
  }

  emptyEl?.classList.add('hidden');

  // Split: first 3 = recent, rest = previous
  const recent = orders.slice(0, 3);
  const prev   = orders.slice(3);

  if (recentEl) recentEl.innerHTML = recent.map(renderOrder).join('');
  if (prevEl)   prevEl.innerHTML   = prev.length ? prev.map(renderOrder).join('') :
    `<div class="notice" style="color:var(--text-faint);padding:16px;">No previous orders.</div>`;
}

loadOrders();
