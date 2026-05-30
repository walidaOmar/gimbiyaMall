// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Package, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ManagerDashboard() {
  const [, navigate] = useLocation();
  const summaryQuery = trpc.inventory.summary.useQuery();
  const weeklySalesQuery = trpc.inventory.weeklySales.useQuery();
  const productsQuery = trpc.products.listAll.useQuery({ limit: 12, offset: 0 });

  const summary = summaryQuery.data as any;
  const weeklySales = weeklySalesQuery.data as any;
  const products = productsQuery.data as any[] ?? [];
  const isLoading = summaryQuery.isLoading || weeklySalesQuery.isLoading || productsQuery.isLoading;

  const inventoryData = products.map((product) => ({
    product: product.name ?? "Unnamed",
    stock: product.stockQuantity ?? 0,
    sold: product.soldQuantity ?? 0,
  })).slice(0, 8);

  const salesData = weeklySales?.trend ?? [{ day: "Mon", revenue: 0 }, { day: "Tue", revenue: 0 }, { day: "Wed", revenue: 0 }, { day: "Thu", revenue: 0 }, { day: "Fri", revenue: 0 }, { day: "Sat", revenue: 0 }, { day: "Sun", revenue: 0 }];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader
        title="Store Manager Dashboard"
        subtitle="Manage products and inventory"
      /> */}

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{summary?.totalProducts?.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-slate-500 mt-1">Active: {summary?.activeProducts?.toLocaleString() ?? "0"}</p>
                </div>
                <Package className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{summary?.lowStockItems?.toLocaleString() ?? "0"}</p>
                  <p className="text-xs text-red-600 mt-1">Items below threshold</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">₦{(weeklySales?.totalRevenue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">{weeklySales?.totalOrders ?? 0} orders in 7 days</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Stock levels by product</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" fill="#3b82f6" />
                  <Bar dataKey="sold" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Weekly Sales Trend</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [`₦${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Add, edit, or remove products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Active Products: <span className="font-bold">{summary?.activeProducts ?? 0}</span></p>
                <p className="text-sm text-slate-600">Inactive Products: <span className="font-bold">{(summary?.totalProducts ?? 0) - (summary?.activeProducts ?? 0)}</span></p>
              </div>
              <Button onClick={() => navigate("/manager/products")} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Manage Products
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Monitor and adjust stock levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Total Stock Value: <span className="font-bold">₦{(summary?.totalStockValue ?? 0).toLocaleString()}</span></p>
                <p className="text-sm text-slate-600">Items Below Threshold: <span className="font-bold text-red-600">{summary?.lowStockItems ?? 0}</span></p>
              </div>
              <Button onClick={() => navigate("/manager/inventory")} variant="outline" className="w-full">
                View Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Manager Tools</CardTitle>
              <CardDescription>Go directly to analytics, onboarding, and order assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-600">Quick access to your manager workflows.</p>
              </div>
              <div className="space-y-3">
                <Button onClick={() => navigate("/manager/analytics")} className="w-full">
                  View Analytics
                </Button>
                <Button onClick={() => navigate("/manager/onboarding")} variant="outline" className="w-full">
                  Staff Onboarding
                </Button>
                <Button onClick={() => navigate("/manager/orders")} variant="outline" className="w-full">
                  Order Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => navigate("/manager/orders")}
            className="group flex items-center justify-between rounded-2xl border border-amber-300/30 bg-slate-950 px-6 py-5 text-left transition hover:shadow-lg"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/15 border border-amber-300/40">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                  <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-400">Order Assignment</p>
                <p className="text-xs text-slate-400">Assign riders · Track live deliveries</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => navigate("/manager/onboarding")}
            className="group flex items-center justify-between rounded-2xl border border-violet-300/30 bg-slate-950 px-6 py-5 text-left transition hover:shadow-lg"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100/15 border border-violet-300/40">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-300">Staff Onboarding</p>
                <p className="text-xs text-slate-400">Submit staff requests to admin</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => navigate("/manager/analytics")}
            className="group flex items-center justify-between rounded-2xl border border-emerald-300/30 bg-slate-950 px-6 py-5 text-left transition hover:shadow-lg"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100/15 border border-emerald-300/40">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                  <line x1="2" y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Branch Analytics</p>
                <p className="text-xs text-slate-400">Revenue · Reports · Download CSV</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
