import React, { useState } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { authAPI } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================================================
  // HANDLE SIGNUP
  // =========================================================

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // CLEAR OLD LOGIN
      // =====================================================

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // =====================================================
      // IMPORTANT:
      // DO NOT SEND ROLE FROM FRONTEND
      //
      // Backend must ALWAYS create public registrations
      // with Role.USER.
      // =====================================================

      const response = await authAPI.register({
        name,
        email,
        password,
      });

      const result = response?.data;

      console.log("SIGNUP RESPONSE:", result);

      // Registration must not authenticate the new account automatically.
      // Clear any token returned by the backend before opening login.
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email,
        },
      });
    } catch (signupError) {
      console.error("SIGNUP ERROR:", signupError);

      // Clear authentication on failure
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const message =
        signupError?.response?.data?.message ||
        signupError?.response?.data?.error ||
        signupError?.response?.data?.detail ||
        signupError?.message ||
        "Unable to create account.";

      setError(
        typeof message === "string" ? message : "Unable to create account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      {/* =====================================================
          PREMIUM BACKGROUND
      ====================================================== */}

      <div className="background-orb orb-one"></div>
      <div className="background-orb orb-two"></div>
      <div className="background-orb orb-three"></div>

      <section className="signup-container">
        {/* ===================================================
            LEFT BRAND PANEL
        ==================================================== */}

        <div className="signup-brand">
          <div className="brand-overlay"></div>

          <div className="brand-content">
            {/* LOGO */}

            <div className="logo-row">
              <div className="logo-icon">
                <Trophy size={27} strokeWidth={2.3} />
              </div>

              <div>
                <div className="logo-title">MYVS</div>

                <div className="logo-subtitle">CRIC</div>
              </div>
            </div>

            {/* HEADING */}

            <div className="brand-main">
              <div className="eyebrow">
                <span className="eyebrow-dot"></span>
                CRICKET MANAGEMENT PLATFORM
              </div>

              <h1 className="brand-heading">
                Join the
                <br />
                <span>game.</span>
              </h1>

              <p className="brand-description">
                Create your account and experience a smarter way to follow
                tournaments, teams, players and live cricket matches.
              </p>
            </div>

            {/* FEATURES */}

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <strong>Follow tournaments</strong>

                  <span>Stay updated with every match.</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <strong>Track live matches</strong>

                  <span>Get scores and match updates.</span>
                </div>
              </div>

              <div className="brand-feature">
                <div className="feature-icon">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <strong>Secure access</strong>

                  <span>Your account is protected.</span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}

          <div className="brand-footer">
            <ShieldCheck size={16} />

            <span>Public registrations are created with the USER role.</span>
          </div>
        </div>

        {/* ===================================================
            RIGHT FORM PANEL
        ==================================================== */}

        <div className="signup-form-section">
          <div className="signup-form-container">
            {/* HEADER */}

            <div className="signup-header">
              <div className="mobile-logo">
                <div className="mobile-logo-icon">
                  <Trophy size={21} />
                </div>

                <span>CRICKET SCORE</span>
              </div>

              <div className="header-badge">
                <User size={15} />
                New account
              </div>

              <h2>Create account</h2>

              <p>Sign up to access your cricket dashboard.</p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="signup-alert error-alert">
                <div className="alert-icon">!</div>

                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="signup-alert success-alert">
                <CheckCircle2 size={18} />

                <span>{success}</span>
              </div>
            )}

            {/* FORM */}

            <form className="signup-form" onSubmit={handleSignup}>
              {/* NAME */}

              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">
                  Full name
                </label>

                <div className="input-wrapper">
                  <User className="input-icon" size={18} />

                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">
                  Email address
                </label>

                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />

                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">
                  Password
                </label>

                <div className="input-wrapper">
                  <LockKeyhole className="input-icon" size={18} />

                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}

                {formData.password && (
                  <div className="password-strength">
                    <div
                      className={`strength-bar ${
                        formData.password.length >= 10
                          ? "strong"
                          : formData.password.length >= 6
                            ? "medium"
                            : "weak"
                      }`}
                    ></div>

                    <span>
                      {formData.password.length >= 10
                        ? "Strong password"
                        : formData.password.length >= 6
                          ? "Good password"
                          : "Too short"}
                    </span>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}

              <div className="form-group">
                <label className="form-label" htmlFor="signup-confirm-password">
                  Confirm password
                </label>

                <div className="input-wrapper">
                  <LockKeyhole className="input-icon" size={18} />

                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    disabled={loading}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* PASSWORD MATCH */}

                {formData.confirmPassword && (
                  <div
                    className={
                      formData.password === formData.confirmPassword
                        ? "password-match matched"
                        : "password-match"
                    }
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <CheckCircle2 size={14} />
                        Passwords match
                      </>
                    ) : (
                      <>Passwords do not match</>
                    )}
                  </div>
                )}
              </div>

              {/* SECURITY INFO */}

              <div className="security-card">
                <div className="security-card-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <strong>Secure registration</strong>

                  <p>
                    Public accounts are automatically created as <b>USER</b>.
                    Admin, Organizer and Scorer permissions can only be assigned
                    by an Admin.
                  </p>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="signup-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </form>

            {/* LOGIN */}

            <div className="signup-login">
              <span>Already have an account?</span>

              <Link to="/login">Sign in</Link>
            </div>

            {/* BOTTOM INFO */}

            <div className="account-info">
              <Users size={14} />

              <span>One account. One secure cricket experience.</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PAGE CSS
      ====================================================== */}

      <style>{`

        /* =====================================================
           RESET
        ====================================================== */

        * {
          box-sizing: border-box;
        }

        /* =====================================================
           PAGE
        ====================================================== */

        .signup-page {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(34, 197, 94, 0.12),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(59, 130, 246, 0.12),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #020617 0%,
              #07111f 48%,
              #0f172a 100%
            );

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          color: #ffffff;
        }

        /* =====================================================
           BACKGROUND ORBS
        ====================================================== */

        .background-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0.55;
        }

        .orb-one {
          width: 280px;
          height: 280px;
          top: -130px;
          left: -100px;
          background: rgba(34, 197, 94, 0.12);
        }

        .orb-two {
          width: 320px;
          height: 320px;
          right: -130px;
          bottom: -150px;
          background: rgba(59, 130, 246, 0.12);
        }

        .orb-three {
          width: 180px;
          height: 180px;
          top: 45%;
          right: 20%;
          background: rgba(168, 85, 247, 0.06);
        }

        /* =====================================================
           MAIN CONTAINER
        ====================================================== */

        .signup-container {
          position: relative;
          z-index: 5;

          width: 100%;
          max-width: 1180px;

          min-height: 720px;

          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(420px, 0.88fr);

          overflow: hidden;

          border-radius: 32px;

          border:
            1px solid
            rgba(255, 255, 255, 0.09);

          background:
            rgba(15, 23, 42, 0.78);

          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);

          box-shadow:
            0 35px 100px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        /* =====================================================
           LEFT BRAND
        ====================================================== */

        .signup-brand {
          position: relative;
          min-width: 0;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: 58px;

          overflow: hidden;

          background:
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.94),
              rgba(2, 6, 23, 0.98)
            );
        }

        .signup-brand::before {
          content: "";
          position: absolute;

          width: 420px;
          height: 420px;

          top: -200px;
          left: -180px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(34, 197, 94, 0.15),
              transparent 68%
            );
        }

        .signup-brand::after {
          content: "";

          position: absolute;

          width: 350px;
          height: 350px;

          right: -180px;
          bottom: -180px;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(59, 130, 246, 0.10),
              transparent 70%
            );
        }

        .brand-overlay {
          position: absolute;
          inset: 0;

          pointer-events: none;

          background:
            linear-gradient(
              120deg,
              transparent 0%,
              rgba(255,255,255,0.018) 50%,
              transparent 100%
            );
        }

        .brand-content {
          position: relative;
          z-index: 2;
        }

        /* =====================================================
           LOGO
        ====================================================== */

        .logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 70px;
        }

        .logo-icon {
          width: 55px;
          height: 55px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 17px;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #15803d
            );

          color: white;

          box-shadow:
            0 14px 32px rgba(34, 197, 94, 0.28),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .logo-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .logo-subtitle {
          margin-top: 4px;

          color: #64748b;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
        }

        /* =====================================================
           EYEBROW
        ====================================================== */

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-bottom: 17px;

          color: #64748b;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #22c55e;

          box-shadow:
            0 0 0 5px
            rgba(34, 197, 94, 0.08),
            0 0 15px
            rgba(34, 197, 94, 0.4);
        }

        /* =====================================================
           BRAND HEADING
        ====================================================== */

        .brand-heading {
          margin: 0;

          max-width: 540px;

          font-size:
            clamp(48px, 5vw, 70px);

          line-height: 0.98;

          letter-spacing: -4px;

          font-weight: 900;
        }

        .brand-heading span {
          background:
            linear-gradient(
              90deg,
              #4ade80,
              #22c55e,
              #86efac
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-description {
          max-width: 510px;

          margin:
            27px 0 0;

          color: #94a3b8;

          font-size: 15px;

          line-height: 1.8;
        }

        /* =====================================================
           FEATURES
        ====================================================== */

        .brand-features {
          display: grid;
          gap: 14px;

          margin-top: 42px;
        }

        .brand-feature {
          display: flex;
          align-items: center;

          gap: 13px;
        }

        .feature-icon {
          width: 32px;
          height: 32px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          background:
            rgba(34, 197, 94, 0.09);

          border:
            1px solid
            rgba(34, 197, 94, 0.12);

          color: #4ade80;
        }

        .brand-feature strong {
          display: block;

          color: #cbd5e1;

          font-size: 13px;
          font-weight: 700;
        }

        .brand-feature span {
          display: block;

          margin-top: 2px;

          color: #475569;

          font-size: 11px;
        }

        /* =====================================================
           BRAND FOOTER
        ====================================================== */

        .brand-footer {
          position: relative;
          z-index: 3;

          display: flex;
          align-items: center;

          gap: 9px;

          color: #64748b;

          font-size: 11px;
          line-height: 1.5;
        }

        .brand-footer svg {
          color: #4ade80;
          flex-shrink: 0;
        }

        /* =====================================================
           FORM SECTION
        ====================================================== */

        .signup-form-section {
          display: flex;
          align-items: center;
          justify-content: center;

          padding: 55px;

          background:
            rgba(15, 23, 42, 0.56);
        }

        .signup-form-container {
          width: 100%;
          max-width: 430px;
        }

        /* =====================================================
           HEADER
        ====================================================== */

        .signup-header {
          margin-bottom: 27px;
        }

        .mobile-logo {
          display: none;
        }

        .header-badge {
          width: fit-content;

          display: flex;
          align-items: center;

          gap: 7px;

          margin-bottom: 13px;
          padding: 7px 10px;

          border-radius: 9px;

          color: #86efac;

          background:
            rgba(34, 197, 94, 0.08);

          border:
            1px solid
            rgba(34, 197, 94, 0.12);

          font-size: 10px;
          font-weight: 750;
        }

        .signup-header h2 {
          margin: 0;

          font-size: 35px;

          line-height: 1.1;

          letter-spacing: -1.4px;

          font-weight: 900;
        }

        .signup-header p {
          margin: 10px 0 0;

          color: #64748b;

          font-size: 13px;

          line-height: 1.6;
        }

        /* =====================================================
           ALERTS
        ====================================================== */

        .signup-alert {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-bottom: 20px;
          padding: 12px 14px;

          border-radius: 12px;

          font-size: 12px;

          line-height: 1.5;
        }

        .error-alert {
          color: #fecaca;

          background:
            rgba(239, 68, 68, 0.08);

          border:
            1px solid
            rgba(239, 68, 68, 0.20);
        }

        .success-alert {
          color: #bbf7d0;

          background:
            rgba(34, 197, 94, 0.08);

          border:
            1px solid
            rgba(34, 197, 94, 0.20);
        }

        .alert-icon {
          width: 18px;
          height: 18px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background: rgba(239,68,68,0.18);

          font-size: 11px;
          font-weight: 900;
        }

        /* =====================================================
           FORM
        ====================================================== */

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .form-group {
          margin-bottom: 17px;
        }

        .form-label {
          display: block;

          margin-bottom: 8px;

          color: #cbd5e1;

          font-size: 12px;
          font-weight: 700;
        }

        /* =====================================================
           INPUT
        ====================================================== */

        .input-wrapper {
          position: relative;
        }

        .input-wrapper > svg.input-icon {
          position: absolute;

          left: 15px;
          top: 50%;

          transform: translateY(-50%);

          color: #475569;

          pointer-events: none;

          transition: 0.2s ease;
        }

        .input-wrapper:focus-within
        > svg.input-icon {
          color: #4ade80;
        }

        .input-wrapper input {
          width: 100%;
          height: 51px;

          padding:
            0 46px;

          border:
            1px solid
            rgba(148, 163, 184, 0.13);

          border-radius: 13px;

          outline: none;

          background:
            rgba(2, 6, 23, 0.58);

          color: #f8fafc;

          font-size: 13px;

          transition:
            border 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .input-wrapper input:hover {
          border-color:
            rgba(148, 163, 184, 0.23);
        }

        .input-wrapper input:focus {
          border-color:
            rgba(34, 197, 94, 0.55);

          background:
            rgba(2, 6, 23, 0.75);

          box-shadow:
            0 0 0 4px
            rgba(34, 197, 94, 0.07);
        }

        .input-wrapper input::placeholder {
          color: #334155;
        }

        .input-wrapper input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* =====================================================
           PASSWORD BUTTON
        ====================================================== */

        .password-toggle {
          position: absolute;

          right: 9px;
          top: 50%;

          width: 34px;
          height: 34px;

          transform: translateY(-50%);

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;

          border-radius: 9px;

          background: transparent;

          color: #475569;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .password-toggle:hover {
          color: #cbd5e1;

          background:
            rgba(255,255,255,0.05);
        }

        /* =====================================================
           PASSWORD STRENGTH
        ====================================================== */

        .password-strength {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-top: 7px;

          font-size: 10px;
        }

        .strength-bar {
          width: 42px;
          height: 3px;

          border-radius: 10px;

          background: #334155;
        }

        .strength-bar.weak {
          background: #ef4444;
        }

        .strength-bar.medium {
          background: #eab308;
        }

        .strength-bar.strong {
          background: #22c55e;
        }

        .password-strength span {
          color: #64748b;
        }

        /* =====================================================
           PASSWORD MATCH
        ====================================================== */

        .password-match {
          display: flex;
          align-items: center;

          margin-top: 7px;

          color: #f87171;

          font-size: 10px;
        }

        .password-match.matched {
          gap: 5px;

          color: #4ade80;
        }

        /* =====================================================
           SECURITY CARD
        ====================================================== */

        .security-card {
          display: flex;
          align-items: flex-start;

          gap: 11px;

          margin:
            4px 0 19px;

          padding: 13px;

          border-radius: 13px;

          border:
            1px solid
            rgba(59, 130, 246, 0.13);

          background:
            rgba(59, 130, 246, 0.045);
        }

        .security-card-icon {
          width: 31px;
          height: 31px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background:
            rgba(59, 130, 246, 0.09);

          color: #60a5fa;
        }

        .security-card strong {
          display: block;

          margin-bottom: 3px;

          color: #dbeafe;

          font-size: 11px;
          font-weight: 750;
        }

        .security-card p {
          margin: 0;

          color: #64748b;

          font-size: 10px;

          line-height: 1.55;
        }

        .security-card b {
          color: #94a3b8;
        }

        /* =====================================================
           SUBMIT BUTTON
        ====================================================== */

        .signup-submit {
          width: 100%;
          height: 53px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 9px;

          border: 0;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #22c55e,
              #15803d
            );

          color: white;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 14px 28px
            rgba(34, 197, 94, 0.17),

            inset 0 1px 0
            rgba(255,255,255,0.18);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .signup-submit:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 18px 35px
            rgba(34, 197, 94, 0.25),

            inset 0 1px 0
            rgba(255,255,255,0.18);
        }

        .signup-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .signup-submit:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        /* =====================================================
           SPINNER
        ====================================================== */

        .button-spinner {
          width: 17px;
          height: 17px;

          border:
            2px solid
            rgba(255,255,255,0.35);

          border-top-color: white;

          border-radius: 50%;

          animation:
            signup-spin
            0.75s
            linear
            infinite;
        }

        @keyframes signup-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           LOGIN LINK
        ====================================================== */

        .signup-login {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 5px;

          margin-top: 23px;

          color: #475569;

          font-size: 12px;
        }

        .signup-login a {
          color: #4ade80;

          font-weight: 750;

          text-decoration: none;

          transition: 0.2s ease;
        }

        .signup-login a:hover {
          color: #86efac;
          text-decoration: underline;
        }

        /* =====================================================
           ACCOUNT INFO
        ====================================================== */

        .account-info {
          display: flex;
          align-items: center;
          justify-content: center;

          gap: 6px;

          margin-top: 17px;

          color: #334155;

          font-size: 10px;
        }

        .account-info svg {
          color: #475569;
        }

        /* =====================================================
           TABLET
        ====================================================== */

        @media (max-width: 950px) {

          .signup-page {
            padding: 18px;
          }

          .signup-container {
            max-width: 650px;

            grid-template-columns: 1fr;

            min-height: auto;
          }

          .signup-brand {
            min-height: 390px;

            padding: 40px;
          }

          .logo-row {
            margin-bottom: 42px;
          }

          .brand-heading {
            font-size: 48px;
          }

          .brand-description {
            max-width: 560px;
          }

          .brand-features {
            display: none;
          }

          .brand-footer {
            margin-top: 45px;
          }

          .signup-form-section {
            padding: 42px;
          }

        }

        /* =====================================================
           MOBILE
        ====================================================== */

        @media (max-width: 560px) {

          .signup-page {
            padding: 8px;
          }

          .signup-container {
            border-radius: 21px;
          }

          .signup-brand {
            display: none;
          }

          .signup-form-section {
            padding: 31px 22px;
          }

          .signup-form-container {
            max-width: 100%;
          }

          .mobile-logo {
            display: flex;
            align-items: center;

            gap: 9px;

            margin-bottom: 22px;

            color: #e2e8f0;

            font-size: 12px;
            font-weight: 850;
            letter-spacing: 0.7px;
          }

          .mobile-logo-icon {
            width: 35px;
            height: 35px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 10px;

            background:
              linear-gradient(
                135deg,
                #22c55e,
                #15803d
              );

            color: white;
          }

          .header-badge {
            margin-bottom: 10px;
          }

          .signup-header h2 {
            font-size: 29px;
          }

          .signup-header p {
            font-size: 12px;
          }

          .input-wrapper input {
            height: 50px;
          }

        }

        /* =====================================================
           SMALL MOBILE
        ====================================================== */

        @media (max-width: 380px) {

          .signup-form-section {
            padding: 25px 17px;
          }

          .signup-header h2 {
            font-size: 26px;
          }

          .security-card {
            padding: 11px;
          }

          .signup-submit {
            height: 51px;
          }

        }

      `}</style>
    </main>
  );
};

