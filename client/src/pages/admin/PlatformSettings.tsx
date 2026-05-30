import { useState, useEffect, type CSSProperties, type Dispatch, type ReactElement, type ReactNode, type SetStateAction } from "react";
import {
  Store, Package, Bell, CreditCard, Clock, MapPin,
  Upload, Search, Edit2, Trash2, Image,
  Check,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const C = {
  bg:        "#07101f",
  sidebar:   "#0b1724",
  card:      "#0f1e30",
  border:    "#19283d",
  amber:     "#f59e0b",
  amberSoft: "rgba(245,158,11,0.10)",
  text:      "#e2e8f0",
  muted:     "#7a90a8",
  dim:       "#3d526a",
  green:     "#10b981",
  red:       "#ef4444",
};

const SAMPLE_PRODUCTS = [
  { id:1,  name:"Ankara Print Fabric",   category:"Fashion",     price:4500,   stock:120, status:"active",       sku:"ANK-001" },
  { id:2,  name:"iPhone 15 Pro Max",     category:"Electronics", price:850000, stock:8,   status:"active",       sku:"ELC-015" },
  { id:3,  name:"Egusi Soup Mix",        category:"Food",        price:1200,   stock:0,   status:"out_of_stock", sku:"FD-089"  },
  { id:4,  name:"Adire Tie-Dye Set",     category:"Fashion",     price:6800,   stock:45,  status:"active",       sku:"ANK-022" },
  { id:5,  name:'Samsung 65" 4K TV',     category:"Electronics", price:620000, stock:3,   status:"low_stock",    sku:"ELC-034" },
  { id:6,  name:"Shea Butter 500g",      category:"Beauty",      price:2300,   stock:200, status:"active",       sku:"BT-011"  },
  { id:7,  name:"Leather Handbag",       category:"Fashion",     price:15000,  stock:22,  status:"active",       sku:"FAS-067" },
  { id:8,  name:"Groundnut Oil 5L",      category:"Food",        price:3800,   stock:0,   status:"out_of_stock", sku:"FD-033"  },
  { id:9,  name:"Wireless Earbuds Pro",  category:"Electronics", price:18500,  stock:55,  status:"active",       sku:"ELC-078" },
  { id:10, name:"Zobo Drink 1L",         category:"Food",        price:800,    stock:0,   status:"out_of_stock", sku:"FD-102"  },
];

const CATEGORIES = ["All", "Fashion", "Electronics", "Food", "Beauty"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

type StoreNav = "general" | "branding" | "contact" | "hours" | "payment" | "notifications";

const STORE_NAV = [
  { id:"general",       label:"General",            Icon: Store      },
  { id:"branding",      label:"Branding",            Icon: Image      },
  { id:"contact",       label:"Contact & Location",  Icon: MapPin     },
  { id:"hours",         label:"Business Hours",      Icon: Clock      },
  { id:"payment",       label:"Payment Methods",     Icon: CreditCard },
  { id:"notifications", label:"Notifications",       Icon: Bell       },
] as const;

const PAYMENT_METHODS = [
  { key:"card",        label:"Card Payments",      sub:"Visa, Mastercard, Verve"       },
  { key:"transfer",    label:"Bank Transfer",       sub:"Direct account transfer"       },
  { key:"ussd",        label:"USSD Payments",       sub:"*737# and similar codes"       },
  { key:"monnify",     label:"Monnify",             sub:"Teamapt payment gateway"       },
  { key:"paystack",    label:"Paystack",            sub:"Online payment gateway"        },
  { key:"flutterwave", label:"Flutterwave",         sub:"Multi-currency payments"       },
];

const NOTIFICATION_ITEMS = [
  { key:"newOrder",   label:"New Order",           sub:"Alert when a customer places an order"   },
  { key:"lowStock",   label:"Low Stock Alert",      sub:"Notify when stock drops below 10 units"  },
  { key:"review",     label:"New Reviews",          sub:"Customer product review notifications"   },
  { key:"promo",      label:"Promotional Updates",  sub:"Marketing campaign performance"          },
  { key:"staffAlert", label:"Staff Activity",       sub:"Manager and staff action logs"           },
  { key:"smsAlerts",  label:"SMS Notifications",    sub:"Receive alerts via text message"         },
];

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  sku: string;
}

interface StoreConfig {
  name: string;
  slug: string;
  description: string;
  category: string;
  live: boolean;
  maintenance: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  hours?: Record<string, { open: boolean; from: string; to: string }>;
  paymentMethods?: Record<string, boolean>;
  notifications?: Record<string, boolean>;
}

interface PlatformSettingsProps {
  storeId?: string;
  products?: Product[];
  onSave?: (storeConfig: StoreConfig) => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
        background: value ? C.amber : C.border, position: "relative",
        transition: "background .2s", flexShrink: 0,
      }}
      aria-pressed={value}
    >
      <span style={{
        position: "absolute", top: 3,
        left: value ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left .2s",
      }} />
    </button>
  );
}

