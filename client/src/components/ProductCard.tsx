import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description?: string;
  finalPrice: number;
  images: string[];
  stockQuantity: number;
  arEnabled: boolean;
  limitedOffer?: string;
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onAddToCart?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export default function ProductCard({ product, onClick, onAddToCart, isWishlisted, onToggleWishlist }: ProductCardProps) {
  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
      onClick={onClick}
    >
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        <button
          type="button"
          className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) {
              onToggleWishlist(product._id);
            }
          }}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} />
        </button>

        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.arEnabled && (
          <Badge className="absolute top-2 left-2 bg-purple-600">
            AR Ready
          </Badge>
        )}
        {product.limitedOffer && (
          <Badge className="absolute top-2 right-2 bg-red-600">
            {product.limitedOffer}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
          {product.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-green-600">
            ₦{product.finalPrice.toLocaleString()}
          </span>
          <span className="text-sm text-slate-500">
            {product.stockQuantity} in stock
          </span>
        </div>
        <Button
          size="sm"
          className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddToCart) {
              onAddToCart(product);
            }
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}