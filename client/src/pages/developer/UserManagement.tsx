import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { Search, Users, Shield, ToggleLeft, ToggleRight, ChevronDown } from "lucide-react";

const ROLES = ["buyer", "manager", "delivery", "reader", "admin", "developer"];

const roleColor: Record<string, string> = {
  buyer: "bg-slate-100 text-slate-600",
  manager: "bg-blue-100 text-blue-700",
  delivery: "bg-amber-100 text-amber-700",
  reader: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
  developer: "bg-green-100 text-green-700",
};

export default function UserManagement() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const { data: users, isLoading } = trpc.admin.users.useQuery({ limit: 100, offset: 0, role: roleFilter || undefined });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Role updated!"); setChangingRole(null); },
    onError: (e) => toast.error(e.message),
  });

  const toggleAffiliateMutation = trpc.admin.enableAffiliate.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Affiliate status updated!"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = ((users as any[]) ?? []).filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="User Management" subtitle="Manage roles and affiliate status" /> */}
      <main className="container mx-auto px-4 py-8">

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-white text-slate-700">
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </div>

        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="py-3 px-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              <span>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user: any) => (
              <Card key={user._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{user.name ?? "—"}</p>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${roleColor[user.role] ?? "bg-slate-100 text-slate-600"}`}>{user.role}</span>
                          {user.isAffiliate && <Badge className="bg-purple-100 text-purple-700 text-xs">Affiliate</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Toggle Affiliate */}
                      {user.role === "buyer" && (
                        <Button size="sm" variant="ghost" onClick={() => toggleAffiliateMutation.mutate({ userId: user._id, enable: !user.isAffiliate })}
                          title={user.isAffiliate ? "Disable Affiliate" : "Enable Affiliate"} className="text-slate-500">
                          {user.isAffiliate ? <ToggleRight className="w-5 h-5 text-purple-600" /> : <ToggleLeft className="w-5 h-5" />}
                        </Button>
                      )}

                      {/* Role Change Dropdown */}
                      <div className="relative">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setChangingRole(changingRole === user._id ? null : user._id)}>
                          <Shield className="w-3 h-3" /> Role <ChevronDown className="w-3 h-3" />
                        </Button>
                        {changingRole === user._id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 min-w-[140px] py-1">
                            {ROLES.map((r) => (
                              <button key={r} onClick={() => updateRoleMutation.mutate({ userId: user._id, role: r })}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 capitalize ${user.role === r ? "font-bold text-blue-700" : "text-slate-700"}`}>
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}