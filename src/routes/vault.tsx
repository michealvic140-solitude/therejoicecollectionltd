import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Lock, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/vault")({
  component: VaultPage,
  head: () => ({
    meta: [
      { title: "Vault — The Rejoice Collection" },
      { name: "description", content: "Exclusive luxury items." },
    ],
  }),
});

function VaultPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("*").eq("vault", true).eq("visible", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProducts(data); });
  }, [user]);

  const handleAddToCart = async (id: string) => {
    if (!user) { navigate({ to: "/login" }); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 text-gold mx-auto" />
          <h2 className="font-display text-2xl font-bold text-foreground">Exclusive Vault</h2>
          <p className="text-muted-foreground">Sign in to access exclusive items.</p>
          <Link to="/login" className="text-gold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Crown className="h-10 w-10 text-gold mx-auto mb-4 animate-float" />
          <h1 className="font-display text-4xl font-bold text-gradient-gold">The Vault</h1>
          <p className="text-muted-foreground mt-2">Exclusive luxury pieces for our members</p>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} onNavigate={(id) => navigate({ to: "/shop/$productId", params: { productId: id } })} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-2xl">
            <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Vault items coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