export default Signup;

// import React, { useState } from "react";
// import {
//   ArrowRight,
//   Eye,
//   EyeOff,
//   LockKeyhole,
//   Mail,
//   Trophy,
//   User,
// } from "lucide-react";
// import { Link, useNavigate } from "react-router-dom";
// import { authAPI } from "../services/api";
// import { normalizeRole } from "../constants/roles";

// const Signup = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setFormData((previous) => ({ ...previous, [name]: value }));
//     setError("");
//   };

//   const handleSignup = async (event) => {
//     event.preventDefault();
//     const name = formData.name.trim();
//     const email = formData.email.trim().toLowerCase();

//     if (name.length < 2) return setError("Please enter your full name.");
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
//       return setError("Please enter a valid email address.");
//     if (formData.password.length < 6)
//       return setError("Password must contain at least 6 characters.");
//     if (formData.password !== formData.confirmPassword)
//       return setError("Passwords do not match.");

//     setLoading(true);
//     setError("");

//     try {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       const response = await authAPI.register({
//         name,
//         email,
//         password: formData.password,
//       });
//       const result = response?.data;

//       if (result?.token) {
//         const responseUser = result.user || result;
//         const user = {
//           id: responseUser.id ?? responseUser.userId ?? null,
//           userId: responseUser.userId ?? responseUser.id ?? null,
//           name: responseUser.name ?? name,
//           email: responseUser.email ?? email,
//           role: normalizeRole(responseUser.role || "USER"),
//           status: responseUser.status || "ACTIVE",
//         };
//         localStorage.setItem("token", result.token);
//         localStorage.setItem("user", JSON.stringify(user));
//         navigate("/dashboard", { replace: true });
//       } else {
//         navigate("/login", { replace: true, state: { registered: true } });
//       }
//     } catch (signupError) {
//       const message =
//         signupError?.response?.data?.message ||
//         signupError?.response?.data?.error ||
//         signupError?.message ||
//         "Unable to create account.";
//       setError(
//         typeof message === "string" ? message : "Unable to create account.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="login-page">
//       <section className="login-container">
//         <div className="login-brand">
//           <div className="brand-content">
//             <div className="logo-row">
//               <div className="logo-icon">
//                 <Trophy size={26} />
//               </div>
//               <div>
//                 <div className="logo-title">CRICKET SCORE</div>
//                 <div className="logo-subtitle">COMMAND CENTER</div>
//               </div>
//             </div>
//             <h1 className="brand-heading">
//               Join the <span>game.</span>
//             </h1>
//             <p className="brand-description">
//               Create your public user account and follow tournaments, teams,
//               players, and live matches.
//             </p>
//           </div>
//           <div className="brand-footer">
//             Public accounts are created with the USER role.
//           </div>
//         </div>

