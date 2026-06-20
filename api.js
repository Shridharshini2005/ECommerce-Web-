// Common Goods — API helper
// Change API_BASE if your backend runs somewhere other than localhost:5000.
const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('cg_token');
}
function getStoredUser() {
  const raw = localStorage.getItem('cg_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('cg_token', token);
  localStorage.setItem('cg_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('cg_token');
  localStorage.removeItem('cg_user');
}

// Wraps fetch with the API base URL, JSON headers, and the auth token (if present).
async function apiRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    /* empty body */
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

function formatMoney(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}
