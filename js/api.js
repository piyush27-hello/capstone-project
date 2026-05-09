// api.js — Centralised fetch helper for Piyush Watch
// All JS modules import from here so the base URL is one place.

const BASE = '/api';

function getToken() {
  return localStorage.getItem('pw_token') || null;
}

export function setToken(token) {
  localStorage.setItem('pw_token', token);
}

export function clearToken() {
  localStorage.removeItem('pw_token');
  localStorage.removeItem('pw_user');
}

export function saveUser(user) {
  localStorage.setItem('pw_user', JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('pw_user') || 'null');
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

/**
 * Core request helper.
 * Returns { data, ok, status, message }.
 * Never throws — always returns an object.
 */
export async function request(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let bodyPayload;
  if (body && isForm) {
    bodyPayload = body; // FormData — no Content-Type header (browser sets it)
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    bodyPayload = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: bodyPayload
    });

    let data;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    return { data, ok: res.ok, status: res.status, message: data?.message || '' };
  } catch (err) {
    return { data: {}, ok: false, status: 0, message: err.message || 'Network error' };
  }
}

export const api = {
  get:    (path)              => request('GET',    path),
  post:   (path, body)       => request('POST',   path, body),
  patch:  (path, body)       => request('PATCH',  path, body),
  delete: (path)             => request('DELETE', path),
  postForm: (path, formData) => request('POST',   path, formData, true),
  patchForm:(path, formData) => request('PATCH',  path, formData, true),
};
