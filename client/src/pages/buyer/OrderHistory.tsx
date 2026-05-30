import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Package, ArrowRight, ShoppingBag } from "lucide-react";
import { BuyerOrderHistorySkeleton } from "@/components/BuyerSkeletons";
// import DashboardHeader from "@/components/DashboardHeader";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrderHistory() {
  const [, navigate] = useLocation();
  const { data: orders, isLoading } = trpc.orders.list.useQuery({ limit: 50, offset: 0 });

  if (isLoading) {
    return <BuyerOrderHistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Order History" subtitle="Track all your past and current orders" /> */}
      <main className="container mx-auto px-4 py-8">
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No orders yet</h2>
            <p className="text-slate-500 mb-6">Start shopping to see your orders here.</p>
            <Button onClick={() => navigate("/mall")}>Browse Products</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(orders as any[]).map((order: any) => (
              <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/order/${order.orderId}/track`)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Order #{order.orderId}</p>
                        <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
                        <p className="text-sm text-slate-600 mt-1">{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColor[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {order.status}
                      </span>
                      <p className="font-bold text-slate-900">₦{(order.totalAmount ?? 0).toLocaleString()}</p>
                      <Button size="sm" variant="ghost" className="gap-1 text-blue-600">
                        Track <ArrowRight className="w-3 h-3" />
                      </Button>
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