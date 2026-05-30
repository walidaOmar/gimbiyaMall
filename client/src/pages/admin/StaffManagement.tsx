import { useState, useCallback, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Users, UserSearch, UserPlus, ShieldCheck,
  Search, Plus, Eye, Trash2, RefreshCw,
  CheckCircle2, UserMinus, Star, AlertCircle,
} from "lucide-react";

const C = {
  bg: "#07101f",
  sidebar: "#0b1724",
  card: "#0f1e30",
  card2: "#0d1929",
  border: "#19283d",
  border2: "#243650",
  amber: "#f59e0b",
  amberS: "rgba(245,158,11,.10)",
  amberB: "rgba(245,158,11,.18)",
  text: "#e2e8f0",
  muted: "#7a90a8",
  dim: "#3d526a",
  green: "#10b981",
  greenS: "rgba(16,185,129,.12)",
  red: "#ef4444",
  redS: "rgba(239,68,68,.12)",
  blue: "#3b82f6",
  blueS: "rgba(59,130,246,.12)",
  purple: "#a78bfa",
  purpleS: "rgba(167,139,250,.12)",
};

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  manager: { label: "Manager", bg: "rgba(167,139,250,.14)", color: C.purple },
  stock_manager: { label: "Stock Manager", bg: "rgba(245,158,11,.14)", color: C.amber },
  delivery: { label: "Delivery", bg: "rgba(59,130,246,.14)", color: C.blue },
  reader: { label: "Affiliate", bg: "rgba(16,185,129,.14)", color: C.green },
  buyer: { label: "Buyer", bg: C.border, color: C.muted },
  admin: { label: "Admin", bg: "rgba(245,158,11,.14)", color: C.amber },
  developer: { label: "Developer", bg: "rgba(239,68,68,.12)", color: C.red },
};

