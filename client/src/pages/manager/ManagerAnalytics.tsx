/**
 * ManagerAnalytics.tsx  —  Gimbiya Mall · Manager Portal
 *
 * Branch-level analytics with KPIs, charts, staff roster, and download reports
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
} from "recharts";
import {
  TrendingUp, Package, Truck, Users,
  DollarSign, Download, ChevronDown,
  Eye, BarChart3, Zap, MessageSquare,
} from "lucide-react";

const C={
  bg:"#07101f",card:"#0f1e30",card2:"#0d1929",border:"#19283d",
  amber:"#f59e0b",amberS:"rgba(245,158,11,.10)",amberB:"rgba(245,158,11,.18)",
  text:"#e2e8f0",muted:"#7a90a8",dim:"#3d526a",
  green:"#10b981",greenS:"rgba(16,185,129,.12)",
  red:"#ef4444",redS:"rgba(239,68,68,.12)",
  blue:"#3b82f6",blueS:"rgba(59,130,246,.12)",
};

function fmt(n:any)  { return `₦${Number(n??0).toLocaleString()}`; }
function pct(p:any) { return `${Number(p??0).toFixed(1)}%`; }
function initials(n="") { return n.trim().split(/\s+/).slice(0,2).map((w:any)=>w[0]).join("").toUpperCase(); }
function avColor(n="") {
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

function ChartTip({ active, payload }: any) {
  if(!active||!payload?.length) return null;
  const data=payload[0];
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,
      padding:"9px 12px",fontSize:11,color:C.text,whiteSpace:"nowrap"}}>
      <p style={{margin:0}}><strong>{data.name}</strong></p>
      <p style={{margin:"2px 0 0",color:data.color}}>{data.value}</p>
    </div>
  );
}

function KpiStrip({ data }: any) {
  const kpis=[
    {label:"Total Revenue",  v:fmt(data?.revenue),         ic:DollarSign, c:C.green },
    {label:"Commission",     v:fmt(data?.commission),      ic:TrendingUp, c:C.blue  },
    {label:"Orders",         v:(data?.orders??0).toLocaleString(), ic:Package,    c:C.amber },
    {label:"Delivered",      v:(data?.delivered??0).toLocaleString(), ic:Truck,      c:C.green },
    {label:"Cancelled",      v:(data?.cancelled??0).toLocaleString(), ic:MessageSquare, c:C.red   },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:18}}>
      {kpis.map((k,i)=>{
        const Ic=k.ic;
        return (
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <span style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".06em"}}>
                {k.label}
              </span>
              <div style={{width:28,height:28,borderRadius:7,background:k.c+"22",color:k.c,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ic size={13}/>
              </div>
            </div>
            <p style={{fontSize:19,fontWeight:800,color:C.text,margin:0}}>{k.v}</p>
          </div>
        );
      })}
    </div>
  );
}

function RevenueTrend({ data }: any) {
  const trend = (data?.monthlyTrend ?? []).map((m:any)=>({name:m.day,revenue:m.revenue,commission:m.commission}));
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <h3 style={{fontSize:12,fontWeight:700,color:C.text,margin:"0 0 14px",paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        Revenue Trend
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={trend} margin={{top:10,right:20,left:0,bottom:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
          <XAxis dataKey="name" tick={{fontSize:11,fill:C.muted}} stroke={C.border}/>
          <YAxis tick={{fontSize:11,fill:C.muted}} stroke={C.border}/>
          <RechartsTip content={<ChartTip/>}/>
          <Bar dataKey="revenue" fill={C.green} radius={[6,6,0,0]}/>
          <Bar dataKey="commission" fill={C.blue} radius={[6,6,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OrderDonut({ data }: any) {
  const breakdown=[
    {name:"Delivered", v:data?.delivered??0, c:C.green},
    {name:"Pending",   v:(data?.orders??0)-(data?.delivered??0)-(data?.cancelled??0), c:C.amber},
    {name:"Cancelled", v:data?.cancelled??0, c:C.red},
  ].filter(x=>x.v>0);

  const tot=breakdown.reduce((a:any,x:any)=>a+x.v,0);
  const rate=tot>0?Math.round((breakdown[0]?.v??0)/tot*100):0;

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <h3 style={{fontSize:12,fontWeight:700,color:C.text,margin:"0 0 14px",paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        Order Status Distribution
      </h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"center"}}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie dataKey="v" data={breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={85} startAngle={90} endAngle={-270}>
              {breakdown.map((e:any,i:number)=>(
                <Cell key={i} fill={e.c}/>
              ))}
            </Pie>
            <RechartsTip content={<ChartTip/>}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {breakdown.map((b:any,i:number)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:b.c}}/>
                <span style={{fontSize:11,color:C.muted}}>{b.name}</span>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:C.text}}>{b.v} ({pct(b.v/tot*100)})</span>
            </div>
          ))}
          <div style={{padding:"10px 11px",borderRadius:8,background:C.bg,marginTop:4}}>
            <p style={{fontSize:10,color:C.muted,margin:"0 0 4px",textTransform:"uppercase",letterSpacing:".06em"}}>Delivery Rate</p>
            <p style={{fontSize:16,fontWeight:800,color:C.green,margin:0}}>{rate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopProducts({ data }: any) {
  const prods=(data?.topProducts??[]).slice(0,10);
  if(prods.length===0) return null;
  const maxS=Math.max(...prods.map((p:any)=>p.sales));
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <h3 style={{fontSize:12,fontWeight:700,color:C.text,margin:"0 0 14px",paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        Top 10 Products
      </h3>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {prods.map((p:any,i:number)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:10,color:C.dim,minWidth:16}}>{i+1}</span>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:20,background:C.bg,borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${(p.sales/maxS)*100}%`,background:C.amber,transition:"width .3s"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:C.text,minWidth:40,textAlign:"right"}}>{p.sales}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffRoster({ data }: any) {
  const staff=(data?.staff??[]).slice(0,8);
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <h3 style={{fontSize:12,fontWeight:700,color:C.text,margin:"0 0 14px",paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        Staff Roster ({staff.length})
      </h3>
      {staff.length===0 ? (
        <p style={{fontSize:11,color:C.muted,margin:0}}>No staff members.</p>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
          {staff.map((s:any,i:number)=>(
            <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:11,textAlign:"center"}}>
              <Av name={s.name} size={36}/>
              <p style={{fontSize:11,fontWeight:600,color:C.text,margin:"8px 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</p>
              <p style={{fontSize:9,color:C.dim,margin:0}}>{s.role||"Staff"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentOrders({ data }: any) {
  const orders=(data?.recentOrders??[]).slice(0,10);
  if(orders.length===0) return null;
  const STATUS_C: any={delivered:C.green,cancelled:C.red,in_transit:C.blue,pending:C.amber};
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginBottom:18}}>
      <h3 style={{fontSize:12,fontWeight:700,color:C.text,margin:"0 0 14px",paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        Recent Orders
      </h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {orders.map((o:any,i:number)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 11px",background:C.bg,borderRadius:8,fontSize:11}}>
            <span style={{fontFamily:"monospace",fontWeight:700,color:C.amber,minWidth:60}}>{o.orderId}</span>
            <span style={{color:C.muted}}>{fmt(o.amount)}</span>
            <span style={{padding:"2px 8px",borderRadius:12,background:STATUS_C[o.status]+"22",color:STATUS_C[o.status],fontSize:9,fontWeight:700}}>
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DownloadReport({ data }: any) {
  const [open,setOpen]=useState(false);

  const genCsv=()=>{
    const kpi=[
      ["KPI Summary"],
      ["Total Revenue",fmt(data?.revenue)],
      ["Commission",fmt(data?.commission)],
      ["Total Orders",data?.orders??0],
      ["Delivered",data?.delivered??0],
      ["Cancelled",data?.cancelled??0],
      [],
      ["Monthly Trend"],
      ["Day","Revenue","Commission"],
      ...(data?.monthlyTrend??[]).map((m:any)=>[m.day,fmt(m.revenue),fmt(m.commission)]),
      [],
      ["Top Products"],
      ["Rank","Sales"],
      ...(data?.topProducts??[]).map((p:any,i:number)=>[i+1,p.sales]),
      [],
      ["Staff Roster"],
      ["Name","Role"],
      ...(data?.staff??[]).map((s:any)=>[s.name,s.role||"Staff"]),
      [],
      ["Recent Orders"],
      ["Order ID","Amount","Status"],
      ...(data?.recentOrders??[]).map((o:any)=>[o.orderId,fmt(o.amount),o.status]),
    ];
    const csv=kpi.map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const genTxt=()=>{
    const lines=[
      "GIMBIYA MALL - ANALYTICS REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "=== KPI SUMMARY ===",
      `Total Revenue:  ${fmt(data?.revenue)}`,
      `Commission:     ${fmt(data?.commission)}`,
      `Total Orders:   ${(data?.orders??0).toLocaleString()}`,
      `Delivered:      ${(data?.delivered??0).toLocaleString()}`,
      `Cancelled:      ${(data?.cancelled??0).toLocaleString()}`,
      "",
      "=== MONTHLY TREND (Last 10 Days) ===",
      `${"Day".padEnd(12)} | ${"Revenue".padEnd(15)} | ${"Commission".padEnd(15)}`,
      `${"-".repeat(12)}-+-${"-".repeat(15)}-+-${"-".repeat(15)}`,
      ...(data?.monthlyTrend??[]).map((m:any)=>
        `${String(m.day).padEnd(12)} | ${fmt(m.revenue).padEnd(15)} | ${fmt(m.commission).padEnd(15)}`
      ),
      "",
      "=== TOP PRODUCTS ===",
      `${"#".padEnd(3)} | ${"Sales".padEnd(10)}`,
      `${"-".repeat(3)}-+-${"-".repeat(10)}`,
      ...(data?.topProducts??[]).slice(0,10).map((p:any,i:number)=>
        `${String(i+1).padEnd(3)} | ${String((p.sales??0).toLocaleString()).padEnd(10)}`
      ),
      "",
      "=== STAFF ROSTER ===",
      `${"Name".padEnd(20)} | ${"Role".padEnd(15)}`,
      `${"-".repeat(20)}-+-${"-".repeat(15)}`,
      ...(data?.staff??[]).map((s:any)=>
        `${String((s.name??"-").slice(0,20)).padEnd(20)} | ${String((s.role||"Staff").slice(0,15)).padEnd(15)}`
      ),
      "",
      "=== END OF REPORT ===",
    ];
    const txt=lines.join("\n");
    const blob=new Blob([txt],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`analytics-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("TXT downloaded");
  };

  return (
    <div style={{position:"relative"}}>
      <button type="button" onClick={()=>setOpen(!open)}
        style={{padding:"8px 14px",background:C.amber,color:"#000",border:"none",borderRadius:8,
          cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:6,
          fontFamily:"inherit",whiteSpace:"nowrap"}}>
        <Download size={12}/> Download
        <ChevronDown size={11} style={{transform:open?"rotate(180deg)":"none",transition:"transform .15s"}}/>
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:9}}/>
          <div style={{position:"absolute",top:"100%",right:0,marginTop:6,background:C.card,
            border:`1px solid ${C.border}`,borderRadius:8,zIndex:10,minWidth:140,boxShadow:"0 4px 12px rgba(0,0,0,.3)"}}>
            <button type="button" onClick={()=>{ genCsv(); setOpen(false); }}
              style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",background:"none",border:"none",
                cursor:"pointer",fontSize:11,color:C.text,fontFamily:"inherit",borderBottom:`1px solid ${C.border}`,
                transition:"background .15s"}}>
              📊 CSV
            </button>
            <button type="button" onClick={()=>{ genTxt(); setOpen(false); }}
              style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",background:"none",border:"none",
                cursor:"pointer",fontSize:11,color:C.text,fontFamily:"inherit",
                transition:"background .15s"}}>
              📄 TXT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ManagerAnalytics() {
  const [days,setDays]=useState(30);
  const { data, isLoading }=trpc.manager?.branchAnalytics?.useQuery?.({days}) ?? { data: undefined, isLoading: false };

  const PILLS=[
    {v:7,l:"7 Days"},
    {v:14,l:"14 Days"},
    {v:30,l:"30 Days"},
    {v:90,l:"90 Days"},
    {v:365,l:"All Time"},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,
      fontFamily:"'DM Sans',system-ui,-apple-system,sans-serif"}}>

      <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <h1 style={{margin:0,fontSize:17,fontWeight:800,letterSpacing:"-.4px"}}>Branch Analytics</h1>
          <p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>Performance metrics & insights for your branch</p>
        </div>
        <span style={{padding:"4px 12px",borderRadius:20,background:C.amberB,color:C.amber,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
          <BarChart3 size={11}/> Manager Portal
        </span>
      </div>

      <div style={{padding:"20px 24px"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {PILLS.map(p=>(
              <button key={p.v} type="button" onClick={()=>setDays(p.v)}
                style={{padding:"6px 12px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",
                  border:`1px solid ${days===p.v?C.amber:C.border}`,
                  background:days===p.v?C.amberS:"transparent",
                  color:days===p.v?C.amber:C.muted,fontSize:10,fontWeight:days===p.v?700:400,
                  transition:"all .15s"}}>
                {p.l}
              </button>
            ))}
          </div>
          {data && <DownloadReport data={data}/>}
        </div>

        {isLoading ? (
          <p style={{textAlign:"center",color:C.muted,padding:"40px 20px",fontSize:13}}>Loading analytics…</p>
        ) : !data ? (
          <p style={{textAlign:"center",color:C.muted,padding:"40px 20px",fontSize:13}}>No data available.</p>
        ) : (
          <>
            {data && <KpiStrip data={data}/>}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
              {data && <RevenueTrend data={data}/>}
              {data && <OrderDonut data={data}/>}
            </div>

            {data && <TopProducts data={data}/>}
            {data && <StaffRoster data={data}/>}
            {data && <RecentOrders data={data}/>}
          </>
        )}
      </div>
    </div>
  );
}
