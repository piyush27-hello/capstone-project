// forgot-password.js
import { api } from './api.js';

const errBox       = document.getElementById('reset-error');
const otpForm      = document.getElementById('request-otp-form');
const resetForm    = document.getElementById('reset-password-form');

let pendingEmail = '';

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
  errBox.classList.add('notice-error');
}
function showSuccess(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('hidden', 'notice-error');
  errBox.style.borderLeftColor = 'var(--green)';
  errBox.style.color = '#4ade80';
}
function clearMsg() {
  errBox.textContent = '';
  errBox.classList.add('hidden');
}

// Step 1: Request OTP
otpForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();

  const email = document.getElementById('reset-email')?.value.trim();
  if (!email) return showError('Please enter your email address.');

  const btn = otpForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending OTP…';

  const { ok, message } = await api.post('/auth/forgot-password', { email });

  if (ok) {
    pendingEmail = email;
    showSuccess('OTP sent! Check your email and fill in the form below.');
    resetForm.style.display = 'flex';
  } else {
    showError(message || 'Failed to send OTP.');
  }

  btn.disabled = false;
  btn.textContent = 'Send OTP →';
});

// Step 2: Reset password
resetForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMsg();

  const otp             = document.getElementById('reset-otp')?.value.trim();
  const newPassword     = document.getElementById('reset-new-password')?.value;
  const confirmPassword = document.getElementById('reset-confirm-password')?.value;

  if (!otp || !newPassword || !confirmPassword) return showError('All fields are required.');
  if (newPassword !== confirmPassword)           return showError('Passwords do not match.');
  if (newPassword.length < 6)                   return showError('Password must be at least 6 characters.');

  const btn = resetForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Resetting…';

  const { ok, message } = await api.post('/auth/reset-password', {
    email: pendingEmail,
    otp,
    newPassword
  });

  if (ok) {
    showSuccess('Password reset! Redirecting to login…');
    setTimeout(() => { window.location.href = '/login.html'; }, 1800);
  } else {
    showError(message || 'Reset failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Reset Password →';
  }
});

// Hide reset form until OTP is requested
if (resetForm) resetForm.style.display = 'none';
