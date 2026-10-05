import React, { useState } from "react";
import {
  Trophy,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Radio,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { normalizeRole, ROLES } from "../constants/roles";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // -----------------------------------------------------
      // CLEAR OLD AUTHENTICATION
      // -----------------------------------------------------

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // -----------------------------------------------------
      // LOGIN API
      // -----------------------------------------------------

      console.log("LOGIN REQUEST:", {
        email,
      });

      const response = await authAPI.login({
        email,
        password,
      });

      const result = response?.data;

      console.log("LOGIN RESPONSE:", result);

      // -----------------------------------------------------
      // CHECK TOKEN
      // -----------------------------------------------------

      if (!result?.token) {
        throw new Error(
          result?.message ||
            "Login failed. Token was not returned by the server.",
        );
      }

      // -----------------------------------------------------
      // SUPPORT BOTH RESPONSE FORMATS
      //
      // FORMAT 1:
      // {
      //   token,
      //   user: {
      //     id,
      //     name,
      //     email,
      //     role
      //   }
      // }
      //
      // FORMAT 2:
      // {
      //   token,
      //   userId,
      //   name,
      //   email,
      //   role
      // }
      // -----------------------------------------------------

      const responseUser = result?.user || result;

      // -----------------------------------------------------
      // NORMALIZE ROLE
      //
      // ADMIN       -> admin
      // ROLE_ADMIN  -> admin
      // admin       -> admin
      // -----------------------------------------------------

      const role = normalizeRole(responseUser?.role || "USER");

      // -----------------------------------------------------
      // BUILD USER OBJECT
      // -----------------------------------------------------

      const user = {
        id: responseUser?.id ?? responseUser?.userId ?? null,

        userId: responseUser?.userId ?? responseUser?.id ?? null,

        name: responseUser?.name || "",

        email: responseUser?.email || email,

        role,

        status: responseUser?.status || "ACTIVE",
      };

      console.log("AUTHENTICATED USER:", user);

      console.log("NORMALIZED ROLE:", role);

      // -----------------------------------------------------
      // VALIDATE ROLE
      // -----------------------------------------------------

      const validRoles = Object.values(ROLES);

      if (!validRoles.includes(role)) {
        console.warn("Unknown role received:", responseUser?.role);

        throw new Error(`Invalid account role: ${responseUser?.role}`);
      }

      // -----------------------------------------------------
      // SAVE AUTHENTICATION
      // -----------------------------------------------------

      localStorage.setItem("token", result.token);

      localStorage.setItem("user", JSON.stringify(user));

      console.log("TOKEN SAVED:", Boolean(localStorage.getItem("token")));

      console.log("USER SAVED:", JSON.parse(localStorage.getItem("user")));

      // -----------------------------------------------------
      // ROLE BASED REDIRECTION
      // -----------------------------------------------------

      switch (role) {
        case ROLES.ADMIN:
          console.log("REDIRECTING TO ADMIN");

          navigate("/admin", {
            replace: true,
          });

          break;

        case ROLES.ORGANIZER:
          console.log("REDIRECTING TO ORGANIZER");

          navigate("/organizer", {
            replace: true,
          });

          break;

        case ROLES.SCORER:
          console.log("REDIRECTING TO SCORER");

          navigate("/scorer", {
            replace: true,
          });

          break;

        case ROLES.USER:
          console.log("REDIRECTING TO USER DASHBOARD");

          navigate("/dashboard", {
            replace: true,
          });

          break;

        default:
          console.log("UNKNOWN ROLE - REDIRECTING TO DASHBOARD");

          navigate("/dashboard", {
            replace: true,
          });

          break;
      }
    } catch (loginError) {
      // -----------------------------------------------------
      // LOGIN ERROR
      // -----------------------------------------------------

      console.error("LOGIN ERROR:", loginError);

      // Clear invalid authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const message =
        loginError?.response?.data?.message ||
        loginError?.response?.data?.error ||
        loginError?.response?.data?.detail ||
        loginError?.message ||
        "Unable to sign in. Please check your credentials.";

      setError(
        typeof message === "string"
          ? message
          : "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="premium-login-page">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="login-grid"></div>

      <div className="login-orb login-orb-one"></div>
      <div className="login-orb login-orb-two"></div>
      <div className="login-orb login-orb-three"></div>

      {/* =====================================================
          MAIN CONTAINER
      ===================================================== */}

      <section className="premium-login-container">
        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <aside className="premium-login-left">
          <div className="left-glow"></div>

          {/* BRAND */}

          <div className="premium-brand">
            <div className="premium-brand-icon">
              <Trophy size={27} strokeWidth={2.3} />
            </div>

            <div>
              <div className="premium-brand-title">MYVS</div>

              <div className="premium-brand-subtitle">CRIC</div>
            </div>
          </div>

          {/* HERO */}

          <div className="premium-hero">
            <div className="live-pill">
              <span className="live-pulse"></span>
              <Radio size={13} />
              LIVE CRICKET PLATFORM
            </div>

            <h1>
              Control the
              <br />
              <span>game.</span>
            </h1>

            <p>
              One powerful command center for tournaments, teams, players,
              matches and live cricket scoring.
            </p>

            {/* FEATURES */}

            <div className="premium-features">
              <div className="premium-feature">
                <div className="premium-feature-icon">
                  <Trophy size={18} />
                </div>

                <div>
                  <strong>Tournament Management</strong>

                  <span>Build and manage complete cricket tournaments.</span>
                </div>
              </div>

              <div className="premium-feature">
                <div className="premium-feature-icon">
                  <Radio size={18} />
                </div>

                <div>
                  <strong>Live Scoring</strong>

                  <span>Keep every ball and score update synchronized.</span>
                </div>
              </div>

              <div className="premium-feature">
                <div className="premium-feature-icon">
                  <Users size={18} />
                </div>

                <div>
                  <strong>Teams & Players</strong>

                  <span>Organize your complete cricket ecosystem.</span>
                </div>
              </div>
            </div>
          </div>

          {/* LEFT FOOTER */}

          <div className="premium-left-footer">
            <ShieldCheck size={15} />

            <span>Secure role-based access</span>

            <span className="footer-separator">•</span>

            <span> BHARTESH NAKATE n© 2026</span>
          </div>
        </aside>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <section className="premium-login-right">
          <div className="login-card">
            {/* MOBILE BRAND */}

            <div className="mobile-brand">
              <div className="mobile-brand-icon">
                <Trophy size={22} />
              </div>

              <div>
                <strong>MYVS</strong>

                <span>CRIC</span>
              </div>
            </div>

            {/* HEADER */}

            <div className="login-card-header">
              <div className="welcome-label">WELCOME BACK</div>

              <h2>
                Sign in
                <span> securely.</span>
              </h2>

              <p>
                Enter your credentials to continue to your cricket dashboard.
              </p>
            </div>

            {/* ERROR */}

            {error && (
              <div className="premium-error">
                <div className="error-icon">
                  <AlertCircle size={17} />
                </div>

                <div>
                  <strong>Sign in failed</strong>

                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* FORM */}

            <form className="premium-login-form" onSubmit={handleLogin}>
              {/* EMAIL */}

              <div className="premium-field">
                <label htmlFor="login-email">Email address</label>

                <div className="premium-input">
                  <div className="premium-input-icon">
                    <Mail size={18} />
                  </div>

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="premium-field">
                <div className="password-label-row">
                  <label htmlFor="login-password">Password</label>

                  <button
                    type="button"
                    className="forgot-button"
                    onClick={() =>
                      setError("Password recovery will be connected later.")
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="premium-input">
                  <div className="premium-input-icon">
                    <LockKeyhole size={18} />
                  </div>

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="premium-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* SECURITY ROW */}

              <div className="security-row">
                <div className="remember-wrapper">
                  <input id="remember" type="checkbox" />

                  <label htmlFor="remember">Remember me</label>
                </div>

                <div className="secure-badge">
                  <CheckCircle2 size={14} />
                  Secure connection
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="premium-login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="premium-spinner"></span>

                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Command Center</span>

                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </form>

            {/* ROLE INFO */}

            <div className="role-info">
              <div className="role-info-icon">
                <ShieldCheck size={17} />
              </div>

              <div>
                <strong>Automatic role detection</strong>

                <p>
                  Your account role is securely determined by the server. Admin,
                  Organizer, Scorer and User accounts are redirected
                  automatically.
                </p>
              </div>
            </div>

            {/* SIGNUP */}

            <div className="create-account">
              <span>Don't have an account?</span>

              <Link to="/signup">
                Create Account
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </section>

      {/* =====================================================
          CSS
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          min-height: 100%;
        }

        .premium-login-page {
          position: relative;
          min-height: 100vh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 28px;

          overflow: hidden;

          background:
            radial-gradient(
              circle at 15% 20%,
              rgba(37, 99, 235, 0.13),
              transparent 32%
            ),
            radial-gradient(
              circle at 85% 75%,
              rgba(14, 165, 233, 0.09),
              transparent 32%
            ),
            #020617;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .login-grid {
          position: absolute;
          inset: 0;

          opacity: 0.25;

          background-image:
            linear-gradient(
              rgba(148, 163, 184, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(148, 163, 184, 0.045) 1px,
              transparent 1px
            );

          background-size: 45px 45px;

          mask-image:
            linear-gradient(
              to bottom,
              black,
              transparent 90%
            );

          pointer-events: none;
        }

        .login-orb {
          position: absolute;

          border-radius: 50%;

          pointer-events: none;

          filter: blur(90px);
        }

        .login-orb-one {
          width: 330px;
          height: 330px;

          top: -180px;
          left: -100px;

          background:
            rgba(37, 99, 235, 0.15);
        }

        .login-orb-two {
          width: 400px;
          height: 400px;

          right: -180px;
          bottom: -200px;

          background:
            rgba(14, 165, 233, 0.11);
        }

        .login-orb-three {
          width: 190px;
          height: 190px;

          right: 35%;
          top: 10%;

          background:
            rgba(99, 102, 241, 0.07);
        }

        .premium-login-container {
          position: relative;

          z-index: 5;

          width: 100%;
          max-width: 1280px;

          min-height: 760px;

          display: grid;

          grid-template-columns:
            1.08fr
            0.92fr;

          overflow: hidden;

          border:
            1px solid
            rgba(255, 255, 255, 0.09);

          border-radius: 30px;

          background:
            rgba(15, 23, 42, 0.72);

          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);

          box-shadow:
            0 40px 120px
            rgba(0, 0, 0, 0.55),

            inset 0 1px 0
            rgba(255, 255, 255, 0.06);
        }

        .premium-login-left {
          position: relative;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: 54px 60px;

          overflow: hidden;

          background:
            linear-gradient(
              145deg,
              rgba(15, 23, 42, 0.97),
              rgba(2, 6, 23, 0.98)
            );
        }

        .premium-login-left::before {
          content: "";

          position: absolute;

          width: 650px;
          height: 650px;

          border-radius: 50%;

          top: -330px;
          right: -280px;

          background:
            radial-gradient(
              circle,
              rgba(37, 99, 235, 0.17),
              transparent 68%
            );
        }

        .premium-login-left::after {
          content: "";

          position: absolute;

          width: 500px;
          height: 500px;

          border-radius: 50%;

          bottom: -340px;
          left: -270px;

          border:
            1px solid
            rgba(59, 130, 246, 0.12);
        }

        .left-glow {
          position: absolute;

          width: 300px;
          height: 300px;

          left: 40%;
          top: 35%;

          border-radius: 50%;

          background:
            rgba(37, 99, 235, 0.04);

          filter: blur(70px);
        }

        .premium-brand {
          position: relative;

          z-index: 3;

          display: flex;

          align-items: center;

          gap: 14px;
        }

        .premium-brand-icon {
          width: 52px;
          height: 52px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 16px;

          color: #fff;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          box-shadow:
            0 15px 35px
            rgba(37, 99, 235, 0.32),

            inset 0 1px 0
            rgba(255, 255, 255, 0.22);
        }

        .premium-brand-title {
          color: #f8fafc;

          font-size: 18px;

          font-weight: 900;

          letter-spacing: 1.7px;
        }

        .premium-brand-subtitle {
          margin-top: 4px;

          color: #475569;

          font-size: 9px;

          font-weight: 800;

          letter-spacing: 2.8px;
        }

        .premium-hero {
          position: relative;

          z-index: 3;

          max-width: 650px;

          margin: auto 0;
        }

        .live-pill {
          width: fit-content;

          display: flex;
          align-items: center;

          gap: 8px;

          padding: 8px 13px;

          border:
            1px solid
            rgba(59, 130, 246, 0.2);

          border-radius: 999px;

          color: #93c5fd;

          background:
            rgba(30, 41, 59, 0.52);

          font-size: 9px;

          font-weight: 850;

          letter-spacing: 1.7px;
        }

        .live-pulse {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #22c55e;

          box-shadow:
            0 0 0 5px
            rgba(34, 197, 94, 0.08);

          animation:
            premiumPulse 1.8s infinite;
        }

        @keyframes premiumPulse {

          0% {
            box-shadow:
              0 0 0 0
              rgba(34, 197, 94, 0.35);
          }

          70% {
            box-shadow:
              0 0 0 9px
              rgba(34, 197, 94, 0);
          }

          100% {
            box-shadow:
              0 0 0 0
              rgba(34, 197, 94, 0);
          }

        }

        .premium-hero h1 {
          margin: 24px 0 17px;

          color: #f8fafc;

          font-size:
            clamp(
              48px,
              5vw,
              76px
            );

          line-height: 0.98;

          letter-spacing: -4px;

          font-weight: 950;
        }

        .premium-hero h1 span {
          background:
            linear-gradient(
              90deg,
              #60a5fa,
              #38bdf8,
              #818cf8
            );

          -webkit-background-clip: text;
          background-clip: text;

          color: transparent;
        }

        .premium-hero > p {
          max-width: 570px;

          margin: 0;

          color: #94a3b8;

          font-size: 15px;

          line-height: 1.8;
        }

        .premium-features {
          display: grid;

          gap: 12px;

          margin-top: 34px;
        }

        .premium-feature {
          display: flex;

          align-items: center;

          gap: 14px;

          padding: 13px 15px;

          border:
            1px solid
            rgba(148, 163, 184, 0.07);

          border-radius: 14px;

          background:
            rgba(15, 23, 42, 0.48);

          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            background 0.25s ease;
        }

        .premium-feature:hover {
          transform: translateX(6px);

          border-color:
            rgba(59, 130, 246, 0.23);

          background:
            rgba(30, 41, 59, 0.62);
        }

        .premium-feature-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          color: #60a5fa;

          background:
            rgba(37, 99, 235, 0.1);
        }

        .premium-feature strong {
          display: block;

          color: #e2e8f0;

          font-size: 12px;

          font-weight: 750;
        }

        .premium-feature span {
          display: block;

          margin-top: 3px;

          color: #475569;

          font-size: 10px;
        }

        .premium-left-footer {
          position: relative;

          z-index: 3;

          display: flex;

          align-items: center;

          gap: 8px;

          color: #475569;

          font-size: 10px;
        }

        .premium-left-footer svg {
          color: #3b82f6;
        }

        .footer-separator {
          color: #1e293b;
        }

        .premium-login-right {
          display: flex;

          align-items: center;
          justify-content: center;

          padding: 55px;

          background:
            radial-gradient(
              circle at 20% 10%,
              rgba(59, 130, 246, 0.08),
              transparent 35%
            ),
            #f8fafc;
        }

        .login-card {
          width: 100%;

          max-width: 435px;
        }

        .mobile-brand {
          display: none;
        }

        .login-card-header {
          margin-bottom: 28px;
        }

        .welcome-label {
          margin-bottom: 9px;

          color: #2563eb;

          font-size: 10px;

          font-weight: 900;

          letter-spacing: 2.2px;
        }

        .login-card-header h2 {
          margin: 0;

          color: #0f172a;

          font-size: 37px;

          line-height: 1.08;

          letter-spacing: -1.7px;

          font-weight: 950;
        }

        .login-card-header h2 span {
          color: #2563eb;
        }

        .login-card-header p {
          max-width: 370px;

          margin: 11px 0 0;

          color: #64748b;

          font-size: 13px;

          line-height: 1.65;
        }

        .premium-error {
          display: flex;

          gap: 11px;

          align-items: flex-start;

          margin-bottom: 20px;

          padding: 12px 13px;

          border:
            1px solid
            #fecaca;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #fff7f7,
              #fef2f2
            );

          color: #b91c1c;
        }

        .error-icon {
          width: 29px;
          height: 29px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background:
            #fee2e2;

          color: #dc2626;
        }

        .premium-error strong {
          display: block;

          margin-bottom: 2px;

          font-size: 11px;

          font-weight: 850;
        }

        .premium-error span {
          display: block;

          color: #dc2626;

          font-size: 11px;

          line-height: 1.45;
        }

        .premium-login-form {
          display: flex;

          flex-direction: column;

          gap: 19px;
        }

        .premium-field label {
          display: block;

          margin-bottom: 8px;

          color: #334155;

          font-size: 11px;

          font-weight: 850;
        }

        .password-label-row {
          display: flex;

          align-items: center;

          justify-content: space-between;
        }

        .forgot-button {
          border: 0;

          padding: 0;

          background: transparent;

          color: #2563eb;

          font-size: 10px;

          font-weight: 750;

          cursor: pointer;
        }

        .forgot-button:hover {
          color: #1d4ed8;

          text-decoration: underline;
        }

        .premium-input {
          position: relative;

          display: flex;

          align-items: center;
        }

        .premium-input-icon {
          position: absolute;

          left: 15px;

          z-index: 2;

          display: flex;

          color: #94a3b8;

          pointer-events: none;

          transition:
            color 0.2s ease;
        }

        .premium-input:focus-within
        .premium-input-icon {
          color: #2563eb;
        }

        .premium-input input {
          width: 100%;

          height: 53px;

          padding:
            0
            46px
            0
            45px;

          border:
            1px solid
            #e2e8f0;

          border-radius: 14px;

          outline: none;

          background: #ffffff;

          color: #0f172a;

          font-size: 13px;

          box-shadow:
            0 3px 10px
            rgba(15, 23, 42, 0.025);

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .premium-input input:hover {
          border-color: #cbd5e1;
        }

        .premium-input input:focus {
          border-color: #3b82f6;

          box-shadow:
            0 0 0 4px
            rgba(59, 130, 246, 0.09),

            0 7px 18px
            rgba(15, 23, 42, 0.05);

          transform: translateY(-1px);
        }

        .premium-input input::placeholder {
          color: #a1a1aa;
        }

        .premium-input input:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }

        .premium-password-toggle {
          position: absolute;

          right: 9px;

          width: 35px;
          height: 35px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 0;

          border-radius: 9px;

          background: transparent;

          color: #94a3b8;

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .premium-password-toggle:hover {
          background: #f1f5f9;

          color: #2563eb;
        }

        .security-row {
          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-top: -2px;
        }

        .remember-wrapper {
          display: flex;

          align-items: center;

          gap: 8px;

          color: #64748b;

          font-size: 11px;

          cursor: pointer;
        }

        .remember-wrapper input {
          width: 15px;
          height: 15px;

          margin: 0;

          accent-color: #2563eb;

          cursor: pointer;
        }

        .secure-badge {
          display: flex;

          align-items: center;

          gap: 5px;

          color: #16a34a;

          font-size: 10px;

          font-weight: 750;
        }

        .premium-login-button {
          position: relative;

          width: 100%;

          height: 55px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 10px;

          margin-top: 2px;

          border: 0;

          border-radius: 14px;

          overflow: hidden;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8 55%,
              #1e40af
            );

          color: #ffffff;

          font-size: 13px;

          font-weight: 850;

          cursor: pointer;

          box-shadow:
            0 13px 27px
            rgba(37, 99, 235, 0.22);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            filter 0.2s ease;
        }

        .premium-login-button::before {
          content: "";

          position: absolute;

          inset: 0;

          background:
            linear-gradient(
              120deg,
              transparent,
              rgba(255,255,255,0.14),
              transparent
            );

          transform:
            translateX(-100%);

          transition:
            transform 0.55s ease;
        }

        .premium-login-button:hover:not(:disabled)::before {
          transform:
            translateX(100%);
        }

        .premium-login-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 18px 36px
            rgba(37, 99, 235, 0.29);

          filter: brightness(1.04);
        }

        .premium-login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .premium-login-button:disabled {
          opacity: 0.68;

          cursor: not-allowed;
        }

        .premium-spinner {
          width: 17px;
          height: 17px;

          border:
            2px solid
            rgba(255,255,255,0.35);

          border-top-color: #ffffff;

          border-radius: 50%;

          animation:
            premiumSpin 0.7s linear infinite;
        }

        @keyframes premiumSpin {

          to {
            transform: rotate(360deg);
          }

        }

        .role-info {
          display: flex;

          gap: 11px;

          margin-top: 22px;

          padding: 13px;

          border:
            1px solid
            #dbeafe;

          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #f8fbff,
              #eff6ff
            );
        }

        .role-info-icon {
          width: 31px;
          height: 31px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 9px;

          background: #dbeafe;

          color: #2563eb;
        }

        .role-info strong {
          display: block;

          margin-bottom: 3px;

          color: #1e3a8a;

          font-size: 10px;

          font-weight: 850;
        }

        .role-info p {
          margin: 0;

          color: #64748b;

          font-size: 9px;

          line-height: 1.55;
        }

        .create-account {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 6px;

          margin-top: 25px;

          color: #64748b;

          font-size: 11px;
        }

        .create-account a {
          display: inline-flex;

          align-items: center;

          gap: 4px;

          color: #2563eb;

          font-weight: 800;

          text-decoration: none;

          transition:
            color 0.2s ease;
        }

        .create-account a:hover {
          color: #1d4ed8;
        }

        @media (max-width: 1050px) {

          .premium-login-page {
            padding: 18px;
          }

          .premium-login-container {
            grid-template-columns:
              1fr
              0.9fr;

            min-height: 700px;
          }

          .premium-login-left {
            padding: 45px;
          }

          .premium-login-right {
            padding: 38px;
          }

          .premium-hero h1 {
            font-size: 55px;
          }

        }

        @media (max-width: 850px) {

          .premium-login-page {
            padding: 0;

            overflow-y: auto;
          }

          .premium-login-container {
            min-height: 100vh;

            grid-template-columns: 1fr;

            border: 0;

            border-radius: 0;
          }

          .premium-login-left {
            display: none;
          }

          .premium-login-right {
            min-height: 100vh;

            padding:
              35px 22px;

            background:
              radial-gradient(
                circle at top,
                rgba(37, 99, 235, 0.08),
                transparent 35%
              ),
              #f8fafc;
          }

          .login-card {
            max-width: 440px;
          }

          .mobile-brand {
            display: flex;

            align-items: center;

            gap: 10px;

            margin-bottom: 48px;
          }

          .mobile-brand-icon {
            width: 42px;
            height: 42px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #2563eb,
                #1d4ed8
              );

            color: white;

            box-shadow:
              0 10px 24px
              rgba(37, 99, 235, 0.2);
          }

          .mobile-brand strong {
            display: block;

            color: #0f172a;

            font-size: 13px;

            letter-spacing: 1.4px;
          }

          .mobile-brand span {
            display: block;

            margin-top: 3px;

            color: #94a3b8;

            font-size: 8px;

            font-weight: 800;

            letter-spacing: 2px;
          }

        }

        @media (max-width: 480px) {

          .premium-login-right {
            padding:
              28px 17px;
          }

          .mobile-brand {
            margin-bottom: 38px;
          }

          .login-card-header h2 {
            font-size: 31px;
          }

          .login-card-header p {
            font-size: 12px;
          }

          .premium-input input {
            height: 51px;
          }

          .premium-login-button {
            height: 53px;

            font-size: 12px;
          }

          .security-row {
            align-items: flex-start;

            flex-direction: column;

            gap: 10px;
          }

          .secure-badge {
            display: none;
          }

          .role-info {
            padding: 11px;
          }

          .create-account {
            flex-wrap: wrap;

            text-align: center;
          }

        }

        @media (max-width: 360px) {

          .premium-login-right {
            padding:
              23px 14px;
          }

          .login-card-header h2 {
            font-size: 28px;
          }

          .premium-login-form {
            gap: 17px;
          }

        }

      `}</style>
    </main>
  );
};

export default Login;

// import React, { useState } from "react";
// import {
//   Trophy,
//   Mail,
//   LockKeyhole,
//   Eye,
//   EyeOff,
//   ArrowRight,
//   ShieldCheck,
//   Radio,
//   Users,
//   AlertCircle,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { authAPI } from "../services/api";
// import { normalizeRole, ROLE_OPTIONS } from "../constants/roles";

// const Login = () => {
//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//     expectedRole: "USER",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData((previous) => ({
//       ...previous,
//       [name]: value,
//     }));

//     if (error) {
//       setError("");
//     }
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     setError("");

//     const email = formData.email.trim();
//     const password = formData.password;

//     if (!email) {
//       setError("Please enter your email.");
//       return;
//     }

//     if (!password) {
//       setError("Please enter your password.");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Remove previous authentication
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");

//       // Login request
//       const response = await authAPI.login({
//         email,
//         password,
//       });

//       const result = response.data;

//       console.log("LOGIN RESPONSE:", result);

//       // Backend must return token
//       if (!result?.token) {
//         throw new Error(
//           result?.message || "Login failed. Token was not returned.",
//         );
//       }

//       // Support both:
//       // { token, user: {...} }
//       // and
//       // { token, userId, name, email, role }
//       const responseUser = result?.user || result;

//       const user = {
//         id: responseUser.id ?? responseUser.userId ?? null,

//         userId: responseUser.userId ?? responseUser.id ?? null,

//         name: responseUser.name ?? "",

//         email: responseUser.email ?? email,

//         role: normalizeRole(responseUser.role || "USER"),
//       };

//       if (
//         formData.expectedRole !== "ANY" &&
//         formData.expectedRole !== user.role
//       ) {
//         throw new Error(
//           `This account is registered as ${user.role.toLowerCase()}, not ${formData.expectedRole.toLowerCase()}.`,
//         );
//       }

//       // Store JWT
//       localStorage.setItem("token", result.token);

//       // Store user
//       localStorage.setItem("user", JSON.stringify(user));

//       console.log("AUTHENTICATED USER:", user);

//       // Dashboard
//       navigate("/dashboard", {
//         replace: true,
//       });
//     } catch (loginError) {
//       console.error("LOGIN ERROR:", loginError);

//       const message =
//         loginError.response?.data?.message ||
//         loginError.response?.data?.error ||
//         loginError.message ||
//         "Unable to sign in.";

//       setError(
//         typeof message === "string"
//           ? message
//           : "Unable to sign in. Please check your credentials.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <style>{`
//         /* =========================================================
//            CRICKET COMMAND CENTER - PREMIUM LOGIN
//         ========================================================= */

//         .login-page {
//           min-height: 100vh;
//           display: flex;
//           background:
//             radial-gradient(
//               circle at 20% 20%,
//               rgba(37, 99, 235, 0.15),
//               transparent 35%
//             ),
//             radial-gradient(
//               circle at 80% 80%,
//               rgba(14, 165, 233, 0.1),
//               transparent 35%
//             ),
//             #020617;
//           color: #fff;
//           overflow: hidden;
//         }

//         /* =========================================================
//            LEFT BRAND PANEL
//         ========================================================= */

//         .login-brand-panel {
//           position: relative;
//           width: 55%;
//           min-height: 100vh;
//           padding: 42px 65px;
//           display: flex;
//           flex-direction: column;
//           justify-content: space-between;
//           overflow: hidden;

//           background:
//             linear-gradient(
//               135deg,
//               rgba(15, 23, 42, 0.96),
//               rgba(2, 6, 23, 0.98)
//             );
//         }

//         .login-brand-panel::before {
//           content: "";
//           position: absolute;
//           width: 550px;
//           height: 550px;
//           border-radius: 50%;
//           background: rgba(37, 99, 235, 0.12);
//           filter: blur(10px);
//           top: -250px;
//           right: -200px;
//         }

//         .login-brand-panel::after {
//           content: "";
//           position: absolute;
//           width: 450px;
//           height: 450px;
//           border-radius: 50%;
//           border: 1px solid rgba(59, 130, 246, 0.15);
//           bottom: -250px;
//           left: -180px;
//         }

//         /* =========================================================
//            BRAND
//         ========================================================= */

//         .login-brand {
//           position: relative;
//           z-index: 2;
//           display: flex;
//           align-items: center;
//           gap: 14px;
//         }

//         .login-logo {
//           width: 48px;
//           height: 48px;
//           border-radius: 14px;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           background:
//             linear-gradient(
//               135deg,
//               #2563eb,
//               #1d4ed8
//             );

//           box-shadow:
//             0 12px 35px rgba(37, 99, 235, 0.35),
//             inset 0 1px 0 rgba(255, 255, 255, 0.2);

//           color: #fff;
//         }

//         .login-brand h2 {
//           margin: 0;
//           font-size: 17px;
//           font-weight: 900;
//           letter-spacing: 2px;
//         }

//         .login-brand span {
//           display: block;
//           margin-top: 2px;
//           font-size: 10px;
//           font-weight: 700;
//           letter-spacing: 2.5px;
//           color: #64748b;
//         }

//         /* =========================================================
//            HERO
//         ========================================================= */

//         .login-hero-content {
//           position: relative;
//           z-index: 2;
//           max-width: 650px;
//           margin: auto 0;
//         }

//         .login-live-badge {
//           display: inline-flex;
//           align-items: center;
//           gap: 9px;

//           padding: 8px 13px;

//           border: 1px solid rgba(59, 130, 246, 0.25);
//           border-radius: 999px;

//           background: rgba(30, 41, 59, 0.5);

//           color: #93c5fd;

//           font-size: 10px;
//           font-weight: 800;
//           letter-spacing: 1.5px;
//         }

//         .live-dot {
//           width: 7px;
//           height: 7px;
//           border-radius: 50%;
//           background: #22c55e;

//           box-shadow:
//             0 0 0 5px rgba(34, 197, 94, 0.12);

//           animation: livePulse 1.8s infinite;
//         }

//         @keyframes livePulse {
//           0% {
//             box-shadow:
//               0 0 0 0 rgba(34, 197, 94, 0.35);
//           }

//           70% {
//             box-shadow:
//               0 0 0 8px rgba(34, 197, 94, 0);
//           }

//           100% {
//             box-shadow:
//               0 0 0 0 rgba(34, 197, 94, 0);
//           }
//         }

//         .login-hero-content h1 {
//           margin: 25px 0 18px;

//           font-size: clamp(
//             42px,
//             4.2vw,
//             68px
//           );

//           line-height: 1.03;
//           letter-spacing: -2.5px;
//           font-weight: 900;
//         }

//         .login-hero-content h1 span {
//           display: inline-block;

//           background:
//             linear-gradient(
//               90deg,
//               #60a5fa,
//               #38bdf8,
//               #818cf8
//             );

//           -webkit-background-clip: text;
//           background-clip: text;
//           color: transparent;
//         }

//         .login-hero-content > p {
//           max-width: 560px;
//           margin: 0;

//           color: #94a3b8;

//           font-size: 16px;
//           line-height: 1.75;
//         }

//         /* =========================================================
//            FEATURES
//         ========================================================= */

//         .login-features {
//           display: grid;
//           gap: 14px;
//           margin-top: 38px;
//         }

//         .login-feature {
//           display: flex;
//           align-items: center;
//           gap: 15px;

//           padding: 15px 18px;

//           border: 1px solid
//             rgba(148, 163, 184, 0.08);

//           border-radius: 15px;

//           background:
//             rgba(15, 23, 42, 0.55);

//           backdrop-filter: blur(10px);

//           transition:
//             transform 0.25s ease,
//             border-color 0.25s ease,
//             background 0.25s ease;
//         }

//         .login-feature:hover {
//           transform: translateX(6px);

//           border-color:
//             rgba(59, 130, 246, 0.3);

//           background:
//             rgba(30, 41, 59, 0.65);
//         }

//         .login-feature-icon {
//           width: 40px;
//           height: 40px;
//           flex-shrink: 0;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border-radius: 11px;

//           background:
//             rgba(37, 99, 235, 0.12);

//           color: #60a5fa;
//         }

//         .login-feature strong {
//           display: block;

//           color: #f8fafc;

//           font-size: 13px;
//           font-weight: 700;
//         }

//         .login-feature span {
//           display: block;

//           margin-top: 3px;

//           color: #64748b;

//           font-size: 11px;
//         }

//         /* =========================================================
//            FOOTER
//         ========================================================= */

//         .login-brand-footer {
//           position: relative;
//           z-index: 2;

//           display: flex;
//           gap: 10px;
//           align-items: center;

//           color: #475569;

//           font-size: 10px;
//         }

//         /* =========================================================
//            RIGHT FORM PANEL
//         ========================================================= */

//         .login-form-panel {
//           width: 45%;
//           min-height: 100vh;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           padding: 50px;

//           background:
//             radial-gradient(
//               circle at 70% 20%,
//               rgba(37, 99, 235, 0.07),
//               transparent 40%
//             ),
//             #f8fafc;
//         }

//         .login-form-container {
//           width: 100%;
//           max-width: 440px;
//         }

//         /* =========================================================
//            HEADING
//         ========================================================= */

//         .login-heading {
//           margin-bottom: 28px;
//         }

//         .login-welcome {
//           margin-bottom: 8px;

//           color: #2563eb;

//           font-size: 11px;
//           font-weight: 900;
//           letter-spacing: 2px;
//         }

//         .login-heading h2 {
//           margin: 0;

//           color: #0f172a;

//           font-size: 32px;
//           line-height: 1.15;
//           font-weight: 900;
//           letter-spacing: -1px;
//         }

//         .login-heading p {
//           margin-top: 9px;

//           color: #64748b;

//           font-size: 14px;
//         }

//         /* =========================================================
//            MOBILE LOGO
//         ========================================================= */

//         .login-mobile-logo {
//           display: none;
//         }

//         /* =========================================================
//            ERROR
//         ========================================================= */

//         .login-error {
//           display: flex;
//           align-items: center;
//           gap: 10px;

//           margin-bottom: 20px;
//           padding: 12px 14px;

//           border: 1px solid #fecaca;
//           border-radius: 12px;

//           background: #fef2f2;

//           color: #dc2626;

//           font-size: 13px;
//           font-weight: 600;
//         }

//         /* =========================================================
//            INPUT
//         ========================================================= */

//         .login-input-group {
//           margin-bottom: 20px;
//         }

//         .login-input-group label {
//           display: block;

//           margin-bottom: 8px;

//           color: #334155;

//           font-size: 12px;
//           font-weight: 800;
//         }

//         .login-label-row {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//         }

//         .login-input-wrapper {
//           position: relative;

//           display: flex;
//           align-items: center;
//         }

//         .login-input-wrapper > svg {
//           position: absolute;
//           left: 15px;

//           color: #94a3b8;

//           pointer-events: none;
//         }

//         .login-input-wrapper input {
//           width: 100%;
//           height: 52px;

//           padding: 0 45px 0 45px;

//           border: 1px solid #e2e8f0;
//           border-radius: 13px;

//           outline: none;

//           background: #ffffff;
//           color: #0f172a;

//           font-size: 14px;

//           box-shadow:
//             0 2px 5px
//             rgba(15, 23, 42, 0.03);

//           transition:
//             border-color 0.2s ease,
//             box-shadow 0.2s ease,
//             transform 0.2s ease;
//         }

//         .login-input-wrapper input::placeholder {
//           color: #94a3b8;
//         }

//         .login-input-wrapper input:focus {
//           border-color: #3b82f6;

//           box-shadow:
//             0 0 0 4px
//             rgba(59, 130, 246, 0.1);

//           transform: translateY(-1px);
//         }

//         .login-role-select {
//           width: 100%;
//           height: 52px;
//           padding: 0 16px 0 45px;
//           border: 1px solid #e2e8f0;
//           border-radius: 13px;
//           outline: none;
//           background: #ffffff;
//           color: #0f172a;
//           font-size: 14px;
//           cursor: pointer;
//         }

//         .login-role-select:focus {
//           border-color: #3b82f6;
//           box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
//         }

//         /* =========================================================
//            PASSWORD TOGGLE
//         ========================================================= */

//         .password-toggle {
//           position: absolute;
//           right: 13px;

//           width: 32px;
//           height: 32px;

//           display: flex;
//           align-items: center;
//           justify-content: center;

//           border: 0;
//           border-radius: 8px;

//           background: transparent;

//           color: #94a3b8;

//           cursor: pointer;

//           transition:
//             background 0.2s ease,
//             color 0.2s ease;
//         }

//         .password-toggle:hover {
//           background: #f1f5f9;
//           color: #2563eb;
//         }

//         /* =========================================================
//            FORGOT
//         ========================================================= */

//         .forgot-password {
//           border: 0;
//           background: transparent;

//           color: #2563eb;

//           font-size: 11px;
//           font-weight: 700;

//           cursor: pointer;
//         }

//         .forgot-password:hover {
//           color: #1d4ed8;
//         }

//         /* =========================================================
//            OPTIONS
//         ========================================================= */

//         .login-options {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;

//           margin: 2px 0 22px;
//         }

//         .remember-me {
//           display: flex;
//           align-items: center;
//           gap: 8px;

//           color: #64748b;

//           font-size: 12px;

//           cursor: pointer;
//         }

//         .remember-me input {
//           width: 15px;
//           height: 15px;

//           accent-color: #2563eb;
//         }

//         .secure-login {
//           display: flex;
//           align-items: center;
//           gap: 5px;

//           color: #16a34a;

//           font-size: 11px;
//           font-weight: 700;
//         }

//         /* =========================================================
//            SUBMIT
//         ========================================================= */

//         .login-submit {
//           width: 100%;
//           height: 54px;

//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 10px;

//           border: 0;
//           border-radius: 13px;

//           background:
//             linear-gradient(
//               135deg,
//               #2563eb,
//               #1d4ed8
//             );

//           color: #ffffff;

//           font-size: 14px;
//           font-weight: 800;

//           cursor: pointer;

//           box-shadow:
//             0 12px 25px
//             rgba(37, 99, 235, 0.22);

//           transition:
//             transform 0.2s ease,
//             box-shadow 0.2s ease,
//             filter 0.2s ease;
//         }

//         .login-submit:hover:not(:disabled) {
//           transform: translateY(-2px);

//           box-shadow:
//             0 17px 32px
//             rgba(37, 99, 235, 0.3);

//           filter: brightness(1.05);
//         }

//         .login-submit:active:not(:disabled) {
//           transform: translateY(0);
//         }

//         .login-submit:disabled {
//           opacity: 0.65;
//           cursor: not-allowed;
//         }

//         /* =========================================================
//            SPINNER
//         ========================================================= */

//         .login-spinner {
//           width: 17px;
//           height: 17px;

//           border: 2px solid
//             rgba(255, 255, 255, 0.35);

//           border-top-color: #ffffff;

//           border-radius: 50%;

//           animation:
//             loginSpin 0.7s linear infinite;
//         }

//         @keyframes loginSpin {
//           to {
//             transform: rotate(360deg);
//           }
//         }

//         /* =========================================================
//            RESPONSIVE
//         ========================================================= */

//         @media (max-width: 1100px) {
//           .login-brand-panel {
//             width: 50%;
//             padding: 35px 40px;
//           }

//           .login-form-panel {
//             width: 50%;
//             padding: 35px;
//           }

//           .login-hero-content h1 {
//             font-size: 46px;
//           }
//         }

//         @media (max-width: 850px) {
//           .login-page {
//             display: block;
//             overflow-y: auto;
//           }

//           .login-brand-panel {
//             display: none;
//           }

//           .login-form-panel {
//             width: 100%;
//             min-height: 100vh;

//             padding: 30px 20px;

//             background:
//               radial-gradient(
//                 circle at top,
//                 rgba(37, 99, 235, 0.08),
//                 transparent 40%
//               ),
//               #f8fafc;
//           }

//           .login-form-container {
//             max-width: 430px;
//           }

//           .login-mobile-logo {
//             display: flex;
//             align-items: center;
//             gap: 12px;

//             margin-bottom: 42px;
//           }

//           .login-mobile-logo .login-logo {
//             width: 43px;
//             height: 43px;
//           }

//           .login-mobile-logo strong {
//             display: block;

//             color: #0f172a;

//             font-size: 14px;
//             letter-spacing: 1.5px;
//           }

//           .login-mobile-logo span {
//             display: block;

//             margin-top: 2px;

//             color: #94a3b8;

//             font-size: 8px;
//             font-weight: 800;
//             letter-spacing: 1.8px;
//           }
//         }

//         @media (max-width: 480px) {
//           .login-form-panel {
//             padding: 24px 16px;
//           }

//           .login-heading h2 {
//             font-size: 27px;
//           }

//           .login-heading p {
//             font-size: 13px;
//           }

//           .login-options {
//             align-items: flex-start;
//             flex-direction: column;
//             gap: 10px;
//           }

//           .secure-login {
//             display: none;
//           }
//         }
//       `}</style>

//       <div className="login-page">
//         {/* =====================================================
//             LEFT BRAND PANEL
//         ===================================================== */}

//         <div className="login-brand-panel">
//           <div className="login-brand">
//             <div className="login-logo">
//               <Trophy size={30} strokeWidth={2.5} />
//             </div>

//             <div>
//               <h2>CRICKET</h2>
//               <span>COMMAND CENTER</span>
//             </div>
//           </div>

//           <div className="login-hero-content">
//             <div className="login-live-badge">
//               <span className="live-dot"></span>
//               LIVE TOURNAMENT PLATFORM
//             </div>

//             <h1>
//               Manage Every
//               <br />
//               <span>Match. Every Moment.</span>
//             </h1>

//             <p>
//               A centralized command center for tournaments, teams, players,
//               matches and live cricket scoring.
//             </p>

//             <div className="login-features">
//               <div className="login-feature">
//                 <div className="login-feature-icon">
//                   <Trophy size={19} />
//                 </div>

//                 <div>
//                   <strong>Tournament Management</strong>

//                   <span>Create and manage complete tournaments</span>
//                 </div>
//               </div>

//               <div className="login-feature">
//                 <div className="login-feature-icon">
//                   <Radio size={19} />
//                 </div>

//                 <div>
//                   <strong>Live Scoreboard</strong>

//                   <span>Update matches ball by ball</span>
//                 </div>
//               </div>

//               <div className="login-feature">
//                 <div className="login-feature-icon">
//                   <Users size={19} />
//                 </div>

//                 <div>
//                   <strong>Teams & Players</strong>

//                   <span>Keep your cricket ecosystem organized</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="login-brand-footer">
//             <span>© 2026 Cricket Command Center</span>

//             <span>•</span>

//             <span>Professional Tournament Management</span>
//           </div>
//         </div>

//         {/* =====================================================
//             RIGHT FORM PANEL
//         ===================================================== */}

//         <div className="login-form-panel">
//           <div className="login-form-container">
//             {/* MOBILE LOGO */}

//             <div className="login-mobile-logo">
//               <div className="login-logo">
//                 <Trophy size={25} />
//               </div>

//               <div>
//                 <strong>CRICKET</strong>
//                 <span>COMMAND CENTER</span>
//               </div>
//             </div>

//             {/* HEADING */}

//             <div className="login-heading">
//               <div className="login-welcome">WELCOME BACK</div>

//               <h2>Sign in to Command Center</h2>

//               <p>Enter your credentials to access your dashboard.</p>
//             </div>

//             {/* ERROR */}

//             {error && (
//               <div className="login-error">
//                 <AlertCircle size={18} />
//                 <span>{error}</span>
//               </div>
//             )}

//             {/* FORM */}

//             <form onSubmit={handleLogin}>
//               {/* EMAIL */}

//               <div className="login-input-group">
//                 <label>Email Address</label>

//                 <div className="login-input-wrapper">
//                   <Mail size={18} />

//                   <input
//                     type="email"
//                     name="email"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     autoComplete="email"
//                     disabled={loading}
//                   />
//                 </div>
//               </div>

//               {/* PASSWORD */}

//               <div className="login-input-group">
//                 <div className="login-label-row">
//                   <label>Password</label>

//                   <button
//                     type="button"
//                     className="forgot-password"
//                     onClick={() =>
//                       setError("Password recovery will be connected later.")
//                     }
//                   >
//                     Forgot password?
//                   </button>
//                 </div>

//                 <div className="login-input-wrapper">
//                   <LockKeyhole size={18} />

//                   <input
//                     type={showPassword ? "text" : "password"}
//                     name="password"
//                     placeholder="Enter your password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     autoComplete="current-password"
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

//               {/* ROLE CHECK */}

//               <div className="login-input-group">
//                 <label htmlFor="login-role">Account Role</label>

//                 <div className="login-input-wrapper">
//                   <ShieldCheck size={18} />

//                   <select
//                     id="login-role"
//                     className="login-role-select"
//                     name="expectedRole"
//                     value={formData.expectedRole}
//                     onChange={handleChange}
//                     disabled={loading}
//                   >
//                     <option value="USER">User login</option>
//                     <option value="ADMIN">Admin login</option>
//                     <option value="ANY">Any account role</option>
//                     {ROLE_OPTIONS.map((role) => (
//                       <option key={role.value} value={role.value}>
//                         {role.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               {/* OPTIONS */}

//               <div className="login-options">
//                 <label className="remember-me">
//                   <input type="checkbox" />

//                   <span>Remember me</span>
//                 </label>

//                 <div className="secure-login">
//                   <ShieldCheck size={15} />
//                   Secure Login
//                 </div>
//               </div>

//               {/* BUTTON */}

//               <button type="submit" className="login-submit" disabled={loading}>
//                 {loading ? (
//                   <>
//                     <span className="login-spinner"></span>
//                     Signing in...
//                   </>
//                 ) : (
//                   <>
//                     Sign In
//                     <ArrowRight size={19} />
//                   </>
//                 )}
//               </button>
//             </form>

//             {/* SIGNUP */}

//             <div
//               style={{
//                 marginTop: "25px",
//                 textAlign: "center",
//                 color: "#64748b",
//                 fontSize: "13px",
//               }}
//             >
//               Don't have an account?{" "}
//               <button
//                 type="button"
//                 onClick={() => navigate("/signup")}
//                 style={{
//                   border: "none",
//                   background: "transparent",
//                   color: "#2563eb",
//                   fontWeight: 700,
//                   cursor: "pointer",
//                   padding: 0,
//                 }}
//               >
//                 Create Account
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Login;
