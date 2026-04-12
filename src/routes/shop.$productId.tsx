import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Crown, ShoppingBag, ArrowLeft, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$productId")({
  component: ProductDetailPage,
  head: () => ({
    meta: [
      { title: "Product — The Rejoice Collection" },
      { name: "description", content: "View product details." },
    ],
  }),
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("products").select("*").eq("id", productId).single()
      .then(({ data }) => setProduct(data));
  }, [productId]);

  if (!product) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  const handleAdd = async () => {
    if (!user) { navigate({ to: "/login" }); return; }
    for (let i = 0; i < quantity; i++) await addToCart(product.id);
    toast.success(`Added ${quantity}x ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/shop" search={{}} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
        </Link>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card rounded-2xl overflow-hidden aspect-square">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Crown className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-6">
            {product.category && (
              <span className="text-sm text-gold uppercase tracking-widest">{product.category}</span>
            )}
            <h1 className="font-display text-4xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gold">₱{product.price.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-lg text-muted-foreground line-through">₱{product.original_price.toLocaleString()}</span>
              )}
            </div>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-secondary rounded-l-lg"><Minus className="h-4 w-4" /></button>
                <span className="px-4 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-secondary rounded-r-lg"><Plus className="h-4 w-4" /></button>
              </div>
              <Button size="lg" className="gradient-gold text-primary-foreground font-semibold flex-1" onClick={handleAdd}>
                <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {product.stock !== undefined && product.stock !== null && (
                <p>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
