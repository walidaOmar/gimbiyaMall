import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";
import { ShoppingCartSkeleton } from "@/components/BuyerSkeletons";

export default function ShoppingCartPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.list.useQuery();

  const updateQtyMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => { utils.cart.list.invalidate(); toast.success("Item removed"); },
    onError: (e) => toast.error(e.message),
  });

  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => utils.cart.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const items: any[] = (cartItems as any[]) ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.productId?.finalPrice ?? 0) * item.quantity, 0);
  const shipping = subtotal > 50000 ? 0 : 2000;
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + shipping + tax;

  if (isLoading) return <ShoppingCartSkeleton />;

  if (items.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/mall")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Button>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-8">Explore our products and add items to get started.</p>
          <Button onClick={() => navigate("/mall")} size="lg" className="gap-2">
            <Package className="w-5 h-5" /> Browse Products
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate("/mall")} className="mb-2 gap-2 pl-0">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="text-slate-500">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <Button
            variant="ghost"
            className="text-red-500 hover:bg-red-50"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
          >
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              const product = item.productId ?? {};
              return (
                <Card key={item._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {product.images?.[0]
                          ? <img src={product.images[0]} className="w-full h-full object-cover rounded-xl" alt="" />
                          : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{product.name ?? "Product"}</h3>
                        <p className="text-sm text-slate-500">{product.categoryId?.name ?? ""}</p>
                        <p className="font-bold text-blue-600 mt-1">
                          ₦{((product.finalPrice ?? 0) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button
                          onClick={() => removeMutation.mutate({ cartItemId: item._id })}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQtyMutation.mutate({ cartItemId: item._id, quantity: item.quantity - 1 })}
                            className="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50"
                            disabled={item.quantity <= 1 || updateQtyMutation.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 py-1.5 font-semibold text-sm border-x border-slate-200 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQtyMutation.mutate({ cartItemId: item._id, quantity: item.quantity + 1 })}
                            className="px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50"
                            disabled={updateQtyMutation.isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-0 shadow-md sticky top-4">
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? <Badge variant="secondary">Free</Badge> : `₦${shipping.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (7.5%)</span><span>₦{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>Total</span><span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
                {subtotal < 50000 && (
                  <p className="bg-blue-50 text-blue-700 text-xs rounded-lg p-3">
                    Add ₦{(50000 - subtotal).toLocaleString()} more for free shipping!
                  </p>
                )}
                <Button className="w-full gap-2" size="lg" onClick={() => navigate("/checkout")}>
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}