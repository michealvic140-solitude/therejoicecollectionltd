import { Crown, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    category?: string | null;
    original_price?: number | null;
  };
  onAddToCart?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

export function ProductCard({ product, onAddToCart, onNavigate }: ProductCardProps) {
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div
      className="glass-card rounded-xl overflow-hidden group cursor-pointer"
      onClick={() => onNavigate?.(product.id)}
    >
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Crown className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md gradient-gold text-xs font-bold text-primary-foreground">
            SALE
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        {product.category && (
          <span className="text-xs text-gold uppercase tracking-widest">{product.category}</span>
        )}
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gold">₦{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">₦{product.original_price!.toLocaleString()}</span>
            )}
          </div>
          <Button
            size="sm"
            className="gradient-gold text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product.id);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
