import { useEffect, useState } from "react";
import { Crown, ShoppingBag, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image_url?: string | null;
    category?: string | null;
    original_price?: number | null;
    discount_percent?: number | null;
    discount_ends_at?: string | null;
  };
  onAddToCart?: (id: string) => void;
  onNavigate?: (id: string) => void;
}

function useCountdown(endsAt?: string | null) {
  const [remaining, setRemaining] = useState<number>(() =>
    endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0
  );
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  if (!endsAt || remaining <= 0) return null;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function ProductCard({ product, onAddToCart, onNavigate }: ProductCardProps) {
  const countdown = useCountdown(product.discount_ends_at);
  const discountActive = !!(product.discount_percent && product.discount_percent > 0 && countdown);
  const effectivePrice = discountActive
    ? Math.round(product.price * (1 - (product.discount_percent || 0) / 100))
    : product.price;
  const hasOriginal = product.original_price && product.original_price > effectivePrice;
  const showSale = discountActive || hasOriginal;

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
        {showSale && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md gradient-gold text-xs font-bold text-primary-foreground">
            {discountActive ? `-${product.discount_percent}%` : "SALE"}
          </span>
        )}
        {countdown && (
          <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur text-[10px] font-mono font-bold text-gold border border-gold/30">
            <Timer className="h-3 w-3" /> {countdown}
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
            <span className="text-lg font-bold text-gold">{formatPrice(effectivePrice)}</span>
            {(discountActive || hasOriginal) && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(discountActive ? product.price : product.original_price!)}
              </span>
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