function Field({ label, children, style = {} }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={{ display:"block", fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:" .06em", marginBottom:5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", style = {} }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} style={style}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "9px 12px",
          background: C.bg, border: `1px solid ${focused ? C.amber : C.border}`,
          borderRadius: 7, color: C.text, fontSize: 13, outline: "none",
          boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s",
        }}
      />
    </Field>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "9px 12px",
          background: C.bg, border: `1px solid ${focused ? C.amber : C.border}`,
          borderRadius: 7, color: C.text, fontSize: 13, outline: "none",
          resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
          lineHeight: 1.5, transition: "border-color .2s",
        }}
      />
    </Field>
  );
}

function Card({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, marginBottom: 14, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 style={{
      fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 14px",
      paddingBottom: 12, borderBottom: `1px solid ${C.border}`, letterSpacing: "-.1px",
    }}>
      {children}
    </h3>
  );
}

function ToggleRow({ label, sub, value, onChange }: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "11px 0", borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>{sub}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function UploadZone({ hint, size }: { hint: string; size?: "sm" }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        border: `1.5px dashed ${hover ? C.amber : C.border}`,
        borderRadius: 10, padding: size === "sm" ? "16px 28px" : 28,
        textAlign: "center", cursor: "pointer", transition: "border-color .2s", marginTop: 6,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {size !== "sm" && (
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: C.amberSoft,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px",
        }}>
          <Upload size={20} color={C.amber} />
        </div>
      )}
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
        Drag & drop or <span style={{ color: C.amber }}>browse files</span>
      </p>
      <p style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{hint}</p>
    </div>
  );
}

function GeneralPanel({ store, setStore }: { store: StoreConfig; setStore: Dispatch<SetStateAction<StoreConfig>> }) {
  const upd = (key: keyof StoreConfig) => (val: string | boolean) => setStore((s) => ({ ...s, [key]: val }));
  return (
    <>
      <Card>
        <SectionTitle>Store Information</SectionTitle>
        <Input label="Store Name"          value={store.name}        onChange={upd("name") as (value: string) => void}        placeholder="Gimbiya Mall" />
        <Input label="Store URL / Slug"    value={store.slug}        onChange={upd("slug") as (value: string) => void}        placeholder="gimbiya-mall" />
        <TextArea label="Description"      value={store.description} onChange={upd("description") as (value: string) => void} rows={3} />
        <Input label="Business Category"   value={store.category}    onChange={upd("category") as (value: string) => void}    placeholder="General Merchandise" style={{ marginBottom: 0 }} />
      </Card>
      <Card>
        <SectionTitle>Store Status</SectionTitle>
        <ToggleRow label="Store is Live"    sub="Customers can browse and purchase"        value={store.live}        onChange={upd("live") as (value: boolean) => void}        />
        <ToggleRow label="Maintenance Mode" sub="Show a maintenance page to all visitors"  value={store.maintenance} onChange={upd("maintenance") as (value: boolean) => void} />
      </Card>
    </>
  );
}

