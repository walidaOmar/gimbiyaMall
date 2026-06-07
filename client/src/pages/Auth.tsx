/**
 * Auth.tsx — Gimbiya Mall Authentication Page
 *
 * Tabs: Sign In (buyer/affiliate) | Sign Up (new buyer) | Staff Portal
 *
 * FIXES applied:
 * 1. getRoleRedirect() now covers ALL 7 roles including stock_manager and buyer
 * 2. Staff card "Stock Manager" now uses correct email: stock@sahadstores.com
 * 3. loginStaff staffRoles array now includes "stock_manager"
 * 4. After login, calls refetchUser() so AuthContext fetches the real user
 *    object from the server instead of storing the raw mutation response
 * 5. Logout properly calls server mutation to clear httpOnly cookie
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ShoppingBag, Mail, Lock, User, Phone,
  Eye, EyeOff, CheckCircle2, Shield, Truck,
  Settings, Code2, AlertCircle, ArrowLeft, Zap, Package,
} from "lucide-react";

type AuthMode = "login" | "signup";

// ── Role → Dashboard path ─────────────────────────────────────────────────────
function getRoleRedirect(role: string): string {
  const map: Record<string, string> = {
    admin:         "/admin",
    manager:       "/manager",
    stock_manager: "/stock-manager",
    delivery:      "/delivery",
    reader:        "/affiliate",
    developer:     "/developer",
    buyer:         "/buyer",
  };
  return map[role] ?? "/mall";
}


// ── Shared input styles ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px 12px 42px",
  borderRadius: 10,
  fontSize: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  color: "#fff",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  color: "rgba(255,255,255,0.55)",
  fontSize: 13,
  fontWeight: 500,
  display: "block",
  marginBottom: 6,
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Auth() {
  const { user, loading, setUser, demoLogin } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const urlMode = new URLSearchParams(search).get("mode");

  const [mode, setMode] = useState<AuthMode>(urlMode === "signup" ? "signup" : "login");

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate(getRoleRedirect(user.role));
    }
  }, [user, loading]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPw, setLoginPw]             = useState("");
  const [showLoginPw, setShowLoginPw]     = useState(false);

  const [signupName, setSignupName]       = useState("");
  const [signupEmail, setSignupEmail]     = useState("");
  const [signupPhone, setSignupPhone]     = useState("");
  const [signupPw, setSignupPw]           = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPw, setShowSignupPw]   = useState(false);

  const isDevDemoMode = import.meta.env.DEV ||
    (typeof window !== "undefined" && window.location.hostname.includes("localhost"));

  const demoUsers = {
    admin: {
      _id: "demo-admin",
      name: "Demo Admin",
      email: "admin@sahadstores.com",
      role: "admin",
      phone: "+2340000000000",
      isAffiliate: false,
      isActive: true,
    },
    manager: {
      _id: "demo-manager",
      name: "Demo Manager",
      email: "manager@sahadstores.com",
      role: "manager",
      phone: "+2340000000001",
      isAffiliate: false,
      isActive: true,
    },
  } as const;

  const handleDemoSignIn = (role: keyof typeof demoUsers) => {
    const demoUser = demoUsers[role];
    demoLogin(demoUser as any);
    toast.success(`Demo ${role === "admin" ? "Admin" : "Manager"} active.`);
    navigate(getRoleRedirect(demoUser.role));
  };

  // ── tRPC mutations ──────────────────────────────────────────────────────────

  /**
   * BUYER LOGIN
   * After success: server sets gimbiya_session cookie.
   * We call setUser() which in the new AuthContext triggers a refetch of auth.me,
   * giving us the complete user object from MongoDB.
   */
  const firebaseLogin = trpc.auth.firebaseLogin.useMutation({
    onSuccess: (d) => {
      toast.success("Signed in with Firebase.");
      setUser(null); // triggers auth.me refetch in fixed AuthContext
      setTimeout(() => navigate(getRoleRedirect(d.role)), 600);
    },
    onError: (e) => toast.error(e.message || "Firebase login failed"),
  });

  const loginUnified = trpc.auth.loginUnified.useMutation({
    onSuccess: (d) => {
      toast.success("Signed in successfully.");
      setUser(null);
      setTimeout(() => navigate(getRoleRedirect(d.role)), 500);
    },
    onError: (e) => toast.error(e.message || "Login failed"),
  });

  const signupBuyer = trpc.auth.signupBuyer.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully.");
      setUser(null);
      setTimeout(() => navigate(getRoleRedirect("buyer")), 600);
    },
    onError: (e) => toast.error(e.message || "Signup failed"),
  });


  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPw) return toast.error("Please fill all fields");
    try {
      loginUnified.mutate({
        email: loginEmail.trim().toLowerCase(),
        password: loginPw,
      });
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPw || !signupConfirm) {
      return toast.error("Fill all required fields");
    }
    if (signupPw !== signupConfirm) return toast.error("Passwords don't match");
    try {
      await signupBuyer.mutateAsync({
        name: signupName.trim(),
        email: signupEmail.trim().toLowerCase(),
        phone: signupPhone.trim() || undefined,
        password: signupPw,
        confirmPassword: signupConfirm,
      });
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    }
  };


  const pwMatch    = signupConfirm.length > 0 && signupConfirm === signupPw;
  const pwMismatch = signupConfirm.length > 0 && signupConfirm !== signupPw;
  const isPending  = loginUnified.isPending || firebaseLogin.isPending || signupBuyer.isPending;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg,#0b1628 0%,#132040 100%)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              fontSize: 13,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <ArrowLeft size={15} /> Home
          </a>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                background: "linear-gradient(135deg,#e8a020,#f5c842)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={14} color="#0b1628" />
            </div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              Gimbiya Mall
            </span>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {mode === "login" && (
            <>
              No account?{" "}
              <button
                onClick={() => setMode("signup")}
                style={{
                  color: "#e8a020",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign up free
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Have an account?{" "}
              <button
                onClick={() => setMode("login")}
                style={{
                  color: "#e8a020",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Tab switcher */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 4,
                display: "flex",
                gap: 2,
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {( ["login", "signup"] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "9px 22px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: "none",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    background: mode === m ? "linear-gradient(135deg,#e8a020,#f5c842)" : "transparent",
                    color: mode === m ? "#0b1628" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          </div>

          {/* ── SIGN IN ─────────────────────────────────────────────────────── */}
          {mode === "login" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Welcome back
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
                  Sign in to your Gimbiya Mall account
                </p>
              </div>

              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div>
                  <label style={lbl}>Email address</label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      style={inp}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type={showLoginPw ? "text" : "password"}
                      value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                      placeholder="Your password"
                      required
                      style={{ ...inp, paddingRight: 44 }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      style={{
                        position: "absolute",
                        right: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    background: "linear-gradient(135deg,#e8a020,#f5c842)",
                    color: "#0b1628",
                    border: "none",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.7 : 1,
                    marginTop: 4,
                    fontFamily: "inherit",
                    boxShadow: "0 4px 20px rgba(232,160,32,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {firebaseLogin.isPending ? "Signing in…" : "Sign In"}
                </button>
              </form>

              {isDevDemoMode && (
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                    Demo mode: sign in locally without a live MongoDB backend.
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleDemoSignIn("admin")}
                      style={{
                        padding: "11px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Demo Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoSignIn("manager")}
                      style={{
                        padding: "11px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Demo Manager
                    </button>
                  </div>
                </div>
              )}

              <p
                style={{
                  textAlign: "center",
                  marginTop: 24,
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 13,
                }}
              >
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  style={{
                    color: "#e8a020",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Create one free
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP ─────────────────────────────────────────────────────── */}
          {mode === "signup" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h1
                  style={{
                    color: "#fff",
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Create your account
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>
                  Join Gimbiya Mall and start shopping today
                </p>
              </div>

              <form
                onSubmit={handleSignup}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Name */}
                <div>
                  <label style={lbl}>
                    Full name <span style={{ color: "#e8a020" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Aisha Muhammad"
                      required
                      autoFocus
                      style={inp}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={lbl}>
                    Email address <span style={{ color: "#e8a020" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={inp}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label style={lbl}>
                    Phone{" "}
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                      (optional)
                    </span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Phone
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      style={inp}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={lbl}>
                    Password <span style={{ color: "#e8a020" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type={showSignupPw ? "text" : "password"}
                      value={signupPw}
                      onChange={(e) => setSignupPw(e.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      required
                      style={{ ...inp, paddingRight: 44 }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(232,160,32,0.6)")}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPw(!showSignupPw)}
                      style={{
                        position: "absolute",
                        right: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {showSignupPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>
                    At least 8 characters, 1 uppercase letter, 1 number
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={lbl}>
                    Confirm password <span style={{ color: "#e8a020" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock
                      size={15}
                      style={{
                        position: "absolute",
                        left: 13,
                        top: 13,
                        color: "rgba(255,255,255,0.3)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      style={{
                        ...inp,
                        paddingRight: 44,
                        borderColor: pwMismatch
                          ? "rgba(239,68,68,0.5)"
                          : pwMatch
                          ? "rgba(16,185,129,0.5)"
                          : "rgba(255,255,255,0.1)",
                      }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = pwMismatch
                          ? "rgba(239,68,68,0.5)"
                          : "rgba(232,160,32,0.6)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = pwMismatch
                          ? "rgba(239,68,68,0.5)"
                          : pwMatch
                          ? "rgba(16,185,129,0.5)"
                          : "rgba(255,255,255,0.1)")
                      }
                    />
                    {pwMatch && (
                      <CheckCircle2
                        size={16}
                        style={{ position: "absolute", right: 13, top: 13, color: "#10b981" }}
                      />
                    )}
                  </div>
                  {pwMismatch && (
                    <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>
                      Passwords don&apos;t match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending || !!pwMismatch}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 700,
                    background: "linear-gradient(135deg,#e8a020,#f5c842)",
                    color: "#0b1628",
                    border: "none",
                    cursor: isPending || !!pwMismatch ? "not-allowed" : "pointer",
                    opacity: isPending || !!pwMismatch ? 0.65 : 1,
                    marginTop: 4,
                    fontFamily: "inherit",
                    boxShadow: "0 4px 20px rgba(232,160,32,0.35)",
                    transition: "all 0.2s",
                  }}
                >
                  {firebaseLogin.isPending ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 13,
                }}
              >
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  style={{
                    color: "#e8a020",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* Staff portal removed — unified Sign-In/Sign-Up only */}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 24px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
          © 2026 Gimbiya Mall · Secure authentication
        </p>
      </div>
    </div>
  );
}
