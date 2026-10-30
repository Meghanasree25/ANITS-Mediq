
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import "../Auth.css";

type Role = "patient" | "nurse" | "doctor" | "admin";

// All roles supported by the MEDIQ website
const validRoles: Role[] = [
  "patient",
  "nurse",
  "doctor",
  "admin",
];

// Detect whether MEDIQ is running as a native Android app
const isAndroidApp =
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === "android";

// Only patients can select a role in MEDIQ Care
const availableRoles: Role[] = isAndroidApp
  ? ["patient"]
  : validRoles;

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate using Supabase
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (!data.user) {
        setError("Unable to verify your account.");
        return;
      }

      // Fetch the user's actual role from the database
      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setError(
          "Your account profile could not be verified. Please contact the administrator."
        );
        return;
      }

      const actualRole = profile.role as string;

      // Validate the role
      if (!validRoles.includes(actualRole as Role)) {
        await supabase.auth.signOut();

        setError("Your account has an invalid role.");
        return;
      }

      // Block staff accounts from MEDIQ Care Android
      if (isAndroidApp && actualRole !== "patient") {
        await supabase.auth.signOut();

        setError(
          "MEDIQ Care is exclusively for patients. Staff members must use the MEDIQ hospital website."
        );
        return;
      }

      // Verify that the selected role matches the database role
      if (actualRole !== role) {
        await supabase.auth.signOut();

        setError(
          `This account is registered as ${actualRole}. Please select the correct role.`
        );
        return;
      }

      // Redirect to the verified user's dashboard
      navigate(`/${actualRole}`, { replace: true });

    } catch (err) {
      console.error("MEDIQ login error:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">
            <Activity size={23} />
          </span>
          MEDIQ<span className="auth-logo-dot">.</span>
        </Link>

        <div className="auth-form-area">
          <Link to="/" className="auth-back">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="auth-heading">
            <span className="auth-kicker">
              WELCOME BACK
            </span>

            <h1>
              Sign in to <span>MEDIQ.</span>
            </h1>

            <p>
              {isAndroidApp
                ? "Access your personal healthcare dashboard."
                : "Access your healthcare workspace."}
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="auth-form"
          >
            {!isAndroidApp && (
              <>
                <label className="auth-label">
                  Continue as
                </label>

                <div className="auth-role-grid">
                  {availableRoles.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`auth-role ${
                        role === item ? "selected" : ""
                      }`}
                      onClick={() => setRole(item)}
                      disabled={loading}
                    >
                      {item.charAt(0).toUpperCase() +
                        item.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {isAndroidApp && (
              <div className="auth-note">
                <HeartPulse size={16} />
                <span>
                  Patient Login — MEDIQ Care
                </span>
              </div>
            )}

            <label
              className="auth-label"
              htmlFor="login-email"
            >
              Email address
            </label>

            <div className="auth-input-wrap">
              <Mail size={18} />

              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <label
              className="auth-label"
              htmlFor="login-password"
            >
              Password
            </label>

            <div className="auth-input-wrap">
              <LockKeyhole size={18} />

              <input
                id="login-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="auth-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="auth-note">
              <ShieldCheck size={16} />
              <span>
                Secure sign-in powered by Supabase
                Authentication.
              </span>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : isAndroidApp
                ? "Sign In to MEDIQ Care"
                : "Sign In to Dashboard"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <p className="auth-switch">
            New patient?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-showcase">
        <div className="auth-showcase-top">
          <span className="auth-showcase-pill">
            <HeartPulse size={16} />
            SMART HEALTHCARE
          </span>
        </div>

        <div className="auth-showcase-content">
          <div className="auth-showcase-icon">
            <HeartPulse
              size={45}
              strokeWidth={1.6}
            />
          </div>

          <h2>
            Care that flows.
            <br />
            Technology that helps.
          </h2>

          <p>
            {isAndroidApp
              ? "Your personal healthcare companion for registration, OPD visits and queue updates."
              : "One connected workspace for patients, nurses, doctors and hospital administrators."}
          </p>

          <div className="auth-showcase-stats">
            <div>
              <strong>01</strong>
              <span>Register</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Review</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Consult</span>
            </div>
          </div>
        </div>

        <p className="auth-showcase-footer">
          {isAndroidApp
            ? "MEDIQ Care · Patient Companion"
            : "MEDIQ · Smart OPD & Queue Management"}
        </p>
      </div>
    </div>
  );
}
