import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Package, Truck, MapPin, Phone, User,
  Search, RefreshCw, X, ChevronRight, ChevronLeft,
  Radio, Eye, UserCheck, CheckCircle2, XCircle,
} from "lucide-react";

// Design tokens
const C = {
  bg:     "#07101f", sidebar: "#0b1724", card:  "#0f1e30", card2: "#0d1929",
  border: "#19283d", border2:"#243650",
  amber:  "#f59e0b", amberS: "rgba(245,158,11,.10)", amberB:"rgba(245,158,11,.18)",
  text:   "#e2e8f0", muted:  "#7a90a8",  dim:   "#3d526a",
  green:  "#10b981", greenS: "rgba(16,185,129,.12)",
  red:    "#ef4444", redS:   "rgba(239,68,68,.12)",
  blue:   "#3b82f6", blueS:  "rgba(59,130,246,.12)",
  purple: "#a78bfa", yellow: "#fbbf24",
};

const STATUS_META: Record<string, any> = {
  pending:    { label:"Pending",     color:"#fbbf24", bg:"rgba(251,191,36,.12)",  icon:"⏳" },
  paid:       { label:"Paid",        color:C.blue,    bg:C.blueS,                 icon:"💳" },
  processing: { label:"Processing",  color:C.purple,  bg:"rgba(167,139,250,.12)", icon:"⚙️" },
  assigned:   { label:"Assigned",    color:C.amber,   bg:C.amberS,                icon:"📦" },
  in_transit: { label:"In Transit",  color:C.green,   bg:C.greenS,                icon:"🚴" },
  delivered:  { label:"Delivered",   color:C.green,   bg:C.greenS,                icon:"✅" },
  cancelled:  { label:"Cancelled",   color:C.red,     bg:C.redS,                  icon:"❌" },
};

const STATUS_FLOW = ["pending","paid","processing","assigned","in_transit","delivered"];
const ALL_STATUSES = ["all","pending","paid","processing","assigned","in_transit","delivered","cancelled"];
const PAGE_SIZE = 20;

