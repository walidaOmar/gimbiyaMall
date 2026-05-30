import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const [, navigate] = useLocation();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-96 text-center p-8">
          <ShoppingBag className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-slate-500 mt-2">Browse stores and add some items!</p>
          <Button className="mt-6" onClick={() => navigate("/mall")}>Continue Shopping</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">🛒 Your Cart ({totalItems} items)</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.productId} className="overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-2xl">🛍️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-xs text-slate-500">{item.storeName}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg">Order Summary</h3>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₦{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>₦{(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₦{(totalPrice * 1.1).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => navigate("/checkout")}>Proceed to Checkout</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
