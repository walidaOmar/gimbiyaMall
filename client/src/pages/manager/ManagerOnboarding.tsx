/**
 * ManagerOnboarding.tsx  —  Gimbiya Mall · Manager Portal
 *
 * Allows a branch manager to:
 *   1. Submit a new stock manager or delivery staff onboard request to admin
 *   2. Track all submitted requests (pending / approved / rejected)
 *
 * tRPC endpoints
 *   manager.submitStaffRequest   manager.myStaffRequests
 */

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  UserPlus, ClipboardList, CheckCircle2,
  XCircle, Clock, RefreshCw, AlertCircle,
  Info, Send, User, ChevronRight,
} from "lucide-react";

const C = {
  bg:"#07101f",card:"#0f1e30",card2:"#0d1929",border:"#19283d",
  amber:"#f59e0b",amberS:"rgba(245,158,11,.10)",amberB:"rgba(245,158,11,.18)",
  text:"#e2e8f0",muted:"#7a90a8",dim:"#3d526a",
  green:"#10b981",greenS:"rgba(16,185,129,.12)",
  red:"#ef4444",redS:"rgba(239,68,68,.12)",
  blue:"#3b82f6",
};

const REQUEST_META: any = {
  pending:  { label:"Pending Review", color:C.amber,  bg:C.amberS,  Icon:Clock         },
  approved: { label:"Approved",       color:C.green,  bg:C.greenS,  Icon:CheckCircle2  },
  rejected: { label:"Rejected",       color:C.red,    bg:C.redS,    Icon:XCircle       },
};

function fmtDate(iso: string | Date | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}

function Field({ label, required=false, children }: any) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:10, color:C.muted, textTransform:"uppercase",
        letterSpacing:".06em", marginBottom:5 }}>
        {label}{required && <span style={{ color:C.red, marginLeft:2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Inp({ value, onChange, placeholder="", type="text", disabled=false }: any) {
  const [foc,setFoc] = useState(false);
  return (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
      style={{ width:"100%", padding:"9px 12px",
        background:disabled?C.card2:C.bg, border:`1px solid ${foc?C.amber:C.border}`,
        borderRadius:7, color:disabled?C.muted:C.text, fontSize:13, outline:"none",
        boxSizing:"border-box", fontFamily:"inherit", transition:"border-color .2s",
        opacity:disabled?0.6:1 }}
    />
  );
}

function TextArea({ value, onChange, placeholder="", rows=3 }: any) {
  const [foc,setFoc] = useState(false);
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
      style={{ width:"100%", padding:"9px 12px",
        background:C.bg, border:`1px solid ${foc?C.amber:C.border}`,
        borderRadius:7, color:C.text, fontSize:13, outline:"none",
        boxSizing:"border-box", fontFamily:"inherit", resize:"vertical",
        lineHeight:1.5, transition:"border-color .2s" }}
    />
  );
}

function Btn({ children, onClick, variant="default", disabled=false, loading=false, style={} }: any) {
  const [hov,setHov]=useState(false);
  const V: any={
    default:{bg:"transparent",border:C.border,color:C.muted,hBg:C.card2,hBorder:C.amber,hColor:C.amber},
    primary:{bg:C.amber,border:C.amber,color:"#000",hBg:"#d97706",hBorder:"#d97706",hColor:"#000"},
  }[variant];
  return (
    <button type="button" onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ padding:"9px 18px", border:`1px solid ${hov?V.hBorder:V.border}`,
        borderRadius:8, background:hov?V.hBg:V.bg, color:hov?V.hColor:V.color,
        fontSize:12, fontWeight:700, cursor:disabled||loading?"not-allowed":"pointer",
        display:"inline-flex", alignItems:"center", gap:6, fontFamily:"inherit",
        opacity:disabled?0.5:1, transition:"all .15s", whiteSpace:"nowrap", ...style }}>
      {loading?<RefreshCw size={12} style={{animation:"spin 1s linear infinite"}}/>:children}
    </button>
  );
}

function InfoBox({ children, variant="info" }: any) {
  const cfg: any={ info:{bg:C.amberS,border:"rgba(245,158,11,.25)",color:C.amber,Icon:Info},
              warn:{bg:C.redS,border:"rgba(239,68,68,.25)",color:C.red,Icon:AlertCircle} }[variant];
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:8,
      padding:"11px 14px", marginBottom:16, fontSize:12, color:cfg.color,
      display:"flex", alignItems:"flex-start", gap:8 }}>
      <cfg.Icon size={14} style={{flexShrink:0,marginTop:1}}/>
      <div>{children}</div>
    </div>
  );
}