function fmt(n: any)  { return `₦${Number(n ?? 0).toLocaleString()}`; }
function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function elapsed(iso?: string) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins/60)}h ${mins%60}m ago`;
  return `${Math.floor(mins/1440)}d ago`;
}
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0,2).map((w:any)=>w[0]).join("").toUpperCase();
}
function avatarColor(name = "") {
  const p = [C.blue,C.green,C.purple,C.amber,C.red,"#ec4899"];
  return p[(name||"?").charCodeAt(0) % p.length];
}

function Avatar({ name, size = 32 }: { name?: string, size?: number }) {
  const c = avatarColor(name || "");
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:c+"22", color:c, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:size<36?10:13, fontWeight:700 }}>
      {initials(name || "")}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const m = STATUS_META[status ?? ""] ?? { label:status, color:C.muted, bg:C.border };
  return (
    <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700,
      background:m.bg, color:m.color, display:"inline-block", whiteSpace:"nowrap" }}>
      {m.label}
    </span>
  );
}

function Btn({ children, onClick, variant = "default", size = "sm", disabled = false, loading = false, style = {} }: any) {
  const [hov, setHov] = useState(false);
  const V: any = {
    default: { bg:"transparent", border:C.border,               color:C.muted,  hBg:C.card2,  hBorder:C.amber,  hColor:C.amber  },
    primary: { bg:C.amber,       border:C.amber,                color:"#000",   hBg:"#d97706",hBorder:"#d97706",hColor:"#000"   },
    success: { bg:C.green,       border:C.green,                color:"#fff",   hBg:"#059669",hBorder:"#059669",hColor:"#fff"   },
    danger:  { bg:"transparent", border:"rgba(239,68,68,.3)",   color:C.red,    hBg:C.redS,   hBorder:C.red,    hColor:C.red    },
    ghost:   { bg:"transparent", border:"rgba(59,130,246,.3)",  color:C.blue,   hBg:C.blueS,  hBorder:C.blue,   hColor:C.blue   },
  }[variant];
  const pad = size==="xs"?"3px 8px":size==="sm"?"5px 11px":"9px 18px";
  return (
    <button type="button" onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:pad, border:`1px solid ${hov?V.hBorder:V.border}`,
        borderRadius:7, background:hov?V.hBg:V.bg, color:hov?V.hColor:V.color,
        fontSize:11, fontWeight:600, cursor:disabled||loading?"not-allowed":"pointer",
        display:"inline-flex", alignItems:"center", gap:5, fontFamily:"inherit",
        opacity:disabled?0.5:1, transition:"all .15s", whiteSpace:"nowrap", ...style }}>
      {loading ? <RefreshCw size={11} style={{ animation:"spin 1s linear infinite" }}/> : children}
    </button>
  );
}

function InfoRow({ label, value, mono = false }: { label: string, value?: any, mono?: boolean }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:11, color:C.muted, flexShrink:0, marginRight:12 }}>{label}</span>
      <span style={{ fontSize:12, color:C.text, textAlign:"right", fontFamily:mono?"monospace":"inherit" }}>{value}</span>
    </div>
  );
}

function Section({ title, children, icon: Icon }: any) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10,
        paddingBottom:8, borderBottom:`1px solid ${C.border}` }}>
        {Icon && <Icon size={13} color={C.amber} />}
        <span style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:"uppercase", letterSpacing:" .06em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function OrderDrawer({ orderId, onClose }: { orderId: string | null, onClose: ()=>void }) {
  const [assignRiderId, setAssignRiderId] = useState("");
  const utils = (trpc as any).useUtils ? (trpc as any).useUtils() : (trpc as any).useContext?.();

  const { data: order, isLoading, refetch } = trpc.admin.orderDetail.useQuery(
    { orderId: orderId as string },
    { enabled:!!orderId, refetchInterval: orderId ? 12000 : false }
  );
  const { data: riders = [] } = trpc.admin.listRiders.useQuery();

  const assignMut       = trpc.admin.assignRider.useMutation();
  const updateStatusMut = trpc.admin.updateOrderStatus.useMutation();

  const handleAssign = async () => {
    if (!assignRiderId) { toast.error("Select a rider first"); return; }
    try {
      const res = await assignMut.mutateAsync({ orderId, riderId: assignRiderId });
      toast.success(`Assigned to ${res.riderName}`);
      refetch();
      utils?.admin?.allOrders?.invalidate?.();
    } catch(e:any) { toast.error(e?.message ?? "Failed to assign rider"); }
  };

  const handleStatus = async (status: string) => {
    try {
      await updateStatusMut.mutateAsync({ orderId, status });
      toast.success(`Status → ${STATUS_META[status]?.label}`);
      refetch();
      utils?.admin?.allOrders?.invalidate?.();
    } catch(e:any) { toast.error(e?.message ?? "Failed"); }
  };

  const buyer  = (order as any)?.buyerId;
  const rider  = (order as any)?.deliveryRiderId;
  const items  = (order as any)?.items ?? [];
  const curIdx = STATUS_FLOW.indexOf((order as any)?.status ?? "pending");

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:40 }} />

      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:480, maxWidth:"95vw",
        background:C.sidebar, borderLeft:`1px solid ${C.border}`, zIndex:50,
        display:"flex", flexDirection:"column", overflowY:"auto" }}>

        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:C.sidebar, zIndex:2 }}>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text }}>{orderId}</p>
            {order && <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>{fmtDate((order as any).createdAt)}</p>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {order && <StatusBadge status={(order as any).status} />}
            <button type="button" onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding:32, textAlign:"center", color:C.muted, fontSize:13 }}>Loading order…</div>
        ) : !order ? (
          <div style={{ padding:32, textAlign:"center", color:C.red, fontSize:13 }}>Order not found.</div>
        ) : (
          <div style={{ padding:"18px 20px", flex:1 }}>

            <div style={{ marginBottom:20, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
              <p style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:" .06em", margin:"0 0 10px" }}>Order Progress</p>
              <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= curIdx;
                  const cur  = i === curIdx;
                  const m    = STATUS_META[s];
                  return (
                    <div key={s} style={{ display:"flex", alignItems:"center", flex: i < STATUS_FLOW.length-1 ? 1 : "none" }}>
                      <div title={m.label} style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                        background: done ? m.color : C.border,
                        border: cur ? `2px solid ${m.color}` : "none",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, transition:"background .3s",
                        boxShadow: cur ? `0 0 0 3px ${m.color}33` : "none" }}>
                        {done && !cur && <span style={{ color:"#000", fontSize:9, fontWeight:700 }}>✓</span>}
                        {cur  && <span style={{ color:"#000", fontSize:9, fontWeight:700 }}>●</span>}
                      </div>
                      {i < STATUS_FLOW.length-1 && (
                        <div style={{ flex:1, height:2, background: i < curIdx ? C.green : C.border, transition:"background .3s" }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                {STATUS_FLOW.map(s => (
                  <span key={s} style={{ fontSize:8, color:C.dim, textTransform:"uppercase", letterSpacing:" .03em" }}>
                    {STATUS_META[s].label.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>

            {!["delivered","cancelled"].includes((order as any).status) && (
              <div style={{ marginBottom:18, display:"flex", gap:7, flexWrap:"wrap" }}>
                {STATUS_FLOW.filter((_,i) => i === curIdx+1 && i < STATUS_FLOW.length).map(next => (
                  <Btn key={next} variant="primary" onClick={()=>handleStatus(next)} loading={updateStatusMut.isLoading}>
                    → {STATUS_META[next].label}
                  </Btn>
                ))}
                {(order as any).status !== "cancelled" && (
                  <Btn variant="danger" onClick={()=>handleStatus("cancelled")} loading={updateStatusMut.isLoading}>
                    <XCircle size={11}/> Cancel
                  </Btn>
                )}
              </div>
            )}

            <Section title="Buyer" icon={User}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <Avatar name={buyer?.name ?? "?"} size={38} />
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{buyer?.name ?? "—"}</p>
                  <p style={{ fontSize:11, color:C.dim, margin:"2px 0 0" }}>{buyer?.email}</p>
                </div>
              </div>
              <InfoRow label="Phone"   value={buyer?.phone ?? (order as any).buyerPhone} />
              <InfoRow label="Address" value={[(order as any).shippingAddress,(order as any).shippingCity,(order as any).shippingState].filter(Boolean).join(", ")} />
              <InfoRow label="Country" value={(order as any).shippingCountry} />
            </Section>

            <Section title="Order Items" icon={Package}>
              <div style={{ background:C.card, borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                {items.map((item: any, i: number) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, padding:"10px 12px",
                    borderBottom: i < items.length-1 ? `1px solid ${C.border}` : "none" }}>
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:0 }}>{item.name}</p>
                      <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0" }}>Qty: {item.quantity} × {fmt(item.finalPrice)}</p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{fmt(item.subtotal)}</span>
                  </div>
                ))}
                <div style={{ padding:"10px 12px", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:C.muted }}>Total</span>
                  <span style={{ fontSize:15, fontWeight:800, color:C.amber }}>{fmt((order as any).finalAmount)}</span>
                </div>
              </div>
            </Section>

            <Section title="Delivery & Rider" icon={Truck}>
              {rider ? (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, padding:"12px", background:C.card, borderRadius:8, border:`1px solid ${C.border}` }}>
                    <Avatar name={rider.name} size={40} />
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>{rider.name}</p>
                      <p style={{ fontSize:11, color:C.dim, margin:"2px 0 0" }}>{rider.email}</p>
                      {rider.phone && (
                        <a href={`tel:${rider.phone}`} style={{ fontSize:11, color:C.blue, margin:"2px 0 0", display:"flex", alignItems:"center", gap:4, textDecoration:"none" }}>
                          <Phone size={10}/> {rider.phone}
                        </a>
                      )}
                    </div>
                    <StatusBadge status={(order as any).status} />
                  </div>
                  <InfoRow label="Destination" value={[(order as any).shippingAddress,(order as any).shippingCity].filter(Boolean).join(", ")} />
                  {(order as any).deliveryNotes && <InfoRow label="Notes" value={(order as any).deliveryNotes} />}

                  <div style={{ marginTop:10 }}>
                    <p style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:" .06em", margin:"0 0 6px" }}>Re-assign Rider</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <select value={assignRiderId} onChange={e=>setAssignRiderId(e.target.value)}
                        style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:7, color:C.text, fontSize:12, padding:"8px 10px", outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                        <option value="">Select rider…</option>
                        {riders.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                      <Btn variant="primary" onClick={handleAssign} loading={assignMut.isLoading}>Assign</Btn>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p style={{ fontSize:12, color:C.muted, marginBottom:10 }}>No rider assigned yet.</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <select value={assignRiderId} onChange={e=>setAssignRiderId(e.target.value)}
                      style={{ flex:1, background:C.card2, border:`1px solid ${C.border}`, borderRadius:7, color:C.text, fontSize:12, padding:"8px 10px", outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                      <option value="">Select rider…</option>
                      {riders.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                    <Btn variant="success" onClick={handleAssign} loading={assignMut.isLoading}>
                      <UserCheck size={12}/> Assign
                    </Btn>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Payment" icon={CheckCircle2}>
              <InfoRow label="Amount"     value={fmt((order as any).finalAmount)} />
              <InfoRow label="Status"     value={(order as any).paymentStatus} />
              <InfoRow label="Reference"  value={(order as any).paymentReference} mono />
              <InfoRow label="Commission" value={fmt((order as any).commissionAmount)} />
            </Section>

          </div>
        )}
      </div>
    </>
  );
}

function LiveDeliveryPanel({ onSelectOrder }: { onSelectOrder: (id: string)=>void }) {
  const { data, isLoading, dataUpdatedAt } = trpc.admin.allOrders.useQuery(
    { status:"in_transit", limit:50, offset:0 },
    { refetchInterval:15000 }
  );

  const liveOrders = (data as any)?.orders ?? [];
  const [lastPing, setLastPing] = useState<string>("—");

  useEffect(() => {
    if (dataUpdatedAt) setLastPing(new Date(dataUpdatedAt).toLocaleTimeString());
  }, [dataUpdatedAt]);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18, marginBottom:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:`0 0 0 3px ${C.greenS}`, animation:"pulse 2s infinite" }} />
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Live In-Transit Orders</span>
          <span style={{ fontSize:10, color:C.muted, fontFamily:"monospace" }}>auto-refresh 15s</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, color:C.dim }}>Last ping: {lastPing}</span>
          <span style={{ padding:"2px 9px", borderRadius:20, background:C.greenS, color:C.green, fontSize:10, fontWeight:700 }}>
            {liveOrders.length} active
          </span>
        </div>
      </div>

      {isLoading ? (
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"20px 0" }}>Loading live orders…</p>
      ) : liveOrders.length === 0 ? (
        <p style={{ fontSize:12, color:C.muted, textAlign:"center", padding:"20px 0" }}>No orders currently in transit.</p>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
          {liveOrders.map((o: any) => {
            const rider  = o.deliveryRiderId;
            const buyer  = o.buyerId;
            const dest   = [o.shippingAddress, o.shippingCity].filter(Boolean).join(", ");
            const rColor = avatarColor(rider?.name ?? "?");
            return (
              <div key={o._id}
                onClick={() => onSelectOrder(o.orderId)}
                style={{ background:C.bg, border:`1px solid ${C.green}33`, borderRadius:10, padding:14,
                  cursor:"pointer", transition:"border-color .2s",
                  borderLeft:`3px solid ${C.green}` }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=C.green)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor=C.green+"33")}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.amber, fontFamily:"monospace" }}>{o.orderId}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{elapsed(o.updatedAt)}</span>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"8px 10px", background:C.sidebar, borderRadius:7 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:rColor+"22", color:rColor,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, flexShrink:0 }}>
                    {initials(rider?.name ?? "?")}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, fontWeight:600, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {rider?.name ?? "Unassigned"}
                    </p>
                    {rider?.phone && (
                      <p style={{ fontSize:10, color:C.blue, margin:"1px 0 0", display:"flex", alignItems:"center", gap:3 }}>
                        <Phone size={8}/> {rider.phone}
                      </p>
                    )}
                  </div>
                  <Truck size={14} color={C.green} />
                </div>

                <div style={{ display:"flex", alignItems:"flex-start", gap:6, marginBottom:6 }}>
                  <MapPin size={11} color={C.red} style={{ flexShrink:0, marginTop:1 }} />
                  <span style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{dest || "No address"}</span>
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:11, color:C.muted }}>{buyer?.name ?? "—"}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.amber }}>{fmt(o.finalAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrdersTable({ onSelectOrder }: { onSelectOrder: (id: string)=>void }) {
  const [search,        setSearch]     = useState("");
  const [statusFilter,  setStatus]     = useState("all");
  const [page,          setPage]       = useState(0);
  const [debouncedQ,    setDebounced]  = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = trpc.admin.allOrders.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedQ || undefined,
    limit:  PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }, { keepPreviousData: true });

  const orders = (data as any)?.orders ?? [];
  const total  = (data as any)?.total  ?? 0;
  const pages  = Math.ceil(total / PAGE_SIZE);

  const colTemplate = "1.2fr 1.8fr 1fr 1fr 1.2fr 1fr 80px";

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:220, position:"relative" }}>
          <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.muted }} />
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by order ID…"
            style={{ width:"100%", padding:"9px 12px 9px 32px", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
          />
        </div>
        <select value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(0);}}
          style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12, padding:"9px 12px", outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : STATUS_META[s]?.label ?? s}</option>
          ))}
        </select>
        {isFetching && <RefreshCw size={14} color={C.muted} style={{ animation:"spin 1s linear infinite", alignSelf:"center" }} />}
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {["all","pending","processing","in_transit","delivered","cancelled"].map(s => (
          <button key={s} type="button" onClick={()=>{setStatus(s);setPage(0);}}
            style={{ padding:"4px 12px", borderRadius:20, border:`1px solid ${statusFilter===s?(STATUS_META[s]?.color??C.amber):C.border}`,
              background: statusFilter===s ? (STATUS_META[s]?.bg??C.amberS) : "transparent",
              color: statusFilter===s ? (STATUS_META[s]?.color??C.amber) : C.muted,
              fontSize:10, fontWeight:statusFilter===s?700:400, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}>
            {s === "all" ? "All" : STATUS_META[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:colTemplate, gap:10, padding:"11px 16px", borderBottom:`1px solid ${C.border}` }}>
          {['Order ID','Buyer','Amount','Status','Rider','Date',''].map(h => (
            <span key={h} style={{ fontSize:10, color:C.dim, textTransform:"uppercase", letterSpacing:" .06em" }}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <p style={{ textAlign:"center", color:C.muted, padding:"32px 16px", fontSize:13 }}>Loading orders…</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign:"center", color:C.muted, padding:"32px 16px", fontSize:13 }}>No orders found.</p>
        ) : orders.map((o: any, i: number) => (
          <OrderRow key={o._id} order={o} last={i===orders.length-1}
            colTemplate={colTemplate} onSelect={()=>onSelectOrder(o.orderId)} />
        ))}
      </div>

      {pages > 1 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
          <span style={{ fontSize:11, color:C.muted }}>
            Showing {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE, total)} of {total}
          </span>
          <div style={{ display:"flex", gap:6 }}>
            <Btn onClick={()=>setPage(p=>p-1)} disabled={page===0}><ChevronLeft size={12}/></Btn>
            <span style={{ fontSize:11, color:C.muted, alignSelf:"center" }}>Page {page+1} / {pages}</span>
            <Btn onClick={()=>setPage(p=>p+1)} disabled={page>=pages-1}><ChevronRight size={12}/></Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, last, colTemplate, onSelect }: any) {
  const [hov, setHov] = useState(false);
  const rider = order.deliveryRiderId;
  const buyer = order.buyerId;
  return (
    <div style={{ display:"grid", gridTemplateColumns:colTemplate, gap:10, padding:"12px 16px", alignItems:"center",
      borderBottom: last?"none":`1px solid ${C.border}`,
      background: hov?"rgba(255,255,255,.018)":"transparent", transition:"background .1s", cursor:"pointer" }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>

      <span style={{ fontSize:11, fontWeight:700, color:C.amber, fontFamily:"monospace" }}>{order.orderId}</span>

      <div style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
        <Avatar name={buyer?.name ?? "?"} size={26} />
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:12, fontWeight:600, color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{buyer?.name ?? "—"}</p>
          <p style={{ fontSize:10, color:C.dim, margin:"1px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{buyer?.phone ?? buyer?.email ?? ""}</p>
        </div>
      </div>

      <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{fmt(order.finalAmount)}</span>

      <StatusBadge status={order.status} />

      <div style={{ minWidth:0 }}>
        {rider ? (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <Avatar name={rider.name} size={22} />
            <span style={{ fontSize:11, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rider.name}</span>
          </div>
        ) : (
          <span style={{ fontSize:10, color:C.dim }}>Unassigned</span>
        )}
      </div>

      <span style={{ fontSize:10, color:C.muted }}>{new Date(order.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>

      <Btn size="xs" variant="ghost" onClick={onSelect}><Eye size={11}/> View</Btn>
    </div>
  );
}

const TABS = [
  { id:"orders", label:"All Orders",        Icon:Package   },
  { id:"live",   label:"Live Delivery",      Icon:Radio     },
];

export default function AdminOrders({ defaultTab = "orders" }: { defaultTab?: "orders" | "live" }) {
  const [activeTab,    setActiveTab]    = useState(defaultTab);
  const [openOrderId,  setOpenOrderId]  = useState<string | null>(null);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text,
      fontFamily:"'DM Sans', system-ui, -apple-system, sans-serif" }}>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }
      `}</style>

      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:800, letterSpacing:"-.4px" }}>Order Management</h1>
          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>View all orders, assign riders, and track live deliveries</p>
        </div>
        <span style={{ padding:"4px 12px", borderRadius:20, background:C.amberB, color:C.amber, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
          <Truck size={11}/> Admin Portal
        </span>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 24px", gap:4 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={()=>setActiveTab(id)}
            style={{ padding:"12px 16px", background:"none", border:"none",
              borderBottom:`2px solid ${activeTab===id?C.amber:"transparent"}`,
              color: activeTab===id?C.amber:C.muted,
              fontSize:12, fontWeight:activeTab===id?700:500,
              cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              transition:"color .15s", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            <Icon size={13}/> {label}
            {id==="live" && (
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.green,
                animation:"pulse 2s infinite", display:"inline-block", marginLeft:2 }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ padding:20, maxWidth:1200, margin:"0 auto" }}>
        {activeTab === "orders" && <OrdersTable onSelectOrder={setOpenOrderId} />}
        {activeTab === "live"   && (
          <>
            <LiveDeliveryPanel onSelectOrder={id=>{ setOpenOrderId(id); setActiveTab("orders"); }} />
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              <p style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center", gap:6, margin:0 }}>
                <svg style={{ width:13, height:13 }} />
                Live panel refreshes every <strong style={{color:C.text}}>15 seconds</strong> automatically.
                Click any card to open the full order detail and re-assign a rider if needed.
              </p>
            </div>
          </>
        )}
      </div>

      {openOrderId && (
        <OrderDrawer orderId={openOrderId} onClose={()=>setOpenOrderId(null)} />
      )}
    </div>
  );
}
