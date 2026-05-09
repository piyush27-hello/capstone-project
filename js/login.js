// login.js
import { api, setToken, saveUser, isLoggedIn } from './api.js';

// If already logged in, go home
if (isLoggedIn()) window.location.href = '/index.html';

const form   = document.getElementById('login-form');
const errBox = document.getElementById('login-error');

// Show "verified" banner if coming from OTP verification
const params = new URLSearchParams(window.location.search);
if (params.get('verified') === '1') {
  errBox.textContent = '✓ Account verified! You can now sign in.';
  errBox.classList.remove('hidden');
  errBox.classList.remove('notice-error');
  errBox.classList.add('notice-success');
}

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('hidden', 'notice-success');
  errBox.classList.add('notice-error');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) return showError('Email and password are required.');

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Signing In…';

  const { data, ok, message } = await api.post('/auth/login', { email, password });

  if (ok && data.token) {
    setToken(data.token);

    // Fetch user profile to store locally
    const { data: meData } = await api.get('/auth/me');
    if (meData?.user) saveUser(meData.user);

    // Redirect admins to admin panel, users to home
    const role = meData?.user?.role;
    window.location.href = role === 'admin' ? '/admin.html' : '/index.html';
  } else {
    showError(message || 'Invalid email or password.');
    btn.disabled = false;
    btn.textContent = 'Sign In →';
  }
});
