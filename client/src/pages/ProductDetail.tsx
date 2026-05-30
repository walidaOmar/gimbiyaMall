import { useParams, useLocation } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Sparkles, Tag, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const productId = params.id;

  const { data: product, isLoading } = trpc.products.detail.useQuery({ id: productId });

  const savings = useMemo(() => {
    if (!product) return 0;
    return Math.max(0, product.baseSalePrice - product.finalPrice);
  }, [product]);

  if (!product && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-slate-600">Product not found.</p>
        <Button className="mt-6" onClick={() => navigate("/mall")}>Back to Mall</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/mall")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </button>
          <Badge className="uppercase tracking-[0.18em] text-xs bg-slate-200 text-slate-700">
            Product Detail
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Tag className="w-5 h-5 text-amber-300" />
                  <span className="text-sm uppercase tracking-[0.24em] text-amber-200">{(product?.categoryId as any)?.name ?? "Marketplace"}</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight">{product?.name ?? "Loading product..."}</h1>
                <p className="max-w-2xl text-slate-300">{product?.description ?? "Fetching details from the mall catalogue."}</p>
                <div className="flex flex-wrap gap-3 items-center mt-4">
                  <span className="text-3xl font-bold">₦{product?.finalPrice?.toLocaleString()}</span>
                  {product?.baseSalePrice && product.baseSalePrice > product.finalPrice && (
                    <span className="text-sm text-slate-300 line-through">₦{product.baseSalePrice.toLocaleString()}</span>
                  )}
                  {savings > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-800">Save ₦{savings.toLocaleString()}</Badge>
                  )}
                  {product?.limitedOffer && (
                    <Badge className="bg-red-100 text-red-800">{product.limitedOffer}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-amber-400" /> 4.8 rating</span>
                  <span>•</span>
                  <span>{product?.soldQuantity ?? 0}+ sold</span>
                  <span>•</span>
                  <span>{product?.stockQuantity ?? 0} in stock</span>
                </div>
              </div>
            </div>

            <CardContent className="grid gap-6 p-8 bg-white">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-slate-100 p-6 text-center">
                  <div className="mx-auto mb-6 flex h-72 w-full max-w-sm items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-slate-100">
                    <span className="text-6xl">🛍️</span>
                  </div>
                  <p className="text-sm text-slate-500">Immersive mall view and product banners are coming soon. This demo page shows the product details and purchase experience.</p>
                </div>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h2 className="text-base font-semibold text-slate-900 mb-3">Marketing Pitch</h2>
                    <p className="text-sm text-slate-600">Get a smart virtual shopping experience with dynamic product offers, live flyers, and cross-store recommendations.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-blue-50 p-4 text-blue-700">
                      <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-2">Commission</p>
                      <p className="text-2xl font-bold">{product?.commissionPercent ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">
                      <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-2">Stock</p>
                      <p className="text-2xl font-bold">{product?.stockQuantity ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl p-6 bg-white">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-semibold uppercase tracking-[0.18em] text-xs">Smart Mall Offer</span>
              </div>
              <CardTitle className="text-2xl">Ready to buy?</CardTitle>
              <CardDescription className="text-slate-500">Add this item to cart and continue browsing the mall experience.</CardDescription>
            </CardHeader>
            <div className="space-y-4 mt-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Product code</p>
                <p className="font-semibold text-slate-900">{String(product?._id ?? "N/A")}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Category</p>
                <p className="font-semibold text-slate-900">{(product?.categoryId as any)?.name ?? "General"}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Buyer note</p>
                <p className="text-slate-700">Experience the virtual mall catalogue with featured products across stores and dynamic pitches.</p>
              </div>
              <Button className="w-full gap-2 justify-center" onClick={() => navigate(`/cart`)}>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </Button>
              {product?.arEnabled && (
                <Button variant="outline" className="w-full gap-2 justify-center mt-2" onClick={() => alert('AR Try-on coming soon!')}>
                  🔍 AR View (try in your room)
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
