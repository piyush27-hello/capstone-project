// ui-init.js — Runs on every page.
// Shows/hides nav links based on auth state.
// Handles logout.

import { isLoggedIn, clearToken, getUser, api, saveUser } from './api.js';

async function initUI() {
  const loggedIn = isLoggedIn();

  // Refresh user data from server if logged in
  if (loggedIn) {
    const { data, ok } = await api.get('/auth/me');
    if (ok && data.user) {
      saveUser(data.user);
    } else {
      // Token invalid / expired — clear it
      clearToken();
      location.reload();
      return;
    }
  }

  const user = getUser();
  const isAdmin = user?.role === 'admin';

  // Nav links
  const elLogin    = document.getElementById('link-login');
  const elRegister = document.getElementById('link-register');
  const elLogout   = document.getElementById('link-logout');
  const elAdmin    = document.getElementById('link-admin');

  if (loggedIn) {
    elLogin?.classList.add('hidden');
    elRegister?.classList.add('hidden');
    elLogout?.classList.remove('hidden');
    if (isAdmin) elAdmin?.classList.remove('hidden');
  } else {
    elLogout?.classList.add('hidden');
    elAdmin?.classList.add('hidden');
    elLogin?.classList.remove('hidden');
    elRegister?.classList.remove('hidden');
  }

  // Logout handler
  elLogout?.addEventListener('click', (e) => {
    e.preventDefault();
    clearToken();
    window.location.href = '/index.html';
  });
}

initUI();
