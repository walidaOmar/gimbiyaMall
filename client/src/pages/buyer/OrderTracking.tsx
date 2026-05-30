import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Package, CheckCircle, Truck, MapPin, Clock, XCircle } from "lucide-react";
import { OrderTrackingSkeleton } from "@/components/BuyerSkeletons";
// import DashboardHeader from "@/components/DashboardHeader";

const steps = [
  { key: "pending", label: "Order Placed", icon: Clock, desc: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, desc: "Order confirmed by store" },
  { key: "processing", label: "Processing", icon: Package, desc: "Being prepared for shipment" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "On its way to you" },
  { key: "delivered", label: "Delivered", icon: MapPin, desc: "Successfully delivered" },
];

const stepOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, navigate] = useLocation();
  const { data: order, isLoading } = trpc.orders.detail.useQuery({ orderId: orderId ?? "" });

  const currentStep = stepOrder.indexOf((order as any)?.status ?? "pending");

  if (isLoading) {
    return <OrderTrackingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader title="Order Tracking" subtitle="Real-time status of your order" /> */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/orders")} className="mb-6 gap-2 pl-0">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>

        {!order ? (
          <Card className="border-0 shadow-md"><CardContent className="py-12 text-center"><p className="text-slate-500">Order not found.</p></CardContent></Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order #{(order as any).orderId}</CardTitle>
                  {(order as any).status === "cancelled" ? (
                    <span className="flex items-center gap-1 text-sm text-red-600 font-semibold"><XCircle className="w-4 h-4" /> Cancelled</span>
                  ) : (
                    <Badge className="capitalize bg-blue-100 text-blue-700">{(order as any).status}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-1">Placed on {new Date((order as any).createdAt).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <p className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900">₦{((order as any).totalAmount ?? 0).toLocaleString()}</span></p>
              </CardContent>
            </Card>

            {(order as any).status !== "cancelled" && (
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Delivery Progress</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative">
                    {steps.map((step, index) => {
                      const done = index <= currentStep;
                      const active = index === currentStep;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex gap-4 pb-6 last:pb-0 relative">
                          {index < steps.length - 1 && (
                            <div className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${done ? "bg-blue-400" : "bg-slate-200"}`} />
                          )}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${done ? (active ? "bg-blue-600 shadow-lg shadow-blue-200" : "bg-blue-500") : "bg-slate-200"}`}>
                            <Icon className={`w-5 h-5 ${done ? "text-white" : "text-slate-400"}`} />
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-semibold text-sm ${done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                            <p className={`text-xs ${done ? "text-slate-500" : "text-slate-400"}`}>{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {(order as any).deliveryAddress && (
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{(order as any).deliveryAddress.name}</p>
                      <p className="text-sm text-slate-600">{(order as any).deliveryAddress.address}</p>
                      <p className="text-sm text-slate-600">{(order as any).deliveryAddress.city}, {(order as any).deliveryAddress.state}</p>
                      <p className="text-sm text-slate-600">{(order as any).deliveryAddress.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((order as any).items ?? []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{item.productName ?? "Product"}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">₦{((item.price ?? 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}