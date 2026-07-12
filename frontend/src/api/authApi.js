/**
 * ============================================================================
 * AUTH API — Authentication Service Layer
 * ============================================================================
 *
 * This module provides authentication functions (login, signup, logout,
 * session-check) used by the LoginSignup component.
 *
 * CURRENT STATE: In-memory mock — credentials are validated locally so the
 * UI can be demoed and developed before the backend auth endpoints exist.
 *
 * ─── BACKEND INTEGRATION GUIDE ───────────────────────────────────────────────
 *
 * When the backend is ready, replace the mock bodies with `fetch` calls.
 * The return shapes that the component consumes should stay identical so the
 * UI code does NOT need to change.
 *
 * Expected backend endpoints (Express + Prisma):
 *
 *   POST /api/auth/signup
 *     Body:   { email, password, name }
 *     Returns: { user: { id, email, name, role }, token }
 *
 *   POST /api/auth/login
 *     Body:   { email, password }
 *     Returns: { user: { id, email, name, role }, token }
 *
 *   POST /api/auth/logout
 *     Headers: Authorization: Bearer <token>
 *     Returns: { message: "Logged out" }
 *
 *   GET  /api/auth/me
 *     Headers: Authorization: Bearer <token>
 *     Returns: { user: { id, email, name, role } }
 *
 * Token storage: JWT stored in localStorage under key `af_auth_token`.
 * The helpers `getStoredToken` / `setStoredToken` / `clearStoredToken`
 * encapsulate this so the rest of the app never touches localStorage
 * directly for auth.
 *
 * CORS: Vite dev server can proxy /api to the Express backend.
 * Add to vite.config.js:
 *   server: { proxy: { '/api': 'http://localhost:3000' } }
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * TODO (Backend): Replace with the actual API base URL from env.
 * In Vite, use: const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
 * With the proxy set up, an empty string works for development.
 */
const API_BASE = '';

/** Simulated network latency (ms) so loading spinners are exercised. */
const MOCK_LATENCY = 600;

// ─── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = 'af_auth_token';
const USER_KEY = 'af_auth_user';

/**
 * Retrieve the stored JWT.
 * TODO (Backend): This is production-ready — no changes needed.
 */
export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Persist the JWT after login/signup.
 * TODO (Backend): This is production-ready — no changes needed.
 */
export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Clear stored credentials on logout.
 * TODO (Backend): This is production-ready — no changes needed.
 */
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Store the user object locally for fast access (avoids /me on every render).
 * TODO (Backend): This is production-ready — no changes needed.
 */
export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Mock user store (remove when backend is live) ──────────────────────────

/**
 * In-memory users for demo. Passwords are stored in plain text only in this
 * mock — the real backend MUST hash passwords (bcrypt / argon2).
 */
const mockUsers = [
  { id: 1, email: 'kunal.singh@assetflow.com', password: 'admin123', name: 'Kunal Singh', role: 'ADMIN' },
  { id: 2, email: 'aditi.rao@assetflow.com', password: 'admin123', name: 'Aditi Rao', role: 'MANAGER' },
  { id: 3, email: 'priya.shah@assetflow.com', password: 'emp123', name: 'Priya Shah', role: 'EMPLOYEE' },
];

let mockIdSeq = mockUsers.length;

/** Simulate a JWT — the real one comes from the backend. */
const fakeMockToken = (userId) => `mock-jwt-token-${userId}-${Date.now()}`;

// ─── Utility ────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Sign up a new employee account.
 *
 * @param {{ email: string, password: string, name: string }} payload
 * @returns {Promise<{ user: object, token: string }>}
 *
 * TODO (Backend): Replace mock body with:
 * ```js
 * const res = await fetch(`${API_BASE}/api/auth/signup`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password, name }),
 * });
 * if (!res.ok) {
 *   const err = await res.json();
 *   throw new Error(err.message || 'Signup failed');
 * }
 * const data = await res.json();
 * setStoredToken(data.token);
 * setStoredUser(data.user);
 * return data;
 * ```
 */
export async function signup({ email, password, name }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Signup failed');
  }
  const data = await res.json();
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

/**
 * Log in with email + password.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ user: object, token: string }>}
 *
 * TODO (Backend): Replace mock body with:
 * ```js
 * const res = await fetch(`${API_BASE}/api/auth/login`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email, password }),
 * });
 * if (!res.ok) {
 *   const err = await res.json();
 *   throw new Error(err.message || 'Invalid credentials');
 * }
 * const data = await res.json();
 * setStoredToken(data.token);
 * setStoredUser(data.user);
 * return data;
 * ```
 */
export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Invalid credentials');
  }
  const data = await res.json();
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

/**
 * Log out the current user.
 *
 * TODO (Backend): Replace mock body with:
 * ```js
 * const token = getStoredToken();
 * if (token) {
 *   await fetch(`${API_BASE}/api/auth/logout`, {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 * }
 * clearStoredToken();
 * ```
 */
export async function logout() {
  const token = getStoredToken();
  if (token) {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  clearStoredToken();
}

/**
 * Check if a stored token is still valid and retrieve the user profile.
 * Called on app mount to restore sessions.
 *
 * @returns {Promise<{ user: object } | null>}
 *
 * TODO (Backend): Replace mock body with:
 * ```js
 * const token = getStoredToken();
 * if (!token) return null;
 *
 * const res = await fetch(`${API_BASE}/api/auth/me`, {
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 * if (!res.ok) {
 *   clearStoredToken();
 *   return null;
 * }
 * const data = await res.json();
 * setStoredUser(data.user);
 * return data;
 * ```
 */
export async function checkSession() {
  const token = getStoredToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    clearStoredToken();
    return null;
  }
  const data = await res.json();
  setStoredUser(data.user);
  return data;
}

/**
 * Request a password reset email.
 *
 * @param {{ email: string }} payload
 * @returns {Promise<{ message: string }>}
 *
 * TODO (Backend): Implement endpoint and replace mock body with:
 * ```js
 * const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email }),
 * });
 * if (!res.ok) {
 *   const err = await res.json();
 *   throw new Error(err.message || 'Failed to send reset email');
 * }
 * return await res.json();
 * ```
 */
export async function forgotPassword({ email }) {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send reset email');
  }
  return await res.json();
}