function Card({ children, style={} }: any) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`,
      borderRadius:12, padding:20, marginBottom:16, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon:Icon, children }: any) {
  return (
    <h3 style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 14px",
      paddingBottom:12, borderBottom:`1px solid ${C.border}`,
      display:"flex", alignItems:"center", gap:7 }}>
      <Icon size={14} color={C.amber}/>{children}
    </h3>
  );
}

function StatusBadge({ status }: any) {
  const m = REQUEST_META[status] ?? REQUEST_META.pending;
  return (
    <span style={{ padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700,
      background:m.bg, color:m.color, display:"inline-flex", alignItems:"center", gap:4 }}>
      <m.Icon size={9}/>{m.label}
    </span>
  );
}

function SubmitForm({ onSuccess }: any) {
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [phone,  setPhone]  = useState("");
  const [role,   setRole]   = useState("stock_manager");
  const [reason, setReason] = useState("");

  const submitMut = trpc.manager?.submitStaffRequest?.useMutation?.() ?? { mutateAsync: async () => { throw new Error("Not implemented"); }, isPending: false };
  const utils     = trpc.useUtils();

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required"); return;
    }
    try {
      await submitMut.mutateAsync({ name, email, phone:phone||undefined, role: role as any, reason:reason||undefined });
      toast.success("Request submitted — admin will review shortly");
      setName(""); setEmail(""); setPhone(""); setReason("");
      utils.manager?.myStaffRequests?.invalidate?.();
      onSuccess?.();
    } catch(e:any) { toast.error(e.message ?? "Submission failed"); }
  };

  return (
    <Card>
      <SectionTitle icon={UserPlus}>New Staff Onboard Request</SectionTitle>

      <InfoBox>
        This request will be sent to your <strong>admin</strong> for approval.
        Once approved the staff account will be created automatically and you'll see it in your roster.
      </InfoBox>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Field label="Full Name" required>
          <Inp value={name} onChange={setName} placeholder="Musa Aliyu"/>
        </Field>
        <Field label="Phone Number">
          <Inp value={phone} onChange={setPhone} placeholder="+234 800 000 0000"/>
        </Field>
      </div>

      <Field label="Email Address" required>
        <Inp value={email} onChange={setEmail} placeholder="musa@gimbiyamall.com" type="email"/>
      </Field>

      <Field label="Role for this Staff Member" required>
        <select value={role} onChange={e=>setRole(e.target.value)}
          style={{ width:"100%", padding:"9px 12px", background:C.card2, border:`1px solid ${C.border}`,
            borderRadius:7, color:C.text, fontSize:12, outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
          <option value="stock_manager">Stock Manager</option>
          <option value="delivery">Delivery Staff</option>
        </select>
      </Field>

      <Field label="Reason / Notes (optional)">
        <TextArea value={reason} onChange={setReason}
          placeholder="E.g. we need extra stock coverage during the festive season…"
          rows={3}/>
      </Field>

      <Btn variant="primary" onClick={handleSubmit} loading={submitMut.isPending}
        style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
        <Send size={13}/> Submit Request to Admin
      </Btn>
    </Card>
  );
}

function MyRequests() {
  const { data:reqs=[], isLoading, refetch, isFetching } =
    trpc.manager?.myStaffRequests?.useQuery?.(undefined, { refetchOnWindowFocus:true }) ?? { data:[], isLoading:false, refetch:()=>{}, isFetching:false };

  const [filter, setFilter] = useState("all");

  const pills = [
    { v:"all",      l:"All"      },
    { v:"pending",  l:"Pending"  },
    { v:"approved", l:"Approved" },
    { v:"rejected", l:"Rejected" },
  ];

  const shown = filter === "all" ? reqs : (reqs as any[]).filter((r:any) => r.status === filter);

  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <SectionTitle icon={ClipboardList} style={{ margin:0, border:"none", padding:0 }}>
          My Submitted Requests
        </SectionTitle>
        <button type="button" onClick={()=>refetch()}
          style={{ background:"transparent", border:"none", cursor:"pointer", color:C.muted, display:"flex" }}>
          <RefreshCw size={14} style={{ animation:isFetching?"spin 1s linear infinite":"none" }}/>
        </button>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {pills.map(p=>(
          <button key={p.v} type="button" onClick={()=>setFilter(p.v)}
            style={{ padding:"4px 12px", borderRadius:20, cursor:"pointer", fontFamily:"inherit",
              border:`1px solid ${filter===p.v?C.amber:C.border}`,
              background:filter===p.v?C.amberS:"transparent",
              color:filter===p.v?C.amber:C.muted, fontSize:10, fontWeight:filter===p.v?700:400,
              transition:"all .15s" }}>
            {p.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ textAlign:"center", color:C.muted, padding:"24px 0", fontSize:13 }}>Loading…</p>
      ) : shown.length === 0 ? (
        <p style={{ textAlign:"center", color:C.muted, padding:"24px 0", fontSize:13 }}>
          {filter==="all" ? "No requests submitted yet." : `No ${filter} requests.`}
        </p>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {shown.map((r:any) => (
            <RequestCard key={r._id} req={r}/>
          ))}
        </div>
      )}
    </Card>
  );
}

function RequestCard({ req }: any) {
  const [open, setOpen] = useState(false);
  const ROLE_LABEL: any = { stock_manager:"Stock Manager", delivery:"Delivery Staff" };
  return (
    <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
      overflow:"hidden", transition:"border-color .2s",
      borderLeft:`3px solid ${REQUEST_META[req.status]?.color ?? C.border}` }}>
      <div style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between",
        alignItems:"center", cursor:"pointer" }} onClick={()=>setOpen(o=>!o)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:C.amberS,
            color:C.amber, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <User size={15}/>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>{req.name}</p>
            <p style={{ fontSize:10, color:C.muted, margin:"2px 0 0" }}>
              {ROLE_LABEL[req.role]} · Submitted {fmtDate(req.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <StatusBadge status={req.status}/>
          <ChevronRight size={14} color={C.dim}
            style={{ transform:open?"rotate(90deg)":"none", transition:"transform .2s" }}/>
        </div>
      </div>

      {open && (
        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ paddingTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["Email",   req.email,                     false],
              ["Phone",   req.phone || "—",              false],
              ["Role",    ROLE_LABEL[req.role],           false],
              ["Status",  req.status,                    false],
            ].map(([l,v])=>(
              <div key={l as string}>
                <p style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 2px" }}>{l as string}</p>
                <p style={{ fontSize:12, color:C.text, margin:0 }}>{v as string}</p>
              </div>
            ))}
          </div>
          {req.reason && (
            <div style={{ marginTop:10, padding:"9px 11px", background:C.bg, borderRadius:7,
              border:`1px solid ${C.border}` }}>
              <p style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 4px" }}>Your Note</p>
              <p style={{ fontSize:12, color:C.muted, margin:0, lineHeight:1.5 }}>{req.reason}</p>
            </div>
          )}
          {req.reviewNote && (
            <div style={{ marginTop:8, padding:"9px 11px", borderRadius:7,
              background: req.status==="approved"?C.greenS:C.redS,
              border:`1px solid ${req.status==="approved"?"rgba(16,185,129,.25)":"rgba(239,68,68,.25)"}` }}>
              <p style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 4px" }}>Admin Note</p>
              <p style={{ fontSize:12, color:req.status==="approved"?C.green:C.red, margin:0, lineHeight:1.5 }}>{req.reviewNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id:"submit",   label:"Submit Request",  Icon:UserPlus      },
  { id:"requests", label:"My Requests",     Icon:ClipboardList },
];

export default function ManagerOnboarding() {
  const [tab, setTab] = useState("submit");
  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text,
      fontFamily:"'DM Sans',system-ui,-apple-system,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ padding:"16px 24px", borderBottom:`1px solid ${C.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:800, letterSpacing:"-.4px" }}>Staff Onboarding</h1>
          <p style={{ margin:"2px 0 0", fontSize:11, color:C.muted }}>Submit and track staff requests for your branch</p>
        </div>
        <span style={{ padding:"4px 12px", borderRadius:20, background:C.amberB, color:C.amber, fontSize:10, fontWeight:700 }}>
          Manager Portal
        </span>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
        {TABS.map(({id,label,Icon})=>(
          <button key={id} type="button" onClick={()=>setTab(id)}
            style={{ padding:"12px 16px", background:"none", border:"none",
              borderBottom:`2px solid ${tab===id?C.amber:"transparent"}`,
              color:tab===id?C.amber:C.muted, fontSize:12, fontWeight:tab===id?700:500,
              cursor:"pointer", display:"flex", alignItems:"center", gap:6,
              transition:"color .15s", fontFamily:"inherit" }}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      <div style={{ padding:20, maxWidth:760, margin:"0 auto" }}>
        {tab==="submit"   && <SubmitForm   onSuccess={()=>setTab("requests")}/>}
        {tab==="requests" && <MyRequests/>}
      </div>
    </div>
  );
}
