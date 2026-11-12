import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IconBrandLogo,
  IconClose,
  IconEye,
  IconEyeOff,
  IconCheckCircle,
  IconCheck,
  IconAlert,
} from './Icons';
import { MaterialSelect } from './MaterialComponents';
import usePresence, { usePresenceValue, useSmoothSwitch } from '../utils/usePresence';

/**
 * Landing-page Google Material 3 Authentication Modal.
 * Opens directly over the landing page with smooth CSS fade-in and delayed fade-out
 * exit transitions before unmounting, and switches cleanly between Sign In and Create Account.
 */
export default function AuthModal({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  showRegPassword,
  setShowRegPassword,
  loginError,
  setLoginError,
  regSuccessMessage,
  setRegSuccessMessage,
  authLoading,
  registerForm,
  setRegisterForm,
  employers = [],
  showDemoAccounts,
  setShowDemoAccounts,
  demoPresets = [],
  onLogin,
  onRegister,
}) {
  const { rendered: isRendered, exiting: isClosing } = usePresence(isOpen, 155);
  const modeSwitch = useSmoothSwitch(authMode, 90);
  const regRoleSwitch = useSmoothSwitch(registerForm.role === 'adviser' ? 'adviser' : 'student', 85);
  const demoPresence = usePresence(showDemoAccounts, 150);
  const successBannerPresence = usePresenceValue(regSuccessMessage, 150);
  const errorBannerPresence = usePresenceValue(loginError, 150);

  useEffect(() => {
    if (!isRendered) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isRendered]);

  useEffect(() => {
    if (!isOpen || !isRendered) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !authLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRendered, authLoading, onClose]);

  if (!isRendered) return null;

  const displayedMode = modeSwitch.displayedKey;
  const isAdviserReg = regRoleSwitch.displayedKey === 'adviser';
  const isRegister = displayedMode === 'register';

  const switchToMode = (nextMode) => {
    setAuthMode(nextMode);
    setLoginError('');
    if (nextMode === 'register') {
      setRegSuccessMessage('');
    }
  };

  return createPortal(
    <div
      className={`modal-backdrop auth-modal-backdrop ${isClosing ? 'is-closing' : ''}`}
      onClick={authLoading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div
        className={`modal-card modal-entry-card auth-modal-card ${
          isRegister ? 'is-register-wide' : 'is-login-compact'
        } ${isClosing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-top">
          <div className="auth-modal-brand-row">
            <IconBrandLogo size={26} />
            <span className="auth-modal-brand-name">Practicly</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={authLoading}
            aria-label="Close sign in dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div
          key={displayedMode}
          className={`auth-modal-step-pane ${modeSwitch.phase === 'exiting' ? 'is-exiting' : ''}`}
        >
          <div className="auth-modal-heading-block">
            <h2 id="auth-modal-heading" className="auth-modal-title">
              {isRegister
                ? isAdviserReg
                  ? 'Faculty Adviser Registration'
                  : 'Create Student Account'
                : 'Sign in'}
            </h2>
            <p className="auth-modal-subtitle">
              {isRegister
                ? isAdviserReg
                  ? 'Request a faculty adviser account for student cross-audits and clearance reviews.'
                  : 'Register your student profile, academic program, and internship placement.'
                : 'Continue to Practicly with your student, host supervisor, faculty adviser, or coordinator account.'}
            </p>
          </div>

          {successBannerPresence.rendered && successBannerPresence.value && (
            <div
              className={`auth-success-banner ${successBannerPresence.exiting ? 'is-exiting' : ''}`}
              role="status"
            >
              <IconCheckCircle size={15} />
              <span>{successBannerPresence.value}</span>
            </div>
          )}

          {errorBannerPresence.rendered && errorBannerPresence.value && (
            <div
              className={`auth-error-banner ${errorBannerPresence.exiting ? 'is-exiting' : ''}`}
              role="alert"
            >
              <IconAlert size={14} />
              <span>{errorBannerPresence.value}</span>
            </div>
          )}

          {!isRegister ? (
            <form onSubmit={(e) => onLogin(e)} className="auth-modal-form">
              <div className="field">
                <label className="field-label" htmlFor="login-username">
                  Username, Email, or ID Number
                </label>
                <input
                  id="login-username"
                  type="text"
                  className="input"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="e.g. username, email, or school ID"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-password">
                  Password
                </label>
                <div className="password-input-wrap">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
                <div className="auth-hint-row">
                  <span>All 4 roles &middot; Case-insensitive lookup</span>
                  <span>
                    Demo: <code className="mono">password123</code>
                  </span>
                </div>
              </div>

              <div className="auth-demo-switcher is-inline">
                <button
                  type="button"
                  className="auth-demo-toggle"
                  onClick={() => setShowDemoAccounts((v) => !v)}
                >
                  <span>Quick-Switch Test Accounts (All Roles)</span>
                  <span>{showDemoAccounts ? 'Hide' : 'Show'}</span>
                </button>
                {demoPresence.rendered && (
                  <div className={`auth-demo-collapse ${demoPresence.exiting ? 'is-exiting' : ''}`}>
                    <div className="auth-demo-list">
                      {demoPresets.map((preset) => (
                        <button
                          key={preset.username}
                          type="button"
                          className="auth-demo-item"
                          onClick={() => onLogin(null, preset.username)}
                        >
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '12px', color: 'var(--text-primary)' }}>
                              {preset.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {preset.desc}
                            </div>
                          </div>
                          <span
                            className={`status-chip ${
                              preset.role === 'admin'
                                ? 'danger'
                                : preset.role === 'supervisor'
                                ? 'warning'
                                : preset.role === 'adviser'
                                ? 'info'
                                : 'success'
                            }`}
                          >
                            {preset.role}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="auth-demo-note">
                      <span>Shared evaluation password</span>
                      <code className="mono">password123</code>
                    </div>
                  </div>
                )}
              </div>

              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-modal-switch-link"
                  onClick={() => switchToMode('register')}
                  disabled={authLoading}
                >
                  Create account
                </button>
                <button
                  type="submit"
                  className="btn btn-primary auth-modal-submit-btn"
                  disabled={authLoading}
                >
                  {authLoading ? 'Signing in...' : 'Continue'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister} className="auth-modal-form">
              <div className="auth-role-switch" role="radiogroup" aria-label="Account role">
                <button
                  type="button"
                  role="radio"
                  aria-checked={registerForm.role !== 'adviser'}
                  className={`auth-role-switch-btn ${registerForm.role !== 'adviser' ? 'is-active' : ''}`}
                  onClick={() => {
                    setRegisterForm((prev) => ({ ...prev, role: 'student' }));
                    setLoginError('');
                  }}
                >
                  <span className="m3-seg-check" aria-hidden="true">
                    <IconCheck size={15} />
                  </span>
                  <span>Student Intern</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={registerForm.role === 'adviser'}
                  className={`auth-role-switch-btn ${registerForm.role === 'adviser' ? 'is-active' : ''}`}
                  onClick={() => {
                    setRegisterForm((prev) => ({ ...prev, role: 'adviser' }));
                    setLoginError('');
                  }}
                >
                  <span className="m3-seg-check" aria-hidden="true">
                    <IconCheck size={15} />
                  </span>
                  <span>Faculty Adviser</span>
                </button>
              </div>

              <div
                key={regRoleSwitch.displayedKey}
                className={`auth-role-fields-stage ${regRoleSwitch.phase === 'exiting' ? 'is-exiting' : ''}`}
              >
                <div className="auth-role-note">
                  {isAdviserReg
                    ? 'Faculty Adviser accounts enter a pending queue and require coordinator activation under User Accounts before first sign-in.'
                    : 'Student accounts activate immediately. Host Supervisors and Coordinators use coordinator-issued accounts or signed links.'}
                </div>

                <div className="field">
                  <label className="field-label">Full Name (Last, First M.I.)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Last, First M.I."
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    required
                  />
                </div>

                {isAdviserReg ? (
                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">Employee / Faculty ID</label>
                      <input
                        type="text"
                        className="input mono"
                        placeholder="Optional · e.g. FAC-2026-014"
                        value={registerForm.employee_number}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, employee_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Department / Program</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. College of Engineering"
                        value={registerForm.department}
                        onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">Student Number</label>
                      <input
                        type="text"
                        className="input mono"
                        placeholder="e.g. 2026-00412"
                        value={registerForm.student_number}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, student_number: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Program &amp; Section</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. BSCS 4-1"
                        value={registerForm.section}
                        onChange={(e) => setRegisterForm({ ...registerForm, section: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label className="field-label">Institutional Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder={isAdviserReg ? 'adviser@university.edu' : 'student@university.edu'}
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Contact Number</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="0917-555-0144"
                    value={registerForm.contact_number}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, contact_number: e.target.value })
                    }
                    required={!isAdviserReg}
                  />
                </div>
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label className="field-label">Username</label>
                  <input
                    type="text"
                    className="input mono"
                    placeholder={isAdviserReg ? 'faculty.username' : 'student.username'}
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Create a password"
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowRegPassword((v) => !v)}
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      title={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {!isAdviserReg && employers.length > 0 && (
                <div className="field">
                  <label className="field-label">Host Training Establishment (Optional)</label>
                  <MaterialSelect
                    className="select"
                    value={registerForm.employer_id}
                    onChange={(e) => setRegisterForm({ ...registerForm, employer_id: e.target.value })}
                  >
                    <option value="">Assign later in portal...</option>
                    {employers.map((emp) => (
                      <option key={emp.employer_id} value={emp.employer_id}>
                        {emp.company_name} ({emp.industry})
                      </option>
                    ))}
                  </MaterialSelect>
                </div>
              )}

              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-modal-switch-link"
                  onClick={() => switchToMode('login')}
                  disabled={authLoading}
                >
                  Sign in instead
                </button>
                <button
                  type="submit"
                  className="btn btn-primary auth-modal-submit-btn"
                  disabled={authLoading}
                >
                  {authLoading
                    ? 'Submitting...'
                    : isAdviserReg
                    ? 'Submit Adviser Registration'
                    : 'Create Account & Continue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