function BrandingPanel() {
  return (
    <>
      <Card>
        <SectionTitle>Logo & Banner</SectionTitle>
        <Field label="Store Logo">
          <UploadZone hint="PNG, JPG up to 2MB · 512×512px recommended" />
        </Field>
        <Field label="Store Banner" style={{ marginBottom: 0 }}>
          <UploadZone hint="1200×400px recommended · Max 5MB" size="sm" />
        </Field>
      </Card>
      <Card>
        <SectionTitle>Brand Colors</SectionTitle>
        {[
          { label:"Primary Color",   sub:"Buttons, links, accents",            value:"#f59e0b" },
          { label:"Secondary Color", sub:"Backgrounds and highlights",          value:"#0b1724" },
          { label:"Accent Color",    sub:"Hover states and special highlights", value:"#10b981" },
        ].map((c) => (
          <div key={c.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${C.border}` }}>
            <div>
              <p style={{ fontSize:13, color:C.text, margin:0 }}>{c.label}</p>
              <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>{c.sub}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:6, background:c.value, border:`1px solid ${C.border}` }} />
              <span style={{ fontSize:12, color:C.muted, fontFamily:"monospace" }}>{c.value}</span>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

function ContactPanel({ store, setStore }: { store: StoreConfig; setStore: Dispatch<SetStateAction<StoreConfig>> }) {
  const upd = (key: keyof StoreConfig) => (val: string) => setStore((s) => ({ ...s, [key]: val }));
  return (
    <Card>
      <SectionTitle>Contact & Location</SectionTitle>
      <Input label="Email Address"  value={store.email}    onChange={upd("email") }    type="email" placeholder="hello@gimbiyamall.com" />
      <Input label="Phone Number"   value={store.phone}    onChange={upd("phone") }    placeholder="+234 800 000 0000" />
      <Input label="WhatsApp"       value={store.whatsapp} onChange={upd("whatsapp") } placeholder="+234 800 000 0000" />
      <Input label="Street Address" value={store.address}  onChange={upd("address") }  placeholder="12 Gimbiya Street, Area 11" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Input label="City"  value={store.city}  onChange={upd("city") }  placeholder="Abuja" style={{ marginBottom:0 }} />
        <Input label="State" value={store.state} onChange={upd("state") } placeholder="FCT"   style={{ marginBottom:0 }} />
      </div>
    </Card>
  );
}

function HoursPanel({ store, setStore }: { store: StoreConfig; setStore: Dispatch<SetStateAction<StoreConfig>> }) {
  const hours = store.hours ?? DAYS.reduce((acc, d) => ({
    ...acc, [d]: { open: d !== "Sunday", from: "09:00", to: "18:00" },
  }), {} as Record<string, { open: boolean; from: string; to: string }>);

  const update = (day: string, field: "open" | "from" | "to", val: string | boolean) =>
    setStore((s) => ({ ...s, hours: { ...hours, [day]: { ...hours[day], [field]: val } } }));

  const timeInput = (day: string, field: "from" | "to") => (
    <input
      type="time"
      value={hours[day][field]}
      onChange={(e) => update(day, field, e.target.value)}
      style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, color:C.text, padding:"4px 8px", fontSize:12, outline:"none" }}
    />
  );

  return (
    <Card>
      <SectionTitle>Business Hours</SectionTitle>
      {DAYS.map((day) => (
        <div key={day} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ width:82, fontSize:12, color:hours[day].open ? C.text : C.dim }}>{day.slice(0,3)}</span>
          <Toggle value={hours[day].open} onChange={(v) => update(day, "open", v)} />
          {hours[day].open ? (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {timeInput(day,"from")}
              <span style={{ color:C.dim, fontSize:12 }}>—</span>
              {timeInput(day,"to")}
            </div>
          ) : (
            <span style={{ fontSize:12, color:C.dim }}>Closed</span>
          )}
        </div>
      ))}
    </Card>
  );
}

function PaymentPanel({ store, setStore }: { store: StoreConfig; setStore: Dispatch<SetStateAction<StoreConfig>> }) {
  const pm = store.paymentMethods ?? { card:true, transfer:true, ussd:false, monnify:true, paystack:false, flutterwave:false };
  const toggle = (key: string) => setStore((s) => ({ ...s, paymentMethods: { ...pm, [key]: !pm[key] } }));
  return (
    <Card>
      <SectionTitle>Accepted Payment Methods</SectionTitle>
      {PAYMENT_METHODS.map(({ key, label, sub }) => (
        <ToggleRow key={key} label={label} sub={sub} value={!!pm[key]} onChange={() => toggle(key)} />
      ))}
    </Card>
  );
}

function NotificationsPanel({ store, setStore }: { store: StoreConfig; setStore: Dispatch<SetStateAction<StoreConfig>> }) {
  const n = store.notifications ?? { newOrder:true, lowStock:true, review:false, promo:true, staffAlert:true, smsAlerts:false };
  const toggle = (key: string) => setStore((s) => ({ ...s, notifications: { ...n, [key]: !n[key] } }));
  return (
    <Card>
      <SectionTitle>Notification Preferences</SectionTitle>
      {NOTIFICATION_ITEMS.map(({ key, label, sub }) => (
        <ToggleRow key={key} label={label} sub={sub} value={!!n[key]} onChange={() => toggle(key)} />
      ))}
    </Card>
  );
}

function statusMeta(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:       { label:"Active",        bg:"rgba(16,185,129,.12)", color:"#10b981" },
    out_of_stock: { label:"Out of Stock",  bg:"rgba(239,68,68,.12)",  color:"#ef4444" },
    low_stock:    { label:"Low Stock",     bg:"rgba(245,158,11,.12)", color:"#f59e0b" },
    inactive:     { label:"Inactive",      bg:"rgba(107,114,128,.12)", color:"#6b7280" },
  };
  return map[status] ?? { label:status, bg:C.border, color:C.muted };
}

function normalizeProductCategory(categoryId: any) {
  if (!categoryId) return "Uncategorized";
  return typeof categoryId === "object"
    ? categoryId.name ?? categoryId.label ?? "Uncategorized"
    : String(categoryId);
}

function normalizeStoreProducts(products: any[]): Product[] {
  return (products ?? []).map((p) => ({
    id: p._id?.toString?.() ?? String(p.id ?? ""),
    name: p.name ?? "Untitled Product",
    category: normalizeProductCategory(p.categoryId),
    price: p.finalPrice ?? p.baseSalePrice ?? 0,
    stock: p.stockQuantity ?? p.stock ?? 0,
    status: p.isActive === false
      ? "inactive"
      : (p.stockQuantity ?? p.stock ?? 0) === 0
        ? "out_of_stock"
        : (p.stockQuantity ?? p.stock ?? 0) <= 5
          ? "low_stock"
          : "active",
    sku: p.sku ?? (p._id?.toString?.() ?? "").slice(-8).toUpperCase(),
  }));
}

const DEFAULT_HOURS = DAYS.reduce((acc, d) => ({
  ...acc,
  [d]: { open: d !== "Sunday", from: "09:00", to: "18:00" },
}), {} as Record<string, { open: boolean; from: string; to: string }>);

function getStoreConfigFromDoc(storeDoc: any): StoreConfig {
  const contact = storeDoc.contact ?? {};
  return {
    name: storeDoc.name ?? STORE_DEFAULTS.name,
    slug: storeDoc.slug ?? String(storeDoc._id ?? storeDoc.name ?? "").toLowerCase().replace(/\s+/g, "-"),
    description: storeDoc.description ?? STORE_DEFAULTS.description,
    category: storeDoc.category === "store" ? "General Merchandise" : storeDoc.category ?? STORE_DEFAULTS.category,
    live: storeDoc.live ?? true,
    maintenance: storeDoc.maintenance ?? false,
    email: contact.email ?? STORE_DEFAULTS.email,
    phone: contact.phone ?? STORE_DEFAULTS.phone,
    whatsapp: contact.whatsapp ?? STORE_DEFAULTS.whatsapp,
    address: contact.address ?? STORE_DEFAULTS.address,
    city: contact.city ?? STORE_DEFAULTS.city,
    state: contact.state ?? STORE_DEFAULTS.state,
    hours: storeDoc.hours ?? DEFAULT_HOURS,
    paymentMethods: storeDoc.paymentMethods ?? {
      card: true, transfer: true, ussd: false, monnify: true, paystack: false, flutterwave: false,
    },
    notifications: storeDoc.notifications ?? {
      newOrder: true, lowStock: true, review: false, promo: true, staffAlert: true, smsAlerts: false,
    },
  };
}

const STORE_DEFAULTS: StoreConfig = {
  name:        "Gimbiya Mall",
  slug:        "gimbiya-mall",
  description: "Nigeria's premier virtual shopping destination.",
  category:    "General Merchandise",
  live:        true,
  maintenance: false,
  email:       "hello@gimbiyamall.com",
  phone:       "+234 800 123 4567",
  whatsapp:    "+234 800 123 4567",
  address:     "Gimbiya Street, Area 11",
  city:        "Abuja",
  state:       "FCT",
};

export default function PlatformSettings({ storeId, products, onSave }: PlatformSettingsProps) {
  const [mainTab,  setMainTab]  = useState("store");
  const [storeNav, setStoreNav] = useState<StoreNav>("general");
  const [store,    setStore]    = useState<StoreConfig>(STORE_DEFAULTS);
  const [saved,    setSaved]    = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(storeId);

  const utils = trpc.useContext();
  const storeDetailQuery = trpc.stores.detail.useQuery({ id: currentStoreId! }, { enabled: !!currentStoreId });
  const storeListQuery = trpc.stores.list.useQuery({ limit: 1, offset: 0 }, { enabled: !currentStoreId });
  const activeStore = storeDetailQuery.data ?? storeListQuery.data?.[0];

  useEffect(() => {
    if (storeId && storeId !== currentStoreId) {
      setCurrentStoreId(storeId);
    }
  }, [storeId, currentStoreId]);

  useEffect(() => {
    if (!activeStore) return;
    const id = activeStore._id?.toString?.() ?? String(activeStore.id ?? "");
    if (!id) return;
    setCurrentStoreId(id);
    setStore(getStoreConfigFromDoc(activeStore));
    setHasUnsavedChanges(false);
    setSaved(false);
  }, [activeStore]);

  const markDirty = () => {
    setHasUnsavedChanges(true);
    setSaved(false);
  };

  const setDirtyStore: Dispatch<SetStateAction<StoreConfig>> = (updater) => {
    setStore((prev) => {
      const next = typeof updater === "function"
        ? (updater as (prev: StoreConfig) => StoreConfig)(prev)
        : updater;
      if (next !== prev) {
        markDirty();
      }
      return next;
    });
  };

  const normalizedProducts = products ?? normalizeStoreProducts(activeStore?.products ?? []);

  const updateStoreMutation = trpc.stores.update.useMutation({
    onSuccess: () => {
      if (currentStoreId) utils.stores.detail.invalidate({ id: currentStoreId });
      utils.stores.list.invalidate();
    },
  });

  const handleSave = async () => {
    if (currentStoreId) {
      await updateStoreMutation.mutateAsync({
        id: currentStoreId,
        name: store.name,
        slug: store.slug,
        description: store.description,
        category: store.category === "office" ? "office" : "store",
        live: store.live,
        maintenance: store.maintenance,
        contact: {
          email: store.email,
          phone: store.phone,
          whatsapp: store.whatsapp,
          address: store.address,
          city: store.city,
          state: store.state,
        },
        hours: store.hours,
        paymentMethods: store.paymentMethods,
        notifications: store.notifications,
      });
    }

    onSave?.(store);
    setSaved(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setSaved(false), 2200);
  };

  const panels: Record<StoreNav, ReactElement> = {
    general:       <GeneralPanel       store={store} setStore={setDirtyStore} />,
    branding:      <BrandingPanel />,
    contact:       <ContactPanel       store={store} setStore={setDirtyStore} />,
    hours:         <HoursPanel         store={store} setStore={setDirtyStore} />,
    payment:       <PaymentPanel       store={store} setStore={setDirtyStore} />,
    notifications: <NotificationsPanel store={store} setStore={setDirtyStore} />,
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"'DM Sans', system-ui, -apple-system, sans-serif" }}>
      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:700, letterSpacing:"-.3px" }}>Platform Settings</h1>
          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>Manage your store configuration and product catalog</p>
        </div>

        {mainTab === "store" && (
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding:"9px 18px", border:"none", borderRadius:8, cursor:"pointer",
              background: saved ? C.green : C.amber,
              color: saved ? "#fff" : "#000",
              fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6, transition:"background .3s",
            }}
          >
            {saved ? <><Check size={13} /> Saved!</> : "Save Changes"}
          </button>
        )}
      </div>

      {!(saved && !hasUnsavedChanges) && (
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
          {[
            { id:"store",   label:"Store Settings", Icon: Store   },
            { id:"catalog", label:"Product Catalog", Icon: Package },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMainTab(id)}
              style={{
                padding:"12px 18px", background:"none", border:"none",
                borderBottom: `2px solid ${mainTab === id ? C.amber : "transparent"}`,
                color: mainTab === id ? C.amber : C.muted,
                fontSize:12, fontWeight: mainTab === id ? 700 : 500,
                cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                transition:"color .15s", fontFamily:"inherit",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding:20, maxWidth:1080, margin:"0 auto" }}>
        {mainTab === "store" && (
          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:20 }}>
            <nav style={{ background:C.sidebar, border:`1px solid ${C.border}`, borderRadius:12, padding:8, height:"fit-content" }}>
              {STORE_NAV.map(({ id, label, Icon }) => {
                const isNotification = id === "notifications";
                const disabledNotification = isNotification && !hasUnsavedChanges;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { if (!disabledNotification) setStoreNav(id); }}
                    style={{
                      width:"100%", padding:"9px 11px", borderRadius:8, border:"none", cursor: disabledNotification ? "not-allowed" : "pointer",
                      background: storeNav === id ? C.amberSoft : "transparent",
                      color:      storeNav === id ? C.amber     : disabledNotification ? C.dim : C.muted,
                      fontSize:12, fontWeight: storeNav === id ? 700 : 500,
                      display:"flex", alignItems:"center", gap:8,
                      marginBottom:1, textAlign:"left", fontFamily:"inherit", transition:"all .15s",
                      opacity: disabledNotification ? 0.55 : 1,
                    }}
                  >
                    <Icon size={14} /> {label}
                    {isNotification && hasUnsavedChanges && (
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: C.amber, background: 'rgba(245,158,11,0.12)', borderRadius: 999, padding: '2px 6px' }}>
                        Pending
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div>{panels[storeNav]}</div>
          </div>
        )}

        {mainTab === "catalog" && (
          <ProductCatalog products={normalizedProducts} />
        )}
      </div>
    </div>
  );
}

function ProductCatalog({ products = SAMPLE_PRODUCTS }: { products?: Product[] }) {
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");

  const filtered = products.filter((p) =>
    (cat === "All" || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const statItems = [
    { label:"Total",        val: products.length },
    { label:"Active",       val: products.filter((p) => p.status === "active").length },
    { label:"Out of Stock", val: products.filter((p) => p.status === "out_of_stock").length },
    { label:"Low Stock",    val: products.filter((p) => p.status === "low_stock").length },
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:180, position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, SKUs…"
            style={{ width:"100%", padding:"9px 12px 9px 33px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
          />
        </div>
      </div>

      <div style={{ display:"flex", gap:7, marginBottom:16, flexWrap:"wrap" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            style={{
              padding:"5px 13px", borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:"inherit",
              border: `1px solid ${cat === c ? C.amber : C.border}`,
              background: cat === c ? C.amberSoft : "transparent",
              color: cat === c ? C.amber : C.muted,
              fontWeight: cat === c ? 700 : 400, transition:"all .15s",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {statItems.map((s) => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <p style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:" .06em", margin:"0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize:22, fontWeight:800, color:C.text, margin:0 }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 68px", gap:10, padding:"11px 16px", borderBottom:`1px solid ${C.border}` }}>
          {['Product','Category','Price','Status',''].map((h) => (
            <span key={h} style={{ fontSize:10, color:C.dim, textTransform:"uppercase", letterSpacing:" .06em" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign:"center", color:C.muted, padding:32, fontSize:13 }}>No products found.</p>
        ) : filtered.map((p, i) => {
          const { label, bg, color } = statusMeta(p.status);
          return (
            <ProductRow key={p.id} p={p} label={label} bg={bg} color={color} last={i === filtered.length - 1} />
          );
        })}
      </div>
    </div>
  );
}

function ProductRow({ p, label, bg, color, last }: { p: Product; label: string; bg: string; color: string; last: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display:"grid", gridTemplateColumns:"2.2fr 1fr 1fr 1fr 68px",
        gap:10, padding:"13px 16px", alignItems:"center",
        borderBottom: last ? "none" : `1px solid ${C.border}`,
        background: hovered ? "rgba(255,255,255,.018)" : "transparent", transition:"background .1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{p.name}</p>
        <p style={{ fontSize:10, color:C.dim, margin:"2px 0 0", fontFamily:"monospace" }}>SKU: {p.sku}</p>
      </div>
      <span style={{ fontSize:12, color:C.muted }}>{p.category}</span>
      <span style={{ fontSize:13, fontWeight:700, color:C.text }}>₦{p.price.toLocaleString()}</span>
      <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:bg, color, display:"inline-block" }}>{label}</span>
      <div style={{ display:"flex", gap:6 }}>
        <ActionBtn icon={<Edit2 size={12} />} />
        <ActionBtn icon={<Trash2 size={12} />} danger />
      </div>
    </div>
  );
}

function ActionBtn({ icon, danger = false }: { icon: ReactNode; danger?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={{
        padding:"5px 7px", background:"transparent", cursor:"pointer", borderRadius:6,
        border: `1px solid ${hovered ? (danger ? C.red : C.amber) : (danger ? "rgba(239,68,68,.25)" : C.border)}`,
        color: hovered ? (danger ? C.red : C.amber) : (danger ? C.red : C.muted),
        transition:"all .15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
    </button>
  );
}
