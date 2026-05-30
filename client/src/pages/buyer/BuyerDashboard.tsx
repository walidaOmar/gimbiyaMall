import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { BuyerDashboardSkeleton } from "@/components/BuyerSkeletons";

export default function BuyerDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const wishlist = useWishlist();
  const ordersQuery = trpc.orders.list.useQuery({ limit: 100, offset: 0 });
  const orders: any[] = ordersQuery.data ?? [];

  const totalOrders = orders.length;
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.finalAmount ?? order.totalAmount ?? 0),
    0,
  );
  const loyaltyPoints = Math.floor(totalSpent / 1000);

  useEffect(() => {
    const myElement = document.getElementById('myElement');
    if (!myElement) return;

    const handleMouseEnter = () => {
      myElement.style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      myElement.style.cursor = 'default';
    };

    myElement.addEventListener('mouseenter', handleMouseEnter);
    myElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      myElement.removeEventListener('mouseenter', handleMouseEnter);
      myElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (ordersQuery.isLoading) {
    return <BuyerDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* <DashboardHeader
        title="Buyer Dashboard"
        subtitle={`Welcome back${user?.name ? `, ${user.name}` : ""}. Start shopping in the mall.`}
      /> */}

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div id="myElement" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {totalOrders}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">All time</p>
                </div>
                <ShoppingBag className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {`₦${totalSpent.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Lifetime</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Saved Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{wishlist.count}</p>
                  <p className="text-xs text-slate-600 mt-1">In wishlist</p>
                </div>
                <Heart className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-600">Loyalty Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{loyaltyPoints}</p>
                  <p className="text-xs text-slate-600 mt-1">Points earned</p>
                </div>
                <Star className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Browse the Mall</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Explore stores and add products to your cart.</p>
              <Button className="w-full" onClick={() => navigate("/mall")}>Shop the Mall</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>My Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-900 text-3xl font-bold">{totalItems}</p>
              <p className="text-sm text-slate-500">Items waiting in cart</p>
              <Button className="w-full" variant="outline" onClick={() => navigate("/cart")}>View Cart</Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">See all your orders and track deliveries.</p>
              <Button className="w-full" variant="outline" onClick={() => navigate("/orders")}>View Orders</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
