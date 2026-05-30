import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import DashboardHeader from "@/components/DashboardHeader";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Database, Users, ShoppingBag, TrendingUp, DollarSign, Package, Cpu } from "lucide-react";

export default function PlatformAnalytics() {
  const { data: stats, isLoading: sl } = trpc.developer.platformStats.useQuery();
  const { data: sales, isLoading: ssl } = trpc.developer.salesStats.useQuery();

  const s = stats as any;
  const sa = sales as any;
  const isLoading = sl || ssl;

  const revenueTrend = sa?.revenueTrend ?? Array.from({ length: 6 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i], revenue: 0,
  }));

  const systemMetrics = [
    { label: "Total Users", value: (s?.totalUsers ?? 0).toLocaleString(), icon: Users, color: "blue" },
    { label: "Total Orders", value: (s?.totalOrders ?? 0).toLocaleString(), icon: ShoppingBag, color: "green" },
    { label: "Active Products", value: (s?.totalProducts ?? 0).toLocaleString(), icon: Package, color: "amber" },
    { label: "Total Revenue", value: `₦${(sa?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "emerald" },
    { label: "Total Commission", value: `₦${(sa?.totalCommission ?? 0).toLocaleString()}`, icon: TrendingUp, color: "purple" },
    { label: "Delivered Orders", value: (sa?.deliveredOrders ?? 0).toLocaleString(), icon: Activity, color: "indigo" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600", emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600", indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Platform Analytics" subtitle="Full-system performance and revenue insights" /> */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            {/* System health badge */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Cpu className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">System operational — all services running normally</span>
              <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {systemMetrics.map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Revenue Over Time</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Order Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[
                      { status: "Pending", count: sa?.pendingOrders ?? 0 },
                      { status: "Processing", count: sa?.processingOrders ?? 0 },
                      { status: "Delivered", count: sa?.deliveredOrders ?? 0 },
                      { status: "Cancelled", count: sa?.cancelledOrders ?? 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Gross Revenue", value: `₦${(sa?.totalRevenue ?? 0).toLocaleString()}`, highlight: true },
                      { label: "Commission Distributed", value: `₦${(sa?.totalCommission ?? 0).toLocaleString()}` },
                      { label: "Net Revenue", value: `₦${((sa?.totalRevenue ?? 0) - (sa?.totalCommission ?? 0)).toLocaleString()}`, highlight: true },
                      { label: "Avg Order Value", value: `₦${(s?.totalOrders > 0 ? Math.round((sa?.totalRevenue ?? 0) / s.totalOrders) : 0).toLocaleString()}` },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className={`flex justify-between items-center py-2.5 border-b last:border-0 ${highlight ? "font-semibold" : ""}`}>
                        <span className={highlight ? "text-slate-900" : "text-slate-600 text-sm"}>{label}</span>
                        <span className={highlight ? "text-indigo-700 text-lg" : "text-slate-900"}>{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}