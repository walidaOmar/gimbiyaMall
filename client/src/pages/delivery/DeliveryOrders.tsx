import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";
import { useLocation } from "wouter";
import { Truck, MapPin, CheckCircle, Clock, Package, ArrowRight } from "lucide-react";

const statusColor: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  in_transit: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
};

const nextStatus: Record<string, string> = {
  assigned: "in_transit",
  in_transit: "delivered",
};

const nextLabel: Record<string, string> = {
  assigned: "Mark In Transit",
  in_transit: "Mark Delivered",
};

export default function DeliveryOrders() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"all" | "assigned" | "in_transit" | "delivered">("all");

  const { data: orders, isLoading } = trpc.delivery.myOrders.useQuery({ limit: 50, offset: 0 });

  const updateMutation = trpc.delivery.updateStatus.useMutation({
    onSuccess: () => { utils.delivery.myOrders.invalidate(); toast.success("Order status updated!"); },
    onError: (e) => toast.error(e.message),
  });

  const allOrders = (orders as any[]) ?? [];
  const filtered = filter === "all" ? allOrders : allOrders.filter((o: any) => o.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
ved      <main className="container mx-auto px-4 py-8">

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(["all", "assigned", "in_transit", "delivered"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f)} className="capitalize whitespace-nowrap">
              {f === "all" ? "All Orders" : f.replace("_", " ")}
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                {f === "all" ? allOrders.length : allOrders.filter((o: any) => o.status === f).length}
              </span>
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No orders in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((order: any) => (
              <Card key={order._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${order.status === "delivered" ? "bg-green-100" : order.status === "in_transit" ? "bg-amber-100" : "bg-blue-100"}`}>
                        {order.status === "delivered" ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                          order.status === "in_transit" ? <Truck className="w-6 h-6 text-amber-600" /> :
                            <Clock className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">#{order.orderId}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusColor[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{[order.shippingAddress, order.shippingCity, order.shippingState].filter(Boolean).join(", ")}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""} • ₦{(order.totalAmount ?? 0).toLocaleString()}
                        </p>
                        {order.buyerPhone && <p className="text-sm text-slate-500">📞 {order.buyerPhone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("en-NG")}</p>
                      {nextStatus[order.status] && (
                        <Button size="sm" onClick={() => updateMutation.mutate({ orderId: order.orderId, status: nextStatus[order.status] as any })}
                          disabled={updateMutation.isPending} className="gap-1">
                          {nextLabel[order.status]} <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-slate-500 gap-1" onClick={() => navigate(`/delivery/order/${order.orderId}/track`)}>
                        View Details
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