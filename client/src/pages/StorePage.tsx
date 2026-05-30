import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/contexts/WishlistContext';

interface Store {
  _id: string;
  name: string;
  category: 'store' | 'office';
  description?: string;
  bannerImageUrl?: string;
  buildingLevel: number;
  marketingPitch?: {
    headline?: string;
    promoText?: string;
    ctaLink?: string;
    videoUrl?: string;
  };
  flyers: Array<{
    title: string;
    description?: string;
    imageUrl?: string;
    validUntil?: string;
  }>;
  products: any[];
}

export default function StorePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const wishlist = useWishlist();

  const { data: store, isLoading } = trpc.stores.detail.useQuery({ id: params.id! });

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading store...</div>;
  if (!store) return <div className="text-center py-12">Store not found</div>;

  const typedStore = store as unknown as Store;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-slate-800 to-slate-600 overflow-hidden">
        {typedStore.bannerImageUrl && (
          <img
            src={typedStore.bannerImageUrl}
            alt={typedStore.name}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{typedStore.name}</h1>
          <p className="text-lg opacity-90">{typedStore.description}</p>
          <Badge variant="secondary" className="mt-2">
            Level {typedStore.buildingLevel} · {typedStore.category}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Marketing Pitch */}
        {typedStore.marketingPitch && (
          <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                🎯 Exclusive Pitch
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typedStore.marketingPitch.headline && (
                <h3 className="text-xl font-semibold mb-2">{typedStore.marketingPitch.headline}</h3>
              )}
              {typedStore.marketingPitch.promoText && (
                <p className="text-slate-700 mb-4">{typedStore.marketingPitch.promoText}</p>
              )}
              {typedStore.marketingPitch.videoUrl && (
                <div className="mb-4">
                  <iframe
                    src={typedStore.marketingPitch.videoUrl}
                    title="Marketing Pitch"
                    className="w-full h-64 rounded-lg"
                    allowFullScreen
                  />
                </div>
              )}
              {typedStore.marketingPitch.ctaLink && (
                <Button
                  onClick={() => window.open(typedStore.marketingPitch!.ctaLink, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Grab Offer
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Flyers Section */}
        {typedStore.flyers && typedStore.flyers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              📢 Current Flyers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typedStore.flyers.map((flyer, index) => (
                <Card key={index} className="overflow-hidden">
                  {flyer.imageUrl && (
                    <div className="aspect-video bg-slate-200 overflow-hidden">
                      <img
                        src={flyer.imageUrl}
                        alt={flyer.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{flyer.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{flyer.description}</p>
                    {flyer.validUntil && (
                      <p className="text-xs text-slate-500 mt-2">
                        Valid until: {new Date(flyer.validUntil).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            📦 Products / Services
          </h2>
          {typedStore.products && typedStore.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {typedStore.products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onClick={() => navigate(`/products/${product._id}`)}
                  isWishlisted={wishlist.isWishlisted(product._id)}
                  onToggleWishlist={() => wishlist.toggleWishlist(product._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No products available in this store yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}