import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, MapPin, Phone, Package, Truck, CheckCircle, Clock, User } from "lucide-react";
import { toast } from "sonner";
// import DashboardHeader from "@/components/DashboardHeader";

export default function OrderDeliveryTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.orders.detail.useQuery({ orderId: orderId ?? "" });

  const updateMutation = trpc.delivery.updateStatus.useMutation({
    onSuccess: () => { utils.orders.detail.invalidate(); toast.success("Status updated!"); },
    onError: (e) => toast.error(e.message),
  });

  const o = order as any;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Order Details" subtitle="Track and update delivery status" /> */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/delivery/orders")} className="mb-6 gap-2 pl-0">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>

        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : !o ? (
          <Card className="border-0 shadow-md"><CardContent className="py-12 text-center"><p className="text-slate-500">Order not found</p></CardContent></Card>
        ) : (
          <div className="space-y-5">
            {/* Status Card */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Order #{o.orderId}</CardTitle>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${o.status === "delivered" ? "bg-green-100 text-green-700" : o.status === "in_transit" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                    {o.status?.replace("_", " ")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { key: "assigned", label: "Assigned", Icon: Clock },
                    { key: "in_transit", label: "In Transit", Icon: Truck },
                    { key: "delivered", label: "Delivered", Icon: CheckCircle },
                  ].map(({ key, label, Icon }) => {
                    const steps = ["assigned", "in_transit", "delivered"];
                    const currentIdx = steps.indexOf(o.status);
                    const thisIdx = steps.indexOf(key);
                    const done = thisIdx <= currentIdx;
                    return (
                      <div key={key} className={`text-center p-3 rounded-xl ${done ? "bg-blue-50" : "bg-slate-50"}`}>
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${done ? "text-blue-600" : "text-slate-300"}`} />
                        <p className={`text-xs font-medium ${done ? "text-blue-700" : "text-slate-400"}`}>{label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {o.status === "assigned" && (
                    <Button className="flex-1 gap-2" onClick={() => updateMutation.mutate({ orderId: o.orderId, status: "in_transit" })}>
                      <Truck className="w-4 h-4" /> Start Delivery
                    </Button>
                  )}
                  {o.status === "in_transit" && (
                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => updateMutation.mutate({ orderId: o.orderId, status: "delivered" })}>
                      <CheckCircle className="w-4 h-4" /> Confirm Delivery
                    </Button>
                  )}
                  {o.status === "delivered" && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-green-600 font-semibold py-2">
                      <CheckCircle className="w-5 h-5" /> Delivery Complete
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Customer</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {o.buyerId?.name && <p className="font-semibold text-slate-900">{o.buyerId.name}</p>}
                {o.buyerPhone && (
                  <a href={`tel:${o.buyerPhone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                    <Phone className="w-4 h-4" /> {o.buyerPhone}
                  </a>
                )}
                {o.shippingAddress && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{[o.shippingAddress, o.shippingCity, o.shippingState].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4" /> Items ({o.items?.length ?? 0})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(o.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{item.name ?? "Product"}</p>
                        <p className="text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₦{((item.finalPrice ?? 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total</span>
                    <span>₦{(o.totalAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}