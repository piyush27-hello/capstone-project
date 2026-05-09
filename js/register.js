// register.js
import { api } from './api.js';

const form    = document.getElementById('register-form');
const errBox  = document.getElementById('register-error');

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
}
function clearError() {
  errBox.textContent = '';
  errBox.classList.add('hidden');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const name         = document.getElementById('reg-name')?.value.trim();
  const mobileNumber = document.getElementById('reg-mobile')?.value.trim();
  const email        = document.getElementById('reg-email')?.value.trim();
  const password     = document.getElementById('reg-password')?.value;

  if (!name || !mobileNumber || !email || !password) {
    return showError('All fields are required.');
  }
  if (password.length < 6) {
    return showError('Password must be at least 6 characters.');
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Creating Account…';

  const { ok, message } = await api.post('/auth/register', { name, mobileNumber, email, password });

  if (ok) {
    // Redirect to OTP verification page with email in query string
    window.location.href = `/verify-otp.html?email=${encodeURIComponent(email)}`;
  } else {
    showError(message || 'Registration failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create Account →';
  }
});