//         <div className="login-form-section">
//           <div className="login-form-container">
//             <div className="login-header">
//               <h2>Create account</h2>
//               <p>Sign up to access your cricket dashboard.</p>
//             </div>
//             {error && <div className="alert alert-error">{error}</div>}

//             <form onSubmit={handleSignup}>
//               <div className="form-group">
//                 <label className="form-label" htmlFor="signup-name">
//                   Full name
//                 </label>
//                 <div className="login-input-wrapper">
//                   <User size={18} />
//                   <input
//                     id="signup-name"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     placeholder="Your full name"
//                     autoComplete="name"
//                     disabled={loading}
//                   />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label" htmlFor="signup-email">
//                   Email address
//                 </label>
//                 <div className="login-input-wrapper">
//                   <Mail size={18} />
//                   <input
//                     id="signup-email"
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder="you@example.com"
//                     autoComplete="email"
//                     disabled={loading}
//                   />
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label" htmlFor="signup-password">
//                   Password
//                 </label>
//                 <div className="login-input-wrapper">
//                   <LockKeyhole size={18} />
//                   <input
//                     id="signup-password"
//                     type={showPassword ? "text" : "password"}
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="At least 6 characters"
//                     autoComplete="new-password"
//                     disabled={loading}
//                   />
//                   <button
//                     type="button"
//                     className="password-toggle"
//                     onClick={() => setShowPassword((previous) => !previous)}
//                     aria-label={
//                       showPassword ? "Hide password" : "Show password"
//                     }
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label className="form-label" htmlFor="signup-confirm-password">
//                   Confirm password
//                 </label>
//                 <div className="login-input-wrapper">
//                   <LockKeyhole size={18} />
//                   <input
//                     id="signup-confirm-password"
//                     type={showConfirmPassword ? "text" : "password"}
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="Repeat your password"
//                     autoComplete="new-password"
//                     disabled={loading}
//                   />
//                   <button
//                     type="button"
//                     className="password-toggle"
//                     onClick={() =>
//                       setShowConfirmPassword((previous) => !previous)
//                     }
//                     aria-label={
//                       showConfirmPassword ? "Hide password" : "Show password"
//                     }
//                   >
//                     {showConfirmPassword ? (
//                       <EyeOff size={18} />
//                     ) : (
//                       <Eye size={18} />
//                     )}
//                   </button>
//                 </div>
//               </div>
//               <button type="submit" className="login-submit" disabled={loading}>
//                 {loading ? (
//                   "Creating account..."
//                 ) : (
//                   <>
//                     Create account <ArrowRight size={19} />
//                   </>
//                 )}
//               </button>
//             </form>

//             <div className="signup-login">
//               Already have an account? <Link to="/login">Sign in</Link>
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// };

// export default Signup;
