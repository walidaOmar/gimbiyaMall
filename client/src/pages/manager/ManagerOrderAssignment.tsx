/**
 * ManagerOrderAssignment.tsx  —  Gimbiya Mall · Manager Portal
 *
 * Manager can assign riders to orders and track live deliveries
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Truck, Package, Search, RefreshCw,
  MapPin, Phone, UserCheck, UserMinus,
  Clock, ChevronLeft, ChevronRight,
  CheckCircle2, Radio, X,
} from "lucide-react";

const C = {
  bg:"#07101f",card:"#0f1e30",card2:"#0d1929",border:"#19283d",
  amber:"#f59e0b",amberS:"rgba(245,158,11,.10)",amberB:"rgba(245,158,11,.18)",
  text:"#e2e8f0",muted:"#7a90a8",dim:"#3d526a",
  green:"#10b981",greenS:"rgba(16,185,129,.12)",
  red:"#ef4444",redS:"rgba(239,68,68,.12)",
  blue:"#3b82f6",blueS:"rgba(59,130,246,.12)",
};

const STATUS_META: any = {
  pending:    {label:"Pending",    color:"#fbbf24",bg:"rgba(251,191,36,.12)"},
  paid:       {label:"Paid",       color:C.blue,   bg:C.blueS              },
  processing: {label:"Processing", color:"#a78bfa",bg:"rgba(167,139,250,.12)"},
  assigned:   {label:"Assigned",   color:C.amber,  bg:C.amberS             },
  in_transit: {label:"In Transit", color:C.green,  bg:C.greenS             },
  delivered:  {label:"Delivered",  color:C.green,  bg:C.greenS             },
  cancelled:  {label:"Cancelled",  color:C.red,    bg:C.redS               },
};

const PAGE = 20;

function fmt(n: any)  { return `₦${Number(n??0).toLocaleString()}`; }
function elapsed(iso: any) {
  if (!iso) return "";
  const m = Math.round((Date.now()-new Date(iso).getTime())/60000);
  return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ${m%60}m ago`:`${Math.floor(m/1440)}d ago`;
}
function initials(n = "") {
  return n.trim().split(/\s+/).slice(0,2).map((w:any)=>w[0]).join("").toUpperCase();
}
function avColor(n = "") {
  const p=[C.blue,C.green,"#a78bfa",C.amber,C.red,"#ec4899"];
  return p[n.charCodeAt(0)%p.length];
}

function Av({name,size=32}: any) {
  const c=avColor(name);
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
      background:c+"22",color:c,display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:size<36?10:13,fontWeight:700}}>
      {initials(name)}
    </div>
  );
}

function Badge({status}: any) {
  const m=STATUS_META[status]??{label:status,color:C.muted,bg:C.border};
  return <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:m.bg,color:m.color,display:"inline-block",whiteSpace:"nowrap"}}>{m.label}</span>;
}

function Btn({children,onClick,variant="default",size="sm",disabled=false,loading=false,style={}}: any) {
  const [hov,setHov]=useState(false);
  const V: any={
    default:{bg:"transparent",b:C.border,c:C.muted,hBg:C.card2,hB:C.amber,hC:C.amber},
    primary:{bg:C.amber,b:C.amber,c:"#000",hBg:"#d97706",hB:"#d97706",hC:"#000"},
    success:{bg:C.green,b:C.green,c:"#fff",hBg:"#059669",hB:"#059669",hC:"#fff"},
    danger: {bg:"transparent",b:"rgba(239,68,68,.3)",c:C.red,hBg:C.redS,hB:C.red,hC:C.red},
    ghost:  {bg:"transparent",b:"rgba(59,130,246,.3)",c:C.blue,hBg:C.blueS,hB:C.blue,hC:C.blue},
  }[variant];
  const pad=size==="xs"?"3px 8px":size==="sm"?"5px 11px":"9px 18px";
  return (
    <button type="button" onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:pad,border:`1px solid ${hov?V.hB:V.b}`,borderRadius:7,
        background:hov?V.hBg:V.bg,color:hov?V.hC:V.c,fontSize:11,fontWeight:600,
        cursor:disabled||loading?"not-allowed":"pointer",display:"inline-flex",
        alignItems:"center",gap:5,fontFamily:"inherit",opacity:disabled?0.5:1,
        transition:"all .15s",whiteSpace:"nowrap",...style}}>
      {loading?<RefreshCw size={11} style={{animation:"spin 1s linear infinite"}}/>:children}
    </button>
  );
}

function AssignDrawer({ order, riders, onClose, onAssigned }: any) {
  const [riderId, setRiderId] = useState((order.deliveryRiderId as any)?._id ?? "");
  const assignMut   = trpc.manager?.assignRider?.useMutation?.() ?? { mutateAsync: async () => {}, isPending: false };
  const unassignMut = trpc.manager?.unassignRider?.useMutation?.() ?? { mutateAsync: async () => {}, isPending: false };

  const handleAssign = async () => {
    if (!riderId) { toast.error("Select a rider"); return; }
    try {
      const r: any = await assignMut.mutateAsync({ orderId: order.orderId, riderId });
      toast.success(`Assigned to ${r.riderName}`);
      onAssigned();
    } catch(e:any) { toast.error(e.message ?? "Failed"); }
  };

  const handleUnassign = async () => {
    try {
      await unassignMut.mutateAsync({ orderId: order.orderId });
      toast.success("Rider removed");
      onAssigned();
    } catch(e:any) { toast.error(e.message ?? "Failed"); }
  };

  const rider  = order.deliveryRiderId as any;
  const buyer  = order.buyerId as any;
  const dest   = [order.shippingAddress, order.shippingCity].filter(Boolean).join(", ");

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:40}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:440,maxWidth:"95vw",
        background:"#0b1724",borderLeft:`1px solid ${C.border}`,zIndex:50,
        display:"flex",flexDirection:"column",overflowY:"auto"}}>

        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",
          position:"sticky",top:0,background:"#0b1724",zIndex:2}}>
          <div>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>{order.orderId}</p>
            <p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>{fmt(order.finalAmount)} · {buyer?.name}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Badge status={order.status}/>
            <button type="button" onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:C.muted}}>
              <X size={17}/>
            </button>
          </div>
        </div>

        <div style={{padding:"18px 20px"}}>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:16}}>
            <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 8px"}}>Delivery Destination</p>
            <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
              <MapPin size={13} color={C.red} style={{flexShrink:0,marginTop:1}}/>
              <p style={{fontSize:13,fontWeight:600,color:C.text,margin:0,lineHeight:1.4}}>{dest || "No address set"}</p>
            </div>
            {order.buyerPhone && (
              <a href={`tel:${order.buyerPhone}`} style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:12,color:C.blue,textDecoration:"none"}}>
                <Phone size={11}/>{order.buyerPhone}
              </a>
            )}
          </div>

          {rider && (
            <div style={{background:C.card,border:`1px solid ${C.green}44`,borderRadius:10,
              padding:14,marginBottom:16,borderLeft:`3px solid ${C.green}`}}>
              <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 10px"}}>
                Assigned Rider
              </p>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <Av name={rider.name} size={38}/>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{rider.name}</p>
                  <p style={{fontSize:11,color:C.dim,margin:"2px 0 0"}}>{rider.email}</p>
                </div>
              </div>
              {rider.phone && (
                <a href={`tel:${rider.phone}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.blue,textDecoration:"none",marginBottom:10}}>
                  <Phone size={11}/>{rider.phone}
                </a>
              )}
              <Btn variant="danger" onClick={handleUnassign} loading={unassignMut.isPending} style={{width:"100%",justifyContent:"center"}}>
                <UserMinus size={12}/> Remove Rider
              </Btn>
            </div>
          )}

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
            <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 10px"}}>
              {rider ? "Re-assign Rider" : "Assign Rider"}
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {riders.length===0 ? (
                <p style={{fontSize:12,color:C.muted}}>No delivery riders available.</p>
              ) : (
                <>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {riders.map((r:any)=>{
                      const sel = riderId===r._id;
                      return (
                        <div key={r._id} onClick={()=>setRiderId(r._id)}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                            borderRadius:8,cursor:"pointer",transition:"all .15s",
                            border:`1px solid ${sel?C.amber:C.border}`,
                            background:sel?C.amberS:C.card2}}>
                          <Av name={r.name} size={32}/>
                          <div style={{flex:1}}>
                            <p style={{fontSize:12,fontWeight:600,color:sel?C.amber:C.text,margin:0}}>{r.name}</p>
                            {r.phone && <p style={{fontSize:10,color:C.muted,margin:"2px 0 0"}}>{r.phone}</p>}
                          </div>
                          {sel && <CheckCircle2 size={14} color={C.amber}/>}
                        </div>
                      );
                    })}
                  </div>
                  <Btn variant={rider?"primary":"success"} onClick={handleAssign}
                    disabled={!riderId} loading={assignMut.isPending}
                    style={{width:"100%",justifyContent:"center",padding:"10px"}}>
                    <UserCheck size={13}/>{rider?"Re-assign Rider":"Assign Rider"}
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LiveTracker({ onSelect }: any) {
  const { data, isFetching, dataUpdatedAt } = trpc.manager?.ordersForAssignment?.useQuery?.(
    { status:"in_transit", limit:30, offset:0 },
    { refetchInterval:15000 }
  ) ?? { data: undefined, isFetching: false, dataUpdatedAt: undefined };
  
  const orders = (data as any)?.orders ?? [];
  const [ping, setPing] = useState("—");
  useEffect(()=>{ if(dataUpdatedAt) setPing(new Date(dataUpdatedAt).toLocaleTimeString()); },[dataUpdatedAt]);

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,boxShadow:`0 0 0 3px ${C.greenS}`,animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:13,fontWeight:700,color:C.text}}>Live In-Transit</span>
          <span style={{fontSize:10,color:C.muted}}>auto-refresh 15s</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:10,color:C.dim}}>Last: {ping}</span>
          {isFetching && <RefreshCw size={12} color={C.muted} style={{animation:"spin 1s linear infinite"}}/>}
          <span style={{padding:"2px 9px",borderRadius:20,background:C.greenS,color:C.green,fontSize:10,fontWeight:700}}>{orders.length} active</span>
        </div>
      </div>

      {orders.length===0 ? (
        <p style={{textAlign:"center",color:C.muted,fontSize:12,padding:"16px 0"}}>No orders currently in transit.</p>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
          {orders.map((o:any)=>{
            const rider = o.deliveryRiderId;
            const dest  = [o.shippingAddress,o.shippingCity].filter(Boolean).join(", ");
            return (
              <div key={o._id} onClick={()=>onSelect(o)}
                style={{background:C.bg,border:`1px solid ${C.green}33`,borderLeft:`3px solid ${C.green}`,
                  borderRadius:10,padding:13,cursor:"pointer",transition:"border-color .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:C.amber,fontFamily:"monospace"}}>{o.orderId}</span>
                  <span style={{fontSize:10,color:C.muted}}>{elapsed(o.updatedAt)}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,padding:"7px 9px",background:"#0b1724",borderRadius:7}}>
                  <Av name={rider?.name??"?"} size={26}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:11,fontWeight:600,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rider?.name??"Unassigned"}</p>
                    {rider?.phone && <p style={{fontSize:10,color:C.blue,margin:"1px 0 0"}}>{rider.phone}</p>}
                  </div>
                  <Truck size={13} color={C.green}/>
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                  <MapPin size={10} color={C.red} style={{flexShrink:0,marginTop:2}}/>
                  <span style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{dest||"No address"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentBoard() {
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("all");
  const [page,    setPage]    = useState(0);
  const [debQ,    setDebQ]    = useState("");
  const [drawer,  setDrawer]  = useState<any>(null);

  useEffect(()=>{ const t=setTimeout(()=>{setDebQ(search);setPage(0);},350); return()=>clearTimeout(t); },[search]);

  const { data, isLoading, isFetching, refetch } = trpc.manager?.ordersForAssignment?.useQuery?.(
    { status:status==="all"?undefined:status, search:debQ||undefined, limit:PAGE, offset:page*PAGE },
    { keepPreviousData:true }
  ) ?? { data: undefined, isLoading: false, isFetching: false, refetch: () => {} };
  
  const { data:riders=[] } = trpc.manager?.listRiders?.useQuery?.() ?? { data: [] };

  const orders = (data as any)?.orders ?? [];
  const total  = (data as any)?.total  ?? 0;
  const pages  = Math.ceil(total/PAGE);
  const utils  = trpc.useUtils();

  const STATUS_PILLS = ["all","paid","processing","assigned","in_transit"];
  const colT = "1.2fr 1.6fr 1fr 1fr 1.2fr 1fr 90px";

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,position:"relative"}}>
          <Search size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.muted}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by order ID…"
            style={{width:"100%",padding:"9px 12px 9px 32px",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
          />
        </div>
        <Btn onClick={()=>{ refetch(); utils.manager?.ordersForAssignment?.invalidate?.(); }}>
          <RefreshCw size={12} style={{animation:isFetching?"spin 1s linear infinite":"none"}}/> Refresh
        </Btn>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {STATUS_PILLS.map(s=>(
          <button key={s} type="button" onClick={()=>{setStatus(s);setPage(0);}}
            style={{padding:"4px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",
              border:`1px solid ${status===s?(STATUS_META[s]?.color??C.amber):C.border}`,
              background:status===s?(STATUS_META[s]?.bg??C.amberS):"transparent",
              color:status===s?(STATUS_META[s]?.color??C.amber):C.muted,
              fontSize:10,fontWeight:status===s?700:400,transition:"all .15s"}}>
            {s==="all"?"All Ready":STATUS_META[s]?.label??s}
          </button>
        ))}
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:colT,gap:10,padding:"11px 16px",borderBottom:`1px solid ${C.border}`}}>
          {["Order","Buyer","Amount","Status","Rider","Date",""].map(h=>(
            <span key={h} style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <p style={{textAlign:"center",color:C.muted,padding:"28px",fontSize:13}}>Loading orders…</p>
        ) : orders.length===0 ? (
          <p style={{textAlign:"center",color:C.muted,padding:"28px",fontSize:13}}>No orders found.</p>
        ) : orders.map((o:any,i:number)=>{
          return (
            <OrderAssignRow key={o._id} order={o} last={i===orders.length-1}
              colT={colT} onOpen={()=>setDrawer(o)}/>
          );
        })}
      </div>

      {pages>1 && (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
          <span style={{fontSize:11,color:C.muted}}>
            {page*PAGE+1}–{Math.min((page+1)*PAGE,total)} of {total}
          </span>
          <div style={{display:"flex",gap:6}}>
            <Btn onClick={()=>setPage(p=>p-1)} disabled={page===0}><ChevronLeft size={12}/></Btn>
            <span style={{fontSize:11,color:C.muted,alignSelf:"center"}}>Page {page+1}/{pages}</span>
            <Btn onClick={()=>setPage(p=>p+1)} disabled={page>=pages-1}><ChevronRight size={12}/></Btn>
          </div>
        </div>
      )}

      {drawer && (
        <AssignDrawer order={drawer} riders={riders as any[]}
          onClose={()=>setDrawer(null)}
          onAssigned={()=>{ setDrawer(null); utils.manager?.ordersForAssignment?.invalidate?.(); }}
        />
      )}
    </div>
  );
}

function OrderAssignRow({ order, last, colT, onOpen }: any) {
  const [hov,setHov]=useState(false);
  const rider = order.deliveryRiderId as any;
  const buyer = order.buyerId as any;
  return (
    <div style={{display:"grid",gridTemplateColumns:colT,gap:10,padding:"12px 16px",alignItems:"center",
      borderBottom:last?"none":`1px solid ${C.border}`,
      background:hov?"rgba(255,255,255,.018)":"transparent",transition:"background .1s"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <span style={{fontSize:11,fontWeight:700,color:C.amber,fontFamily:"monospace"}}>{order.orderId}</span>
      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
        <Av name={buyer?.name??"?"} size={26}/>
        <div style={{minWidth:0}}>
          <p style={{fontSize:12,fontWeight:600,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{buyer?.name??"—"}</p>
          <p style={{fontSize:10,color:C.dim,margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{buyer?.phone??""}</p>
        </div>
      </div>
      <span style={{fontSize:13,fontWeight:700,color:C.text}}>{fmt(order.finalAmount)}</span>
      <Badge status={order.status}/>
      <div>
        {rider ? (
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <Av name={rider.name} size={22}/>
            <span style={{fontSize:11,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rider.name}</span>
          </div>
        ) : (
          <span style={{fontSize:10,color:C.red,display:"flex",alignItems:"center",gap:3}}>
            <Clock size={9}/> Unassigned
          </span>
        )}
      </div>
      <span style={{fontSize:10,color:C.muted}}>{new Date(order.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>
      <Btn size="xs" variant={rider?"default":"success"} onClick={onOpen}>
        {rider ? "Re-assign" : <><UserCheck size={11}/> Assign</>}
      </Btn>
    </div>
  );
}

const TABS=[
  {id:"board",label:"Assignment Board",Icon:Package},
  {id:"live", label:"Live Tracking",   Icon:Radio  },
];

export default function ManagerOrderAssignment() {
  const [tab,setTab]=useState("board");
  const [selected,setSelected]=useState<any>(null);
  const { data:riders=[] } = trpc.manager?.listRiders?.useQuery?.() ?? { data: [] };
  const utils = trpc.useUtils();

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,
      fontFamily:"'DM Sans',system-ui,-apple-system,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{margin:0,fontSize:17,fontWeight:800,letterSpacing:"-.4px"}}>Order Assignment</h1>
          <p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>Assign riders to orders and monitor live deliveries</p>
        </div>
        <span style={{padding:"4px 12px",borderRadius:20,background:C.amberB,color:C.amber,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
          <Truck size={11}/> Manager Portal
        </span>
      </div>

      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,padding:"0 24px"}}>
        {TABS.map(({id,label,Icon})=>(
          <button key={id} type="button" onClick={()=>setTab(id)}
            style={{padding:"12px 16px",background:"none",border:"none",
              borderBottom:`2px solid ${tab===id?C.amber:"transparent"}`,
              color:tab===id?C.amber:C.muted,fontSize:12,fontWeight:tab===id?700:500,
              cursor:"pointer",display:"flex",alignItems:"center",gap:6,
              transition:"color .15s",fontFamily:"inherit"}}>
            <Icon size={13}/>{label}
            {id==="live" && <span style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite",display:"inline-block"}}/>}
          </button>
        ))}
      </div>

      <div style={{padding:20,maxWidth:1200,margin:"0 auto"}}>
        {tab==="board" && <AssignmentBoard/>}
        {tab==="live"  && (
          <>
            <LiveTracker onSelect={o=>{ setSelected(o); }}/>
            {selected && (
              <AssignDrawer order={selected} riders={riders as any[]}
                onClose={()=>setSelected(null)}
                onAssigned={()=>{ setSelected(null); utils.manager?.ordersForAssignment?.invalidate?.(); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
