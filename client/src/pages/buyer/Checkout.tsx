import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { CreditCard, MapPin, Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckoutSkeleton } from "@/components/BuyerSkeletons";

export default function Checkout() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<"address" | "payment" | "done">("address");

  const [addressData, setAddressData] = useState({
    fullName:  "Peter Nwosu",
    email:     "buyer@sahadstores.com",
    phone:     "+234 805 123 4567",
    address:   "45 Wuse Zone 3",
    city:      "Abuja",
    state:     "FCT",
    zipCode:   "900001",
    country:   "Nigeria",
  });

  const orderSummary = { subtotal: 28200, tax: 2115, shipping: 0, total: 30315, items: 3 };

  const [placedOrderId, setPlacedOrderId] = useState<string>("");

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Order placed successfully!");
      setPlacedOrderId(data?.orderId ?? "");
      setCurrentStep("done");
    },
    onError: (error: any) => toast.error(error.message || "Failed to place order"),
  });

  if (createOrderMutation.isPending) {
    return <CheckoutSkeleton />;
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.fullName || !addressData.address || !addressData.city) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep("payment");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      shippingAddress: addressData.address,
      shippingCity:    addressData.city,
      shippingState:   addressData.state,
      shippingCountry: addressData.country,
      buyerPhone:      addressData.phone,
    } as any);
  };

  if (currentStep === "done") {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader title="Order Confirmed" subtitle="Your order has been placed successfully" />
        <main className="container mx-auto px-4 py-12 max-w-lg text-center">
          {/* Success icon */}
          <div style={{ width: 96, height: 96, background: "#E8F5E9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <CheckCircle style={{ width: 52, height: 52, color: "#1B5E20" }} />
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Order Placed!</h2>
          <p style={{ color: "#64748b", marginBottom: 24 }}>
            Thank you for shopping at Gimbiya Mall. Your order has been confirmed and is being processed.
          </p>

          {/* Order ID card */}
          {placedOrderId && (
            <div style={{ background: "white", border: "1px solid #e2ddd4", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>Order Reference</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1A1A2E", fontFamily: "monospace" }}>{placedOrderId}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Keep this for tracking your delivery</div>
            </div>
          )}

          {/* Estimated delivery */}
          <div style={{ background: "#FFF3E0", border: "1px solid #FFE0B2", borderRadius: 12, padding: "14px 20px", marginBottom: 28, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#E65100", marginBottom: 4 }}>📦 Estimated Delivery</div>
            <div style={{ fontSize: 13, color: "#475569" }}>2 – 5 business days depending on your location</div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/orders")} style={{ background: "#1A1A2E", color: "#C8A84B", fontWeight: 700 }}>
              Track My Order
            </Button>
            <Button variant="outline" onClick={() => navigate("/mall")} style={{ fontWeight: 600 }}>
              Continue Shopping
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="Checkout" subtitle="Complete your purchase" />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === "address" && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Delivery Address</CardTitle>
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[["fullName","Full Name *"],["email","Email *"],["phone","Phone *"],["address","Street Address *"],["city","City *"],["state","State *"],["zipCode","Zip Code"]].map(([key,label]) => (
                        <div key={key} className={key === "address" ? "md:col-span-2 space-y-2" : "space-y-2"}>
                          <Label htmlFor={key}>{label}</Label>
                          <Input id={key} value={(addressData as any)[key]} onChange={e => setAddressData({...addressData,[key]:e.target.value})} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={() => navigate("/cart")}>Back to Cart</Button>
                      <Button type="submit" className="flex-1">Continue to Payment</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {currentStep === "payment" && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Payment Method</CardTitle>
                  <CardDescription>Select how you want to pay</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                      <p className="font-medium text-slate-900 mb-1">Delivering to:</p>
                      <p className="text-slate-600">{addressData.fullName} — {addressData.address}, {addressData.city}, {addressData.state}</p>
                    </div>
                    <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-3">
                        <input type="radio" id="monnify" name="payment" defaultChecked />
                        <label htmlFor="monnify" className="flex-1 cursor-pointer">
                          <p className="font-medium text-slate-900">Monnify Payment</p>
                          <p className="text-sm text-slate-600">Bank transfer · Card · USSD</p>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep("address")}>Back</Button>
                      <Button type="submit" className="flex-1" disabled={createOrderMutation.isPending}>
                        {createOrderMutation.isPending ? "Processing…" : `Pay ₦${orderSummary.total.toLocaleString()}`}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order summary sidebar */}
          <div>
            <Card className="border-0 shadow-md sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 pb-4 border-b border-slate-200">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">{orderSummary.items} items</span><span className="font-medium">₦{orderSummary.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Tax (7.5%)</span><span className="font-medium">₦{orderSummary.tax.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Shipping</span><span className="font-medium text-green-600">FREE</span></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">₦{orderSummary.total.toLocaleString()}</span>
                </div>
                <div className="space-y-2 pt-3 border-t border-slate-200 text-sm">
                  {[["1","Delivery Address",true],["2","Payment",currentStep==="payment"]].map(([n,l,done]) => (
                    <div key={n as string} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>{n}</div>
                      <span>{l as string}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
