import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, User, MapPin, Smartphone } from "lucide-react";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const utils = trpc.useUtils();
  const clearServerCart = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
  });

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data: any) => {
      clearCart();
      navigate(`/payment-success?orderId=${data.orderId}`);
    },
    onError: (error: any) => {
      alert("Payment failed: " + (error.message || "Unable to create order"));
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      navigate("/mall");
      return;
    }
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      await clearServerCart.mutateAsync();
      await Promise.all(
        items.map((item) =>
          addToCartMutation.mutateAsync({ productId: item.productId, quantity: item.quantity })
        )
      );

      await createOrder.mutateAsync({
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingState: "",
        shippingZipCode: formData.zip,
        shippingCountry: "Nigeria",
        buyerPhone: formData.email,
      });
    } catch (error: any) {
      alert(error?.message || "Could not place your order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (items.length === 0) {
    navigate("/mall");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">🧾 Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <User className="w-5 h-5" /> Personal Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5" /> Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" name="address" required value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" required value={formData.city} onChange={handleChange} />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input id="zip" name="zip" required value={formData.zip} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5" /> Payment Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" name="cardNumber" placeholder="4242 4242 4242 4242" required value={formData.cardNumber} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                        <Input id="expiry" name="expiry" placeholder="12/28" required value={formData.expiry} onChange={handleChange} />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" name="cvv" placeholder="123" required value={formData.cvv} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
                {isProcessing ? "Processing Payment..." : `Pay ₦${(totalPrice * 1.1).toFixed(2)}`}
              </Button>
            </form>
          </div>

          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <Separator className="my-4" />
                <div className="space-y-2 max-h-64 overflow-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₦{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>₦{(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{(totalPrice * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
