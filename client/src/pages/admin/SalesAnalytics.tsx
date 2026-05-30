import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import DashboardHeader from "@/components/DashboardHeader";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingBag, Users, DollarSign } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SalesAnalytics() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: sales, isLoading: salesLoading } = trpc.admin.salesStats.useQuery();

  const s = stats as any;
  const sa = sales as any;

  const isLoading = statsLoading || salesLoading;

  const statCards = [
    { label: "Total Revenue", value: `₦${(sa?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: (s?.totalOrders ?? 0).toLocaleString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Users", value: (s?.totalUsers ?? 0).toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Products", value: (s?.totalProducts ?? 0).toLocaleString(), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  // Build chart data from available stats
  const ordersByStatus = [
    { name: "Pending", value: sa?.pendingOrders ?? 0 },
    { name: "Processing", value: sa?.processingOrders ?? 0 },
    { name: "Delivered", value: sa?.deliveredOrders ?? 0 },
    { name: "Cancelled", value: sa?.cancelledOrders ?? 0 },
  ].filter((d) => d.value > 0);

  const revenueTrend = sa?.revenueTrend ?? [
    { month: "Jan", revenue: 0 }, { month: "Feb", revenue: 0 }, { month: "Mar", revenue: 0 },
    { month: "Apr", revenue: 0 }, { month: "May", revenue: 0 }, { month: "Jun", revenue: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Sales Analytics" subtitle="Platform-wide revenue and order insights" /> */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                      </div>
                      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Trend */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any) => [`₦${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders by Status */}
              {ordersByStatus.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle>Orders by Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Quick Stats */}
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Platform Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Total Revenue", value: `₦${(sa?.totalRevenue ?? 0).toLocaleString()}` },
                      { label: "Total Commission", value: `₦${(sa?.totalCommission ?? 0).toLocaleString()}` },
                      { label: "Avg Order Value", value: `₦${(sa?.totalOrders > 0 ? Math.round((sa?.totalRevenue ?? 0) / sa.totalOrders) : 0).toLocaleString()}` },
                      { label: "Active Products", value: (s?.totalProducts ?? 0).toLocaleString() },
                      { label: "Registered Users", value: (s?.totalUsers ?? 0).toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-slate-600 text-sm">{label}</span>
                        <span className="font-bold text-slate-900">{value}</span>
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