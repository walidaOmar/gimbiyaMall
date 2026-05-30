// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, ShoppingCart, DollarSign, TrendingUp, Settings, UserCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: sales, isLoading: salesLoading } = trpc.admin.salesStats.useQuery();

  const s = stats as any;
  const sa = sales as any;
  const isLoading = statsLoading || salesLoading;

  const salesData = sa?.revenueTrend ?? [
    { month: "Jan", revenue: 0, orders: 0 },
    { month: "Feb", revenue: 0, orders: 0 },
    { month: "Mar", revenue: 0, orders: 0 },
    { month: "Apr", revenue: 0, orders: 0 },
    { month: "May", revenue: 0, orders: 0 },
    { month: "Jun", revenue: 0, orders: 0 },
  ];

  const orderStatusData = [
    { name: "Pending", value: sa?.pendingOrders ?? 0 },
    { name: "Processing", value: sa?.processingOrders ?? 0 },
    { name: "Assigned", value: sa?.assignedOrders ?? 0 },
    { name: "In Transit", value: sa?.inTransitOrders ?? 0 },
    { name: "Delivered", value: sa?.deliveredOrders ?? 0 },
    { name: "Cancelled", value: sa?.cancelledOrders ?? 0 },
  ].filter((entry) => entry.value >= 0);

  const COLORS = ["#fbbf24", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#8b5cf6"];

  const conversionRate = s?.totalUsers ? ((s.totalOrders / s.totalUsers) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader
        title="Admin Dashboard"
        subtitle="Platform overview and management"
      /> */}

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{s?.totalUsers?.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-slate-500 mt-1">Active users: {s?.activeUsers?.toLocaleString() ?? "0"}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/orders')}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{s?.totalOrders?.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-slate-500 mt-1">Delivered: {s?.deliveredOrders?.toLocaleString() ?? "0"}</p>
                </div>
                <ShoppingCart className="w-12 h-12 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">₦{(s?.totalRevenue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Paid sales trend shown below</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{conversionRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">Orders / users</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <CardTitle>Sales & Revenue Trend</CardTitle>
              <CardDescription>Last 6 months performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Pie Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Current order breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management */}
          <Card className="border-0 shadow-md">
            {/* <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage platform users and roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Active Users: <span className="font-bold text-slate-900">{s?.activeUsers?.toLocaleString() ?? "0"}</span></p>
                <p className="text-sm text-slate-600">Pending Approvals: <span className="font-bold text-slate-900">{s?.pendingApprovals?.toLocaleString() ?? "0"}</span></p>
                <p className="text-sm text-slate-600">Suspended Accounts: <span className="font-bold text-slate-900">{s?.suspendedAccounts?.toLocaleString() ?? "0"}</span></p>
              </div>
              <Button onClick={() => navigate("/admin/users")} className="w-full">
                Manage Users
              </Button>
            </CardContent> */}
          </Card>

          {/* Platform Settings */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Platform Settings
              </CardTitle>
              <CardDescription>Configure platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Commission Rates: <span className="font-bold text-slate-900">Configured</span></p>
                <p className="text-sm text-slate-600">Payment Gateway: <span className="font-bold text-slate-900">Monnify</span></p>
                <p className="text-sm text-slate-600">System Status: <span className="font-bold text-green-600">Operational</span></p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/settings") }>
                Configure Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Management
              </CardTitle>
              <CardDescription>Manage in-store staff and affiliates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Staff Roles: <span className="font-bold text-slate-900">Manager, Stock Manager, Delivery</span></p>
                <p className="text-sm text-slate-600">Affiliate Control: <span className="font-bold text-slate-900">Enabled</span></p>
                <p className="text-sm text-slate-600">Onboarding Flow: <span className="font-bold text-slate-900">Ready</span></p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/staff") }>
                Open Staff Management
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" onClick={() => navigate("/admin/orders")}>
                View Analytics
              </Button>
              <Button variant="outline">
                Generate Reports
              </Button>
              <Button variant="outline">
                System Logs
              </Button>
              <Button variant="outline">
                Help & Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
