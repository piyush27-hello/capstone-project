// verify-otp.js
import { api } from './api.js';

const params   = new URLSearchParams(window.location.search);
const email    = params.get('email') || '';

const emailEl  = document.getElementById('otp-email');
const form     = document.getElementById('otp-form');
const errEl    = document.getElementById('error');

if (emailEl) emailEl.textContent = email;

if (!email) {
  if (errEl) errEl.textContent = 'No email found. Please register again.';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (errEl) errEl.textContent = '';

  const otp = document.getElementById('otp')?.value.trim();
  if (!otp) {
    if (errEl) errEl.textContent = 'Please enter the OTP.';
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Verifying…';

  const { ok, message } = await api.post('/auth/verify-otp', { email, otp });

  if (ok) {
    window.location.href = '/login.html?verified=1';
  } else {
    if (errEl) errEl.textContent = message || 'Invalid or expired OTP.';
    btn.disabled = false;
    btn.textContent = 'Verify OTP →';
  }
});
