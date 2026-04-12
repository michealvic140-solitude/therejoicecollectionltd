import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, ShieldCheck, Truck, HeadphonesIcon, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The Rejoice Collection — Luxury Fashion" },
      { name: "description", content: "Discover luxury fashion pieces at The Rejoice Collection. Premium watches, jewelry, bags, and accessories." },
    ],
  }),
});

function Index() {
  const [products, setProducts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setProducts(data); });
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setAnnouncements(data); });
  }, []);

  const handleAddToCart = async (id: string) => {
    if (!user) { navigate({ to: "/login" }); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  const categories = [
    { name: "Watches", icon: "⌚" },
    { name: "Bags", icon: "👜" },
    { name: "Jewelry", icon: "💎" },
    { name: "Accessories", icon: "✨" },
    { name: "Footwear", icon: "👟" },
    { name: "Clothes", icon: "👔" },
  ];

  return (
    <div className="min-h-screen">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="gradient-gold py-2 px-4 text-center">
          <p className="text-sm font-medium text-primary-foreground">{announcements[0].message}</p>
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold/20 blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gold/10 blur-[150px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Crown className="h-8 w-8 text-gold animate-float" />
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-bold mb-6">
            <span className="text-gradient-gold">The Rejoice</span>
            <br />
            <span className="text-foreground">Collection</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover premium luxury fashion curated for the modern connoisseur. Elevate your style with our exclusive pieces.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/shop">
              <Button size="lg" className="gradient-gold text-primary-foreground font-semibold px-8 text-lg">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/vault">
              <Button size="lg" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 font-semibold px-8 text-lg">
                <Sparkles className="mr-2 h-5 w-5" /> Vault
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, label: "Authentic", desc: "100% genuine products" },
            { icon: Truck, label: "Fast Shipping", desc: "Nationwide delivery" },
            { icon: HeadphonesIcon, label: "24/7 Support", desc: "Always here for you" },
            { icon: Gift, label: "Gift Wrapping", desc: "Premium packaging" },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 text-center"
            >
              <f.icon className="h-8 w-8 text-gold mx-auto mb-3" />
              <h3 className="font-display font-semibold text-foreground">{f.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-10 text-gradient-gold">Shop by Category</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.name}
                to="/shop"
                search={{ category: cat.name.toLowerCase() }}
                className="glass-card rounded-xl p-4 text-center hover:border-gold/30 transition-all"
              >
                <span className="text-3xl">{cat.icon}</span>
                <p className="mt-2 text-sm font-medium text-foreground">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-3xl font-bold text-gradient-gold">Featured Products</h2>
            <Link to="/shop" className="text-gold text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onNavigate={(id) => navigate({ to: "/shop/$productId", params: { productId: id } })}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 glass-card rounded-2xl">
              <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Products coming soon...</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