const STAFF_ROLES = ["manager", "stock_manager", "delivery"];
const MUTABLE_ROLES = ["stock_manager", "delivery"];

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(name = "") {
  const palette = [C.blue, C.green, C.purple, C.amber, C.red, "#ec4899"];
  return palette[name.charCodeAt(0) % palette.length];
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const color = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}22`, color, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size < 40 ? 12 : 14, fontWeight: 700,
    }}>
      {initials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.buyer;
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 20, fontSize: 10,
      fontWeight: 700, background: m.bg, color: m.color,
      display: "inline-block", whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
}

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 38, height: 20, borderRadius: 10, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: value ? C.green : C.border,
        position: "relative", transition: "background .2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={value}
    >
      <span style={{
        position: "absolute", top: 2, left: value ? 20 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left .2s",
      }} />
    </button>
  );
}

function Field({ label, children, style = {} }: { label: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={{ display: "block", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder = "", type = "text", focus }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string; focus?: React.RefObject<HTMLInputElement> }) {
  const [foc, setFoc] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFoc(true)}
      onBlur={() => setFoc(false)}
      ref={focus}
      style={{
        width: "100%", padding: "9px 12px",
        background: C.bg, border: `1px solid ${foc ? C.amber : C.border}`,
        borderRadius: 7, color: C.text, fontSize: 13, outline: "none",
        boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s",
      }}
    />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "9px 12px",
        background: C.card2, border: `1px solid ${C.border}`,
        borderRadius: 7, color: C.text, fontSize: 12, outline: "none",
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {children}
    </select>
  );
}

function Card({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, marginBottom: 14, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon?: typeof Users; children: ReactNode }) {
  return (
    <h3 style={{
      fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 14px",
      paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", gap: 7,
    }}>
      {Icon && <Icon size={14} color={C.amber} />} {children}
    </h3>
  );
}

function Btn({ children, onClick, variant = "default", size = "sm", style = {}, disabled = false, loading = false, title }: { children: ReactNode; onClick?: () => void; variant?: "default" | "primary" | "success" | "danger" | "ghost"; size?: "sm" | "md" | "xs"; style?: React.CSSProperties; disabled?: boolean; loading?: boolean; title?: string }) {
  const [hov, setHov] = useState(false);
  const variants = {
    default: { bg: "transparent", border: C.border, color: C.muted, hovBg: C.card2, hovBorder: C.amber, hovColor: C.amber },
    primary: { bg: C.amber, border: C.amber, color: "#000", hovBg: "#d97706", hovBorder: "#d97706", hovColor: "#000" },
    success: { bg: C.green, border: C.green, color: "#fff", hovBg: "#059669", hovBorder: "#059669", hovColor: "#fff" },
    danger: { bg: "transparent", border: "rgba(239,68,68,.3)", color: C.red, hovBg: C.redS, hovBorder: C.red, hovColor: C.red },
    ghost: { bg: "transparent", border: "rgba(16,185,129,.3)", color: C.green, hovBg: C.greenS, hovBorder: C.green, hovColor: C.green },
  } as const;
  const v = variants[variant];
  const pad = size === "sm" ? "5px 10px" : size === "xs" ? "3px 8px" : "9px 18px";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, border: `1px solid ${hov ? v.hovBorder : v.border}`,
        borderRadius: 7, background: hov ? v.hovBg : v.bg,
        color: hov ? v.hovColor : v.color, fontSize: 11, fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "inherit", opacity: disabled ? 0.5 : 1,
        transition: "all .15s", whiteSpace: "nowrap", ...style,
      }}
    >
      {loading ? <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> : children}
    </button>
  );
}

function InfoBox({ children, variant = "info" }: { children: ReactNode; variant?: "info" | "warning" }) {
  const colors = {
    info: { bg: C.amberS, border: "rgba(245,158,11,.25)", color: C.amber, Icon: AlertCircle },
    warning: { bg: C.redS, border: "rgba(239,68,68,.25)", color: C.red, Icon: AlertCircle },
  } as const;
  const { bg, border, color, Icon } = colors[variant];
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 8,
      padding: "12px 14px", marginBottom: 14, fontSize: 12, color,
      display: "flex", alignItems: "flex-start", gap: 8,
    }}>
      <Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}

function StatStrip({ items }: { items: Array<{ label: string; value: number; color?: string | null }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10, marginBottom: 18 }}>
      {items.map((s) => (
        <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 15px" }}>
          <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 4px" }}>{s.label}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: s.color ?? C.text, margin: 0 }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ msg = "No results found." }: { msg?: string }) {
  return <p style={{ textAlign: "center", color: C.muted, padding: "32px 16px", fontSize: 13, margin: 0 }}>{msg}</p>;
}

function StaffTab({ onAddStaff }: { onAddStaff: () => void }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const utils = trpc.useUtils();

  const { data: staff = [], isLoading } = trpc.admin.listStaff.useQuery({ role: "" });
  const { data: searchResults = [] } = trpc.admin.globalSearch.useQuery(
    { query: search, roles: STAFF_ROLES, limit: 50 },
    { enabled: search.length > 0 }
  );

  const updateRoleMut = trpc.admin.updateUserRole.useMutation();
  const toggleActiveMut = trpc.admin.toggleUserActive.useMutation();
  const removeStaffMut = trpc.admin.removeStoreStaff.useMutation();

  const displayed = (search.length > 0 ? searchResults : staff).filter(
    (s: any) => roleFilter === "all" || s.role === roleFilter
  );

  const handleRoleChange = useCallback(async (userId: string, role: string, userName: string) => {
    try {
      await updateRoleMut.mutateAsync({ userId, role });
      utils.admin.listStaff.invalidate();
      toast.success(`${userName} → ${ROLE_META[role]?.label ?? role}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update role");
    }
  }, [updateRoleMut, utils]);

  const handleToggleActive = useCallback(async (userId: string, isActive: boolean, userName: string) => {
    try {
      await toggleActiveMut.mutateAsync({ userId, isActive });
      utils.admin.listStaff.invalidate();
      toast.success(isActive ? `${userName} re-activated` : `${userName} deactivated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update status");
    }
  }, [toggleActiveMut, utils]);

  const handleRemove = useCallback(async (userId: string, userName: string) => {
    if (!window.confirm(`Remove ${userName} from store staff? They'll be demoted to buyer.`)) return;
    try {
      await removeStaffMut.mutateAsync({ userId });
      utils.admin.listStaff.invalidate();
      toast.success(`${userName} removed from store staff`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove staff");
    }
  }, [removeStaffMut, utils]);

  const statsItems = [
    { label: "Total Staff", value: staff.length, color: null },
    { label: "Active", value: staff.filter((s: any) => s.isActive).length, color: C.green },
    { label: "Managers", value: staff.filter((s: any) => s.role === "manager").length, color: C.purple },
    { label: "Stock Managers", value: staff.filter((s: any) => s.role === "stock_manager").length, color: C.amber },
  ];

  const filterPills = [
    { v: "all", l: "All Staff" },
    { v: "manager", l: "Managers" },
    { v: "stock_manager", l: "Stock Managers" },
    { v: "delivery", l: "Delivery" },
  ];

  const colTemplate = "2.4fr 1.4fr 1.2fr 1fr 110px";

  return (
    <div>
      <StatStrip items={statsItems} />

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or User ID…"
            style={{ width: "100%", padding: "9px 12px 9px 32px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        <Btn variant="primary" onClick={onAddStaff} size="md">
          <Plus size={13} /> Add Staff
        </Btn>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {filterPills.map(({ v, l }) => (
          <button
            key={v}
            type="button"
            onClick={() => setRoleFilter(v)}
            style={{
              padding: "5px 13px", borderRadius: 20, border: `1px solid ${roleFilter === v ? C.amber : C.border}`,
              background: roleFilter === v ? C.amberS : "transparent",
              color: roleFilter === v ? C.amber : C.muted,
              fontSize: 11, fontWeight: roleFilter === v ? 700 : 400,
              cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, gap: 10, padding: "11px 16px", borderBottom: `1px solid ${C.border}` }}>
          {['Member', 'User ID', 'Role', 'Status', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <EmptyRow msg="Loading staff…" />
        ) : displayed.length === 0 ? (
          <EmptyRow msg="No staff members found." />
        ) : displayed.map((s: any, i: number) => (
          <StaffRow
            key={s._id}
            user={s}
            last={i === displayed.length - 1}
            colTemplate={colTemplate}
            onRoleChange={handleRoleChange}
            onToggleActive={handleToggleActive}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}

function StaffRow({ user, last, colTemplate, onRoleChange, onToggleActive, onRemove }: { user: any; last: boolean; colTemplate: string; onRoleChange: (userId: string, role: string, name: string) => void; onToggleActive: (userId: string, isActive: boolean, name: string) => void; onRemove: (userId: string, name: string) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: colTemplate, gap: 10,
        padding: "13px 16px", alignItems: "center",
        borderBottom: last ? "none" : `1px solid ${C.border}`,
        background: hov ? "rgba(255,255,255,.018)" : "transparent", transition: "background .1s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={user.name} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{user.name}</p>
          <p style={{ fontSize: 10, color: C.dim, margin: "2px 0 0" }}>{user.email}</p>
        </div>
      </div>

      <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{user._id.slice(-12).toUpperCase()}</span>

      <div>
        {MUTABLE_ROLES.includes(user.role) ? (
          <select
            value={user.role}
            onChange={(e) => onRoleChange(user._id, e.target.value, user.name)}
            style={{
              background: C.card2, border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.text, fontSize: 11,
              padding: "5px 8px", outline: "none", cursor: "pointer", fontFamily: "inherit",
              width: "100%",
            }}
          >
            <option value="stock_manager">Stock Manager</option>
            <option value="delivery">Delivery Staff</option>
          </select>
        ) : (
          <RoleBadge role={user.role} />
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Toggle value={user.isActive} onChange={(v) => onToggleActive(user._id, v, user.name)} disabled={user.role === "admin"} />
        <span style={{ fontSize: 11, color: user.isActive ? C.green : C.muted }}>
          {user.isActive ? "Active" : "Off"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 5 }}>
        <Btn size="xs" title="View profile">
          <Eye size={11} />
        </Btn>
        {!["admin", "developer"].includes(user.role) && (
          <Btn size="xs" variant="danger" onClick={() => onRemove(user._id, user.name)} title="Remove from store">
            <Trash2 size={11} />
          </Btn>
        )}
      </div>
    </div>
  );
}

function BuyersTab() {
  const [search, setSearch] = useState("");
  const [affiliateFilter, setAffilFilter] = useState("all");
  const utils = trpc.useUtils();

  const { data: searchResults = [], isFetching } = trpc.admin.globalSearch.useQuery(
    { query: search || "a", roles: ["buyer", "reader"], limit: 80 }
  );

  const toggleActiveMut = trpc.admin.toggleUserActive.useMutation();
  const enableAffiliateMut = trpc.admin.enableAffiliate.useMutation();

  const displayed = searchResults.filter((u: any) => {
    const matchQ = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u._id.includes(search);
    const matchAff = affiliateFilter === "all" ? true : affiliateFilter === "affiliate" ? u.isAffiliate : affiliateFilter === "non-affiliate" ? !u.isAffiliate : true;
    return matchQ && matchAff;
  });

  const statsItems = [
    { label: "Total Buyers", value: searchResults.length, color: null },
    { label: "Affiliates", value: searchResults.filter((u: any) => u.isAffiliate).length, color: C.green },
    { label: "Non-Affiliate", value: searchResults.filter((u: any) => !u.isAffiliate).length, color: null },
    { label: "Active", value: searchResults.filter((u: any) => u.isActive).length, color: C.blue },
  ];

  const handleToggleAffiliate = useCallback(async (userId: string, enable: boolean, userName: string) => {
    try {
      await enableAffiliateMut.mutateAsync({ userId, enable });
      utils.admin.globalSearch.invalidate();
      toast.success(enable ? `${userName} is now an Affiliate` : `Affiliate status revoked for ${userName}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }, [enableAffiliateMut, utils]);

  const handleToggleActive = useCallback(async (userId: string, isActive: boolean, userName: string) => {
    try {
      await toggleActiveMut.mutateAsync({ userId, isActive });
      utils.admin.globalSearch.invalidate();
      toast.success(isActive ? `${userName} re-activated` : `${userName} deactivated`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }, [toggleActiveMut, utils]);

  const colTemplate = "2.4fr 1.5fr 1fr 1.1fr 1.1fr 130px";

  return (
    <div>
      <StatStrip items={statsItems} />

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Global search — name, email, or User ID…"
            style={{ width: "100%", padding: "9px 12px 9px 32px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        <select
          value={affiliateFilter}
          onChange={(e) => setAffilFilter(e.target.value)}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 12, padding: "9px 12px", outline: "none", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="all">All Buyers</option>
          <option value="affiliate">Affiliates Only</option>
          <option value="non-affiliate">Non-Affiliates</option>
        </select>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, gap: 10, padding: "11px 16px", borderBottom: `1px solid ${C.border}` }}>
          {['Buyer', 'User ID', 'Joined', 'Account', 'Affiliate', 'Actions'].map((h) => (
            <span key={h} style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</span>
          ))}
        </div>

        {isFetching && !searchResults.length ? (
          <EmptyRow msg="Loading buyers…" />
        ) : displayed.length === 0 ? (
          <EmptyRow msg="No buyers found." />
        ) : displayed.map((u: any, i: number) => (
          <BuyerRow
            key={u._id}
            user={u}
            last={i === displayed.length - 1}
            colTemplate={colTemplate}
            onToggleAffiliate={handleToggleAffiliate}
            onToggleActive={handleToggleActive}
          />
        ))}
      </div>
    </div>
  );
}

function BuyerRow({ user, last, colTemplate, onToggleAffiliate, onToggleActive }: { user: any; last: boolean; colTemplate: string; onToggleAffiliate: (userId: string, enable: boolean, name: string) => void; onToggleActive: (userId: string, isActive: boolean, name: string) => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: colTemplate, gap: 10,
        padding: "13px 16px", alignItems: "center",
        borderBottom: last ? "none" : `1px solid ${C.border}`,
        background: hov ? "rgba(255,255,255,.018)" : "transparent", transition: "background .1s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={user.name} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{user.name}</p>
          <p style={{ fontSize: 10, color: C.dim, margin: "2px 0 0" }}>{user.email}</p>
        </div>
      </div>

      <span style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>{user._id.slice(-12).toUpperCase()}</span>
      <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(user.createdAt)}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Toggle value={user.isActive} onChange={(v) => onToggleActive(user._id, v, user.name)} />
        <span style={{ fontSize: 11, color: user.isActive ? C.green : C.muted }}>
          {user.isActive ? "Active" : "Off"}
        </span>
      </div>

      <div>
        {user.isAffiliate ? (
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.greenS, color: C.green, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Star size={9} /> Affiliate
          </span>
        ) : (
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.border, color: C.muted }}>
            Standard
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 5 }}>
        {user.isAffiliate ? (
          <Btn size="xs" variant="danger" onClick={() => onToggleAffiliate(user._id, false, user.name)}>
            <UserMinus size={11} /> Revoke
          </Btn>
        ) : (
          <Btn size="xs" variant="ghost" onClick={() => onToggleAffiliate(user._id, true, user.name)}>
            <Star size={11} /> Affiliate
          </Btn>
        )}
      </div>
    </div>
  );
}

function OnboardTab({ onSuccess }: { onSuccess?: () => void }) {
  const [lookupId, setLookupId] = useState("");
  const [lookupRole, setLookupRole] = useState("stock_manager");
  const [lookupResult, setLookupResult] = useState<any | "not_found" | null>(null);
  const [lookupErr, setLookupErr] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"stock_manager" | "delivery">("stock_manager");
  const utils = trpc.useUtils();
  const lookupQuery = trpc.admin.lookupUserById.useQuery({ userId: lookupId.trim() }, { enabled: false });
  const onboardMut = trpc.admin.onboardExistingUser.useMutation();
  const createStaffMut = trpc.admin.createStoreStaff.useMutation();

  const handleLookup = async () => {
    const id = lookupId.trim();
    if (!id) { toast.error("Enter a User ID"); return; }
    setLookupErr("");
    setLookupResult(null);
    try {
      const result = await lookupQuery.refetch();
      if (!result.data) {
        setLookupResult("not_found");
        setLookupErr("User ID not found. Make sure the user is registered on Gimbiya Mall.");
      } else {
        setLookupResult(result.data);
      }
    } catch (e: any) {
      setLookupErr(e?.message ?? "Lookup failed");
    }
  };

  const handleConfirmOnboard = async () => {
    if (!lookupResult || lookupResult === "not_found") return;
    try {
      const res = await onboardMut.mutateAsync({ userId: lookupResult._id, role: lookupRole });
      toast.success(`${res.userName} onboarded as ${ROLE_META[res.newRole]?.label ?? res.newRole}`);
      setLookupId(""); setLookupResult(null); setLookupErr("");
      utils.admin.listStaff.invalidate();
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Onboarding failed");
    }
  };

  const handleCreateStaff = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPass.trim()) {
      toast.error("Name, email and password are required"); return;
    }
    if (newPass.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(newPass)) { toast.error("Password needs at least 1 uppercase letter"); return; }
    if (!/[0-9]/.test(newPass)) { toast.error("Password needs at least 1 number"); return; }
    try {
      const res = await createStaffMut.mutateAsync({ name: newName, email: newEmail, password: newPass, phone: newPhone, role: newRole });
      toast.success(`${res.name} created — ID: ${res.userId.slice(-12).toUpperCase()}`);
      setNewName(""); setNewEmail(""); setNewPass(""); setNewPhone("");
      utils.admin.listStaff.invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create staff");
    }
  };

  return (
    <div>
      <InfoBox>
        Only onboard staff for <strong>your own store</strong>. Staff you create or promote will have access scoped to Gimbiya Mall only. Affiliates must already be registered buyers — look them up by User ID.
      </InfoBox>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <Card>
          <SectionTitle icon={UserSearch}>Onboard Existing User</SectionTitle>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
            Enter a registered buyer's User ID to promote them to stock manager or affiliate. The buyer can find their User ID in their account settings.
          </p>

          <Field label="User ID Number">
            <Inp value={lookupId} onChange={setLookupId} placeholder="e.g. 507f1f77bcf86cd799439011" />
          </Field>

          <Btn variant="primary" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={handleLookup} loading={lookupQuery.isFetching}>
            <Search size={13} /> Look Up User
          </Btn>

          {lookupErr && (
            <div style={{ marginTop: 12, padding: "11px 13px", background: C.redS, border: `1px solid rgba(239,68,68,.25)`, borderRadius: 8, fontSize: 12, color: C.red, display: "flex", alignItems: "center", gap: 7 }}>
              <AlertCircle size={13} /> {lookupErr}
            </div>
          )}

          {lookupResult && lookupResult !== "not_found" && (
            <div style={{ marginTop: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar name={lookupResult.name} size={44} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{lookupResult.name}</p>
                  <p style={{ fontSize: 11, color: C.dim, margin: "2px 0 0" }}>{lookupResult.email}</p>
                  <p style={{ fontSize: 10, color: C.muted, margin: "2px 0 0", fontFamily: "monospace" }}>ID: {lookupResult._id.slice(-12).toUpperCase()}</p>
                </div>
                <RoleBadge role={lookupResult.role} />
              </div>

              <Field label="Assign Role" style={{ marginBottom: 10 }}>
                <Select value={lookupRole} onChange={setLookupRole}>
                  <option value="stock_manager">Stock Manager</option>
                  <option value="delivery">Delivery Staff</option>
                  <option value="reader">Affiliate (reader)</option>
                </Select>
              </Field>

              <Btn variant="success" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={handleConfirmOnboard} loading={onboardMut.isPending}>
                <CheckCircle2 size={13} /> Confirm Onboarding
              </Btn>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon={UserPlus}>Create New Staff Account</SectionTitle>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
            Create a brand-new account for a staff member. They'll log in via the Staff Portal using these credentials.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name">
              <Inp value={newName} onChange={setNewName} placeholder="Amina Hassan" />
            </Field>
            <Field label="Phone (optional)">
              <Inp value={newPhone} onChange={setNewPhone} placeholder="+234 800 000 0000" />
            </Field>
          </div>

          <Field label="Email Address">
            <Inp value={newEmail} onChange={setNewEmail} placeholder="amina@store.com" type="email" />
          </Field>

          <Field label="Temporary Password">
            <Inp value={newPass} onChange={setNewPass} placeholder="Min 8 chars, 1 uppercase, 1 number" type="password" />
          </Field>

          <Field label="Role" style={{ marginBottom: 0 }}>
            <Select value={newRole} onChange={(value) => setNewRole(value as "stock_manager" | "delivery") }>
              <option value="stock_manager">Stock Manager</option>
              <option value="delivery">Delivery Staff</option>
            </Select>
          </Field>

          <div style={{ borderTop: `1px solid ${C.border}`, margin: "18px 0 14px" }} />

          <Btn variant="primary" style={{ width: "100%", justifyContent: "center", padding: "9px" }} onClick={handleCreateStaff} loading={createStaffMut.isPending}>
            <UserPlus size={13} /> Create Staff Account
          </Btn>
        </Card>
      </div>
    </div>
  );
}

const TABS = [
  { id: "staff", label: "Staff Members", Icon: Users },
  { id: "buyers", label: "Buyers & Affiliates", Icon: UserSearch },
  { id: "onboard", label: "Onboard New Staff", Icon: UserPlus },
] as const;

export default function StaffManagement({ defaultTab = "staff" }: { defaultTab?: "staff" | "buyers" | "onboard" }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-.4px" }}>Staff Management</h1>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>Manage store staff, roles, affiliates, and onboarding</p>
        </div>
        <span style={{ padding: "4px 12px", borderRadius: 20, background: C.amberB, color: C.amber, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
          <ShieldCheck size={11} /> Admin Portal
        </span>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 24px", gap: 4 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
              padding: "12px 16px", background: "none", border: "none",
              borderBottom: `2px solid ${activeTab === id ? C.amber : "transparent"}`,
              color: activeTab === id ? C.amber : C.muted,
              fontSize: 12, fontWeight: activeTab === id ? 700 : 500,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "color .15s", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      <div style={{ padding: 20, maxWidth: 1120, margin: "0 auto" }}>
        {activeTab === "staff" && <StaffTab onAddStaff={() => setActiveTab("onboard")} />}
        {activeTab === "buyers" && <BuyersTab />}
        {activeTab === "onboard" && <OnboardTab onSuccess={() => setActiveTab("staff")} />}
      </div>
    </div>
  );
}
