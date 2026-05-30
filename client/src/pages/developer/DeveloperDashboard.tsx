import { useState } from "react";
// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Users, Store, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:         { bg: "#E3F2FD", color: "#0D47A1" },
  manager:       { bg: "#FFF3E0", color: "#E65100" },
  stock_manager: { bg: "#E8F5E9", color: "#1B5E20" },
  delivery:      { bg: "#F3E5F5", color: "#6A1B9A" },
  developer:     { bg: "#FCE4EC", color: "#880E4F" },
};

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] ?? { bg: "#f1f5f9", color: "#475569" };
  return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color }}>{role.replace("_", " ").toUpperCase()}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: active ? "#E8F5E9" : "#FFEBEE", color: active ? "#1B5E20" : "#B71C1C" }}>{active ? "ACTIVE" : "INACTIVE"}</span>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}{required && <span style={{ color: "#B71C1C" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const IS = { border: "1px solid #e2ddd4", borderRadius: 8, fontSize: 13, height: 38 };
const SS: React.CSSProperties = { border: "1px solid #e2ddd4", borderRadius: 8, fontSize: 13, height: 38, padding: "0 10px", width: "100%", background: "white" };

function StatCard({ title, value, sub }: { title: string; value: number | string; sub?: string }) {
  return (
    <Card style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,.07)", borderRadius: 12 }}>
      <CardHeader style={{ paddingBottom: 6 }}>
        <CardTitle style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".07em" }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: 32, fontWeight: 800, color: "#1A1A2E" }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DeveloperDashboard() {
  const storesQ   = (trpc as any).developer?.stores?.list?.useQuery();
  const branchesQ = (trpc as any).developer?.branches?.list?.useQuery();
  const usersQ    = (trpc as any).developer?.users?.list?.useQuery({ limit: 50, offset: 0 });
  const statsQ    = (trpc as any).developer?.platformStats?.useQuery();

  const stores:   any[] = storesQ?.data   ?? [];
  const branches: any[] = branchesQ?.data ?? [];
  const users:    any[] = usersQ?.data    ?? [];
  const stats:    any   = statsQ?.data    ?? {};

  const createStoreMut  = (trpc as any).developer?.stores?.create?.useMutation?.({ onSuccess: () => { toast.success("Store created!"); setStoreOpen(false); resetStore(); }, onError: (e: any) => toast.error(e.message) });
  const toggleStoreMut  = (trpc as any).developer?.stores?.toggle?.useMutation?.({ onSuccess: () => toast.success("Updated") });
  const createBranchMut = (trpc as any).developer?.branches?.create?.useMutation?.({ onSuccess: () => { toast.success("Branch created!"); setBranchOpen(false); resetBranch(); }, onError: (e: any) => toast.error(e.message) });
  const toggleBranchMut = (trpc as any).developer?.branches?.toggle?.useMutation?.({ onSuccess: () => toast.success("Updated") });
  const createUserMut   = (trpc as any).developer?.users?.create?.useMutation?.({ onSuccess: () => { toast.success("Staff account created!"); setUserOpen(false); resetUser(); }, onError: (e: any) => toast.error(e.message) });
  const toggleUserMut   = (trpc as any).developer?.users?.toggle?.useMutation?.({ onSuccess: () => toast.success("Updated") });

  const [storeOpen,  setStoreOpen]  = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);

  const [sf, setSf] = useState({ adminName: "", adminEmail: "", adminPassword: "", storeName: "", phone: "" });
  const [bf, setBf] = useState({ managerName: "", managerEmail: "", managerPassword: "", city: "", state: "", phone: "" });
  const [uf, setUf] = useState({ name: "", email: "", password: "", role: "manager" as string, city: "", state: "" });

  const resetStore  = () => setSf({ adminName: "", adminEmail: "", adminPassword: "", storeName: "", phone: "" });
  const resetBranch = () => setBf({ managerName: "", managerEmail: "", managerPassword: "", city: "", state: "", phone: "" });
  const resetUser   = () => setUf({ name: "", email: "", password: "", role: "manager", city: "", state: "" });

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", background: "#f8f6f0", minHeight: "100vh" }}>
      {/* <DashboardHeader title="Developer Dashboard" subtitle="Gimbiya Mall — Platform Architecture" role="developer" /> */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
          <StatCard title="Stores"  value={stores.length}   sub={`${stores.filter((s:any)=>s.isActive).length} active`} />
          <StatCard title="Branches" value={branches.length} sub={`${branches.filter((b:any)=>b.isActive).length} active`} />
          <StatCard title="Staff"   value={users.length}    sub="All roles" />
          <StatCard title="Orders"  value={stats.totalOrders ?? "—"} sub="Platform total" />
        </div>

        <Tabs defaultValue="stores">
          <TabsList style={{ background: "white", border: "1px solid #e2ddd4", borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <TabsTrigger value="stores"   style={{ borderRadius: 7, fontSize: 13, fontWeight: 600 }}>🏪 Stores ({stores.length})</TabsTrigger>
            <TabsTrigger value="branches" style={{ borderRadius: 7, fontSize: 13, fontWeight: 600 }}>📍 Branches ({branches.length})</TabsTrigger>
            <TabsTrigger value="staff"    style={{ borderRadius: 7, fontSize: 13, fontWeight: 600 }}>👥 Staff ({users.length})</TabsTrigger>
          </TabsList>

          {/* STORES */}
          <TabsContent value="stores">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Dialog open={storeOpen} onOpenChange={setStoreOpen}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#1A1A2E", color: "#C8A84B", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Create Store</Button>
                </DialogTrigger>
                <DialogContent style={{ fontFamily: "inherit" }}>
                  <DialogHeader><DialogTitle>Create New Store</DialogTitle><DialogDescription>Creates an Admin account for the store owner.</DialogDescription></DialogHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                    <Field label="Store Name" required><Input style={IS} placeholder="e.g. Abuja Central Store" value={sf.storeName} onChange={e => setSf(f=>({...f,storeName:e.target.value}))} /></Field>
                    <Field label="Admin Full Name" required><Input style={IS} placeholder="e.g. Ahmed Hassan" value={sf.adminName} onChange={e => setSf(f=>({...f,adminName:e.target.value}))} /></Field>
                    <Field label="Admin Email" required><Input style={IS} type="email" placeholder="admin@store.com" value={sf.adminEmail} onChange={e => setSf(f=>({...f,adminEmail:e.target.value}))} /></Field>
                    <Field label="Password" required><Input style={IS} type="password" placeholder="Min. 8 chars" value={sf.adminPassword} onChange={e => setSf(f=>({...f,adminPassword:e.target.value}))} /></Field>
                    <Field label="Phone"><Input style={IS} placeholder="+234 801 234 5678" value={sf.phone} onChange={e => setSf(f=>({...f,phone:e.target.value}))} /></Field>
                    <Button onClick={() => { if(!sf.adminName||!sf.adminEmail||!sf.adminPassword||!sf.storeName) return toast.error("Fill all required fields"); createStoreMut?.mutateAsync(sf); }} disabled={createStoreMut?.isPending} style={{ background: "#C8A84B", color: "#1A1A2E", fontWeight: 700 }}>
                      {createStoreMut?.isPending ? <Loader2 size={15} /> : "Create Store"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stores.map((store: any) => (
                <div key={store.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e2ddd4", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "#E3F2FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Store size={22} color="#0D47A1" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{store.storeName}</span>
                      <StatusBadge active={store.isActive} />
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{store.storeCode}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Admin: <strong>{store.adminName}</strong> · {store.adminEmail}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Created {formatDate(store.createdDate)}</div>
                  </div>
                  <button onClick={() => toggleStoreMut?.mutateAsync({ adminId: store.id, isActive: !store.isActive })} style={{ background: "none", border: "none", cursor: "pointer", color: store.isActive ? "#B71C1C" : "#1B5E20", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {store.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {store.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* BRANCHES */}
          <TabsContent value="branches">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Dialog open={branchOpen} onOpenChange={setBranchOpen}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#1A1A2E", color: "#C8A84B", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Create Branch</Button>
                </DialogTrigger>
                <DialogContent style={{ fontFamily: "inherit" }}>
                  <DialogHeader><DialogTitle>Create New Branch</DialogTitle><DialogDescription>Creates a Manager account for this branch.</DialogDescription></DialogHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                    <Field label="Manager Full Name" required><Input style={IS} placeholder="e.g. Chioma Okafor" value={bf.managerName} onChange={e => setBf(f=>({...f,managerName:e.target.value}))} /></Field>
                    <Field label="Manager Email" required><Input style={IS} type="email" placeholder="manager@store.com" value={bf.managerEmail} onChange={e => setBf(f=>({...f,managerEmail:e.target.value}))} /></Field>
                    <Field label="Password" required><Input style={IS} type="password" placeholder="Min. 8 chars" value={bf.managerPassword} onChange={e => setBf(f=>({...f,managerPassword:e.target.value}))} /></Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="City"><Input style={IS} placeholder="e.g. Abuja" value={bf.city} onChange={e => setBf(f=>({...f,city:e.target.value}))} /></Field>
                      <Field label="State"><Input style={IS} placeholder="e.g. FCT" value={bf.state} onChange={e => setBf(f=>({...f,state:e.target.value}))} /></Field>
                    </div>
                    <Field label="Phone"><Input style={IS} placeholder="+234 801 234 5678" value={bf.phone} onChange={e => setBf(f=>({...f,phone:e.target.value}))} /></Field>
                    <Button onClick={() => { if(!bf.managerName||!bf.managerEmail||!bf.managerPassword) return toast.error("Fill all required fields"); createBranchMut?.mutateAsync(bf); }} disabled={createBranchMut?.isPending} style={{ background: "#C8A84B", color: "#1A1A2E", fontWeight: 700 }}>
                      {createBranchMut?.isPending ? <Loader2 size={15} /> : "Create Branch"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {branches.map((branch: any) => (
                <div key={branch.id} style={{ background: "white", borderRadius: 12, border: "1px solid #e2ddd4", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={22} color="#E65100" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{branch.city} Branch</span>
                      <StatusBadge active={branch.isActive} />
                      <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{branch.branchCode}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Manager: <strong>{branch.managerName}</strong> · {branch.email}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{branch.city}, {branch.state} · Created {formatDate(branch.createdDate)}</div>
                  </div>
                  <button onClick={() => toggleBranchMut?.mutateAsync({ managerId: branch.id, isActive: !branch.isActive })} style={{ background: "none", border: "none", cursor: "pointer", color: branch.isActive ? "#B71C1C" : "#1B5E20", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {branch.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} {branch.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* STAFF */}
          <TabsContent value="staff">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Dialog open={userOpen} onOpenChange={setUserOpen}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#1A1A2E", color: "#C8A84B", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} /> Onboard Staff</Button>
                </DialogTrigger>
                <DialogContent style={{ fontFamily: "inherit" }}>
                  <DialogHeader><DialogTitle>Onboard New Staff</DialogTitle><DialogDescription>Create a staff account with the selected role.</DialogDescription></DialogHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                    <Field label="Role" required>
                      <select style={SS} value={uf.role} onChange={e => setUf(f=>({...f,role:e.target.value}))}>
                        <option value="admin">Admin (Store Owner)</option>
                        <option value="manager">Manager (Branch Manager)</option>
                        <option value="stock_manager">Stock Manager</option>
                        <option value="delivery">Delivery Rider</option>
                      </select>
                    </Field>
                    <Field label="Full Name" required><Input style={IS} placeholder="e.g. Emeka Nwosu" value={uf.name} onChange={e => setUf(f=>({...f,name:e.target.value}))} /></Field>
                    <Field label="Email" required><Input style={IS} type="email" placeholder="staff@gimbiya.com" value={uf.email} onChange={e => setUf(f=>({...f,email:e.target.value}))} /></Field>
                    <Field label="Password" required><Input style={IS} type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" value={uf.password} onChange={e => setUf(f=>({...f,password:e.target.value}))} /></Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Field label="City"><Input style={IS} placeholder="e.g. Lagos" value={uf.city} onChange={e => setUf(f=>({...f,city:e.target.value}))} /></Field>
                      <Field label="State"><Input style={IS} placeholder="e.g. Lagos" value={uf.state} onChange={e => setUf(f=>({...f,state:e.target.value}))} /></Field>
                    </div>
                    <Button onClick={() => { if(!uf.name||!uf.email||!uf.password) return toast.error("Fill all required fields"); createUserMut?.mutateAsync(uf); }} disabled={createUserMut?.isPending} style={{ background: "#C8A84B", color: "#1A1A2E", fontWeight: 700 }}>
                      {createUserMut?.isPending ? <Loader2 size={15} /> : "Create Staff Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2ddd4", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2ddd4", background: "#1A1A2E" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#C8A84B", display: "flex", alignItems: "center", gap: 8 }}><Users size={16} /> All Staff ({users.length})</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f6f0" }}>
                    {["Name","Email","Role","Location","Status","Joined","Action"].map(h=>(
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any, i: number) => (
                    <tr key={user._id} style={{ borderTop: "1px solid #f1ede6", background: i%2===0?"white":"#fdfaf6" }}>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{user.name}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{user.email}</td>
                      <td style={{ padding: "11px 14px" }}><RoleBadge role={user.role} /></td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748b" }}>{user.city?`${user.city}, ${user.state}`:"—"}</td>
                      <td style={{ padding: "11px 14px" }}><StatusBadge active={user.isActive} /></td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#94a3b8" }}>{formatDate(user.createdAt)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <button onClick={() => toggleUserMut?.mutateAsync({ userId: user._id, isActive: !user.isActive })} style={{ fontSize: 11, fontWeight: 700, background: "none", border: `1px solid ${user.isActive?"#ffcdd2":"#c8e6c9"}`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", color: user.isActive?"#B71C1C":"#1B5E20" }}>
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
