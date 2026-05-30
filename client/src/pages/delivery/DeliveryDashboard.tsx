// import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Truck, MapPin, CheckCircle, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function DeliveryDashboard() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const ordersQuery = trpc.delivery.myOrders.useQuery({ limit: 200, offset: 0 }, { retry: false });
  const orders = (ordersQuery?.data as any[]) ?? [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const assignedToday = orders.filter((o: any) => o.status === 'assigned' && new Date(o.createdAt) >= startOfToday).length;
  const inTransitCount = orders.filter((o: any) => o.status === 'in_transit').length;
  const completedThisWeek = orders.filter((o: any) => o.status === 'delivered' && new Date(o.createdAt) >= startOfWeek).length;
  const pendingCount = orders.filter((o: any) => o.status === 'pending').length;

  // Earnings: sum commissionAmount for orders (paid)
  const todaysEarnings = orders
    .filter((o: any) => new Date(o.createdAt) >= startOfToday && o.paymentStatus === 'paid')
    .reduce((s: number, o: any) => s + (o.commissionAmount ?? 0), 0);
  const weekEarnings = orders
    .filter((o: any) => new Date(o.createdAt) >= startOfWeek && o.paymentStatus === 'paid')
    .reduce((s: number, o: any) => s + (o.commissionAmount ?? 0), 0);

  const refresh = () => {
    ordersQuery?.refetch?.();
    utils.delivery.myOrders.invalidate();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader
        title="Delivery Dashboard"
        subtitle="Manage your deliveries and track orders"
      /> */}

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={refresh} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Assigned Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">12</p>
                  <p className="text-xs text-blue-600 mt-1">Today</p>
                </div>
                <Truck className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">5</p>
                  <p className="text-xs text-amber-600 mt-1">Active</p>
                </div>
                <MapPin className="w-12 h-12 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">7</p>
                  <p className="text-xs text-green-600 mt-1">This week</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">3</p>
                  <p className="text-xs text-slate-600 mt-1">Awaiting pickup</p>
                </div>
                <Clock className="w-12 h-12 text-slate-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Active Deliveries</CardTitle>
              <CardDescription>Orders currently in transit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.filter((o: any) => o.status === 'in_transit').slice(0,5).map((o: any) => (
                  <div key={o._id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">#{o.orderId}</p>
                    <p className="text-sm text-slate-600">Destination: {[o.shippingAddress, o.shippingCity, o.shippingState].filter(Boolean).join(', ')}</p>
                    <p className="text-sm text-amber-600">In Transit</p>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/delivery/order/${o.orderId}/track`)} className="gap-2">
                        Track <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/delivery/orders")} className="w-full mt-4">
                View All Orders
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>Delivery commissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Today's Earnings</p>
                  <p className="text-2xl font-bold text-green-600">₦{todaysEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">This Week</p>
                  <p className="text-2xl font-bold text-slate-900">₦{weekEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <button
          onClick={() => navigate("/delivery/fulfillment")}
          style={{
            width: "100%", marginTop: 8, display: "flex", alignItems: "center",
            justifyContent: "space-between", background: "#0f172a",
            border: "1.5px solid rgba(16,185,129,0.3)", borderRadius: 14,
            padding: "20px 24px", cursor: "pointer", textAlign: "left",
            fontFamily: "inherit", boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            transition: "opacity .15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: "rgba(16,185,129,0.12)", border: "1.5px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#10b981" }}>
                Fulfillment Dashboard
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Accept orders · Get Fulfillment ID · Submit delivery proof & signature
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: "rgba(16,185,129,0.12)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.3)", whiteSpace: "nowrap",
            }}>
              Open Dashboard
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>

      </main>
    </div>
  );
}
