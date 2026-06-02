import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, Star } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ProductCatalogSkeleton } from "@/components/BuyerSkeletons";

export default function ProductCatalog() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products, isLoading } = trpc.products.list.useQuery({
    limit: 20,
    offset: 0,
  });
  const { data: featuredProducts } = trpc.products.featured.useQuery();

  // Debug logs to inspect what the client actually receives from the API
  console.log("trpc.products.list -> products:", products);
  console.log("trpc.products.featured -> featuredProducts:", featuredProducts);

  // Normalize Mongoose `_id` to `id` and ensure numeric fields are present
  const productsNormalized = (products ?? []).map((p: any) => ({
    ...p,
    id: (p.id ?? p._id) && String(p.id ?? p._id),
    finalPrice: p.finalPrice ?? p.baseSalePrice ?? 0,
    stockQuantity: p.stockQuantity ?? 0,
  }));

  const featuredNormalized = (featuredProducts ?? []).map((p: any) => ({
    ...p,
    id: (p.id ?? p._id) && String(p.id ?? p._id),
    finalPrice: p.finalPrice ?? p.baseSalePrice ?? 0,
  }));

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Product added to cart!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add to cart");
    },
  });

  const handleAddToCart = (productId: string | number) => {
    if (!user) {
      navigate("/");
      return;
    }
    const pid = String(productId);
    addToCartMutation.mutate({ productId: pid, quantity: 1 });
  };

  if (isLoading) {
    return <ProductCatalogSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Product Catalog</h1>
            <Button
              variant="outline"
              onClick={() => navigate("/cart")}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              View Cart
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      {featuredNormalized && featuredNormalized.length > 0 && (
        <section className="bg-white border-b py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Featured Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredNormalized.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-3 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                      <span className="text-blue-300 text-4xl">📦</span>
                    </div>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < 4 ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Price</p>
                        <p className="text-2xl font-bold text-slate-900">
                          ₦{parseFloat(product.finalPrice.toString()).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                        className="w-full gap-2"
                        disabled={addToCartMutation.isPending}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-900">All Products</h2>

            {isLoading ? (
          <ProductCatalogSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productsNormalized.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg mb-3 flex items-center justify-center group-hover:from-slate-200 group-hover:to-slate-100 transition-colors">
                    <span className="text-slate-300 text-4xl">📦</span>
                  </div>
                  <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-slate-600">Price</p>
                        <p className="text-2xl font-bold text-slate-900">
                          ₦{parseFloat(product.finalPrice.toString()).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Stock</p>
                        <p className="text-lg font-semibold text-green-600">
                          {product.stockQuantity}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product.id);
                      }}
                      className="w-full gap-2"
                      disabled={addToCartMutation.isPending || product.stockQuantity === 0}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {productsNormalized && productsNormalized.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
}
