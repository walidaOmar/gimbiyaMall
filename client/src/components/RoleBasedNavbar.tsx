/**
 * RoleBasedNavbar.tsx
 *
 * Shows only when a user is logged in.
 * Displays the user's role badge, name, and a dropdown with navigation.
 *
 * FIX: Logout now calls the server's auth.logout mutation to clear the
 * httpOnly cookie on the server before redirecting. The old version only
 * cleared localStorage which didn't clear the cookie.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { firebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  ShoppingBag, Shield, Settings, Truck, Code2,
  Package, TrendingUp, LogOut, Home, ChevronDown, BarChart2,
} from "lucide-react";
import { ReactNode, useState } from "react";

const ROLE_CONFIG: Record<
  string,
  { icon: ReactNode; color: string; label: string; dashPath: string }
> = {
  admin:         { icon: <Shield className="w-5 h-5" />,      color: "#ef4444", label: "Admin",         dashPath: "/admin"         },
  manager:       { icon: <Settings className="w-5 h-5" />,    color: "#3b82f6", label: "Manager",       dashPath: "/manager"       },
  stock_manager: { icon: <Package className="w-5 h-5" />,     color: "#10b981", label: "Stock Manager", dashPath: "/stock-manager" },
  delivery:      { icon: <Truck className="w-5 h-5" />,       color: "#f59e0b", label: "Delivery",      dashPath: "/delivery"      },
  reader:        { icon: <TrendingUp className="w-5 h-5" />,  color: "#a855f7", label: "Affiliate",     dashPath: "/affiliate"     },
  developer:     { icon: <Code2 className="w-5 h-5" />,       color: "#4f46e5", label: "Developer",     dashPath: "/developer"     },
  buyer:         { icon: <ShoppingBag className="w-5 h-5" />, color: "#0891b2", label: "Buyer",         dashPath: "/buyer"         },
};

export default function RoleBasedNavbar() {
  const { user, clearUser } = useAuth();
  const [, navigate]        = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Server-side logout — clears the httpOnly cookie and signs out of Firebase too.
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      try {
        await signOut(firebaseAuth);
      } catch {
        // ignore firebase logout failures
      }
      clearUser();
      navigate("/");
    },
    onError: async () => {
      try {
        await signOut(firebaseAuth);
      } catch {
        // ignore firebase logout failures
      }
      clearUser();
      navigate("/");
    },
  });

  // Don't render navbar if not logged in
  if (!user) return null;

  const roleConfig =
    ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.buyer;

  const handleLogout = () => {
    setDropdownOpen(false);
    logoutMutation.mutate();
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: 64,
        background: "rgba(15, 23, 42, 0.98)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 24,
        paddingRight: 24,
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Logo / Home link */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <Home className="w-6 h-6" style={{ color: "#e8a020" }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
          🏬 Gimbiya Mall
        </span>
      </div>

      {/* Right side: Mall + role badge + user menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Mall Button */}
        <button
          onClick={() => navigate("/mall")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
          }}
        >
          🛍️ Mall
        </button>

        {/* Role Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 14px",
            borderRadius: 8,
            background: `${roleConfig.color}15`,
            border: `1.5px solid ${roleConfig.color}40`,
          }}
        >
          <span style={{ color: roleConfig.color }}>{roleConfig.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            {roleConfig.label}
          </span>
        </div>

        {/* User dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: dropdownOpen
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: `${roleConfig.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span>{user.name?.split(" ")[0] ?? "User"}</span>
            <ChevronDown
              className="w-4 h-4"
              style={{
                transition: "transform 0.2s",
                transform: dropdownOpen ? "rotate(180deg)" : "",
              }}
            />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "rgba(15, 23, 42, 0.98)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 10,
                backdropFilter: "blur(8px)",
                minWidth: 210,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                overflow: "hidden",
              }}
            >
              {/* User info header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  Signed in as
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    margin: "2px 0 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </p>
              </div>

              {/* Dashboard link */}
              <DropdownBtn
                icon={<BarChart2 size={15} />}
                label="My Dashboard"
                onClick={() => {
                  navigate(roleConfig.dashPath);
                  setDropdownOpen(false);
                }}
              />

              {/* Profile settings */}
              <DropdownBtn
                icon={<Settings size={15} />}
                label="Profile Settings"
                onClick={() => {
                  navigate("/profile");
                  setDropdownOpen(false);
                }}
              />

              {/* Home link */}
              <DropdownBtn
                icon={<Home size={15} />}
                label="Home"
                onClick={() => {
                  navigate("/");
                  setDropdownOpen(false);
                }}
              />

              {/* Logout */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: logoutMutation.isPending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background 0.15s",
                    fontFamily: "inherit",
                    opacity: logoutMutation.isPending ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogOut className="w-4 h-4" />
                  {logoutMutation.isPending ? "Logging out…" : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Small helper component for dropdown items ─────────────────────────────────
function DropdownBtn({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px 16px",
        border: "none",
        background: "transparent",
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
        transition: "background 0.15s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      <span style={{ color: "rgba(255,255,255,0.4)" }}>{icon}</span>
      {label}
    </button>
  );
}
