import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";

const categories = ["all", "watches", "bags", "jewelry", "accessories", "footwear", "clothes", "nightwear", "undies", "trousers", "shirts", "polo", "slippers", "shoes", "glasses", "others"];

export const Route = createFileRoute("/shop")({
  component: ShopPage,
  head: () => ({
    meta: [
      { title: "Shop — The Rejoice Collection" },
      { name: "description", content: "Browse our luxury fashion collection." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    category: (search.category as string) || "all",
  }),
});

function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const { category } = Route.useSearch();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProducts(data); });
  }, []);

  const filtered = products.filter(p => {
    const matchCat = category === "all" || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToCart = async (id: string) => {
    if (!user) { navigate({ to: "/login" }); return; }
    await addToCart(id);
    toast.success("Added to cart!");
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-8">Shop</h1>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <Link
              key={cat}
              to="/shop"
              search={{ category: cat }}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                category === cat
                  ? "gradient-gold text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onNavigate={(id) => navigate({ to: "/shop/$productId", params: { productId: id } })}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
