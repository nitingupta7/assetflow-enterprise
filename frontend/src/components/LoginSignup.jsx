/**
 * ============================================================================
 * LOGIN / SIGNUP COMPONENT
 * ============================================================================
 *
 * A dual-mode authentication screen that matches the AssetFlow dark theme.
 * Renders a centred card with:
 *   • Login form   — email, password, "Forgot password" link
 *   • Signup form  — name, email, password (toggled from Login view)
 *
 * BACKEND INTEGRATION POINTS:
 *   All network calls are delegated to `../api/authApi.js`.
 *   See that file for the TODO comments on replacing mock bodies with
 *   `fetch` calls once the backend implements:
 *     POST /api/auth/login
 *     POST /api/auth/signup
 *     POST /api/auth/logout
 *     GET  /api/auth/me
 *     POST /api/auth/forgot-password
 *
 * After successful login/signup, this component calls `onAuthSuccess(user)`
 * to signal the parent App component to transition to the main dashboard.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import './LoginSignup.css';

/**
 * TODO (Backend): Once roles are returned by the backend JWT,
 * the role-based routing in App.jsx should use the `user.role`
 * from the auth response instead of the simulated role switcher.
 */

export default function LoginSignup({ onAuthSuccess }) {
  // ─── View state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'

  // ─── Form fields ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ─── Async state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── Import auth API (mock for now — see authApi.js for backend TODOs) ──
  const authApi = React.useMemo(() => import('../api/authApi.js'), []);

  // ─── Handlers ────────────────────────────────────────────────────────────

  /**
   * Handle login submission.
   *
   * TODO (Backend): The `login` function in authApi.js currently validates
   * against an in-memory user list. Replace it with the fetch-based version
   * once the POST /api/auth/login endpoint is implemented in
   * backend/controllers/auth.controller.js.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const api = await authApi;
      const { user } = await api.login({ email, password });

      /**
       * TODO (Backend): After successful login the backend returns
       * { user, token }. The token is stored by authApi automatically.
       * Pass the user object up so App.jsx can set currentRole from
       * user.role instead of the mock role switcher.
       */
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle signup submission.
   *
   * TODO (Backend): The `signup` function in authApi.js currently stores
   * users in-memory. Replace it with the fetch-based version once the
   * POST /api/auth/signup endpoint is implemented. The backend should:
   *   1. Validate email uniqueness (Prisma unique constraint on User.email)
   *   2. Hash the password (bcrypt recommended)
   *   3. Create a User record with role = EMPLOYEE (default)
   *   4. Return a signed JWT + user object
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const api = await authApi;
      const { user } = await api.signup({ email, password, name });

      /**
       * TODO (Backend): New signups are always EMPLOYEE role.
       * Admin role assignment should happen separately via the
       * Organization Setup screen (backend: PATCH /api/users/:id/role).
       */
      onAuthSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle forgot-password submission.
   *
   * TODO (Backend): Implement the POST /api/auth/forgot-password endpoint
   * that sends a reset link to the user's email. The reset flow itself
   * (token verification + password update) is a separate feature.
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const api = await authApi;
      const result = await api.forgotPassword({ email });
      setSuccessMsg(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /** Switch between Login / Signup / Forgot modes and reset state. */
  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    if (newMode !== 'forgot') setEmail('');
    setName('');
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="auth-page">
      {/* Ambient background decoration */}
      <div className="auth-bg-glow auth-bg-glow--1" />
      <div className="auth-bg-glow auth-bg-glow--2" />
      <div className="auth-bg-grid" />

      <div className="auth-card">
        {/* ── Header band ─────────────────────────────────────────────── */}
        <div className="auth-card__header">
          <span className="auth-card__header-text">
            AssetFlow — {mode === 'login' ? 'login' : mode === 'signup' ? 'create account' : 'reset password'}
          </span>
        </div>

        {/* ── Logo / Avatar ───────────────────────────────────────────── */}
        <div className="auth-avatar-wrap">
          <div className="auth-avatar">
            <span className="auth-avatar__initials">AF</span>
          </div>
        </div>

        {/* ── Error / Success banners ─────────────────────────────────── */}
        {error && (
          <div className="auth-banner auth-banner--error">
            <span className="auth-banner__icon">⚠</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-banner auth-banner--success">
            <span className="auth-banner__icon">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LOGIN FORM                                                    */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form" autoComplete="on">
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-field__label">Email</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">✉</span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-field__input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="login-password" className="auth-field__label">Password</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="auth-field__input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-field__toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <div className="auth-field__meta">
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="auth-link"
                >
                  Forgot password
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">
              {loading ? (
                <span className="auth-btn__spinner" />
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo credentials hint */}
            <div className="auth-demo-hint">
              <span className="auth-demo-hint__label">Demo credentials</span>
              <code className="auth-demo-hint__code">kunal.singh@assetflow.com / admin123</code>
            </div>

            {/* ── Divider ── */}
            <div className="auth-divider" />

            {/* ── Switch to Signup ── */}
            <div className="auth-switch">
              <p className="auth-switch__title">New here?</p>
              <div className="auth-switch__info">
                <p>Sign up creates an employee account</p>
                <p>admin roles assigned later</p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="auth-btn auth-btn--secondary"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SIGNUP FORM                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="auth-form" autoComplete="on">
            {/* Full name */}
            <div className="auth-field">
              <label htmlFor="signup-name" className="auth-field__label">Full Name</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">👤</span>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Priya Shah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="auth-field__input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-field__label">Email</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">✉</span>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-field__input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="signup-password" className="auth-field__label">Password</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">🔒</span>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="auth-field__input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-field__toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {/* Password strength indicator */}
              <div className="auth-field__strength">
                <div
                  className={`auth-field__strength-bar ${
                    password.length === 0
                      ? ''
                      : password.length < 6
                      ? 'auth-field__strength-bar--weak'
                      : password.length < 10
                      ? 'auth-field__strength-bar--medium'
                      : 'auth-field__strength-bar--strong'
                  }`}
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">
              {loading ? (
                <span className="auth-btn__spinner" />
              ) : (
                'Create Account'
              )}
            </button>

            {/* Back to login */}
            <div className="auth-divider" />
            <div className="auth-switch auth-switch--compact">
              <span className="auth-switch__text">Already have an account?</span>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="auth-link auth-link--bold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* FORGOT PASSWORD FORM                                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="auth-form" autoComplete="on">
            <p className="auth-forgot-desc">
              Enter the email associated with your account and we'll send a reset link.
            </p>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="forgot-email" className="auth-field__label">Email</label>
              <div className="auth-field__input-wrap">
                <span className="auth-field__icon">✉</span>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-field__input"
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="auth-btn auth-btn--primary">
              {loading ? (
                <span className="auth-btn__spinner" />
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to login */}
            <div className="auth-divider" />
            <div className="auth-switch auth-switch--compact">
              <span className="auth-switch__text">Remember your password?</span>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="auth-link auth-link--bold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="auth-footer">
          <span>© {new Date().getFullYear()} AssetFlow</span>
          <span className="auth-footer__dot">·</span>
          <span>Enterprise Resource Platform</span>
        </div>
      </div>
    </div>
  );
}
