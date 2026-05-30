import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function Cart() {
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "Premium Wireless Headphones",
      price: 8500,
      quantity: 1,
      image: "🎧",
    },
    {
      id: "2",
      name: "USB-C Fast Charger",
      price: 3200,
      quantity: 2,
      image: "🔌",
    },
    {
      id: "3",
      name: "Phone Screen Protector",
      price: 1500,
      quantity: 3,
      image: "📱",
    },
  ]);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
    toast.success("Item removed from cart");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.075); // 7.5% tax
  const shipping = subtotal > 50000 ? 0 : 2000; // Free shipping over 50k
  const total = subtotal + tax + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardHeader title="Shopping Cart" subtitle="Review your items" />
        <main className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-md">
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Cart is Empty</h3>
                <p className="text-slate-600 mb-6">Add items to get started</p>
                <Button onClick={() => navigate("/mall")} size="lg">
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader title="Shopping Cart" subtitle={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{item.image}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-600">₦{item.price.toLocaleString()}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-slate-900">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="border-0 shadow-md sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 pb-4 border-b border-slate-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (7.5%)</span>
                    <span className="font-medium">₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₦${shipping.toLocaleString()}`
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">₦{total.toLocaleString()}</span>
                </div>

                {shipping === 0 && (
                  <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✓ Free shipping applied!
                  </p>
                )}

                <Button
                  onClick={() => navigate("/checkout")}
                  className="w-full h-12 text-base"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Proceed to Checkout
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/mall")}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Have a Promo Code?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="Enter promo code" />
                <Button variant="outline" className="w-full">
                  Apply Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
