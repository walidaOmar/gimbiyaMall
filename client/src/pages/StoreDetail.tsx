import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const { data: store, isLoading } = trpc.stores.detail.useQuery(
    { id: id ?? "" },
    { enabled: !!id }
  );

  console.log("trpc.stores.detail -> store:", store);

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading store...</div>;
  if (!store) return <div className="text-center py-12">Store not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/mall")} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Plaza
        </Button>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-8">
          <div className="relative h-56 bg-gradient-to-r from-amber-700 to-amber-500">
            {store.bannerImageUrl && (
              <img src={store.bannerImageUrl} alt={store.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-end p-6">
              <div>
                <h1 className="text-4xl font-bold text-white">{store.name}</h1>
                <p className="text-slate-100 mt-2">{store.description || "Welcome to our store!"}</p>
                <Badge className="mt-3">Level {store.buildingLevel}</Badge>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-600">{store.description || "Explore our best products and add them to your cart."}</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-6">✨ Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {store.products?.map((p: any) => {
            const product = {
              _id: p._id,
              name: p.name,
              description: p.description,
              finalPrice: p.finalPrice ?? p.baseSalePrice ?? 0,
              images: p.images ?? [],
              stockQuantity: p.stockQuantity ?? 0,
              arEnabled: p.arEnabled ?? false,
              limitedOffer: p.limitedOffer,
            };

            return (
              <ProductCard
                key={product._id}
                product={product}
                onClick={() => navigate(`/products/${product._id}`)}
                onAddToCart={() =>
                  addItem({
                    productId: String(product._id),
                    name: product.name,
                    price: product.finalPrice,
                    imageUrl: String(product.images?.[0] ?? ""),
                    storeId: String(store._id),
                    storeName: store.name,
                  })
                }
                isWishlisted={wishlist.isWishlisted(product._id)}
                onToggleWishlist={() => wishlist.toggleWishlist(product._id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
