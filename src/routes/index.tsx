import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, ShieldCheck, Truck, HeadphonesIcon, Gift, Sparkles, Heart, Award, Globe } from "lucide-react";
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
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("products").select("*").eq("visible", true).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setProducts(data); });
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setAnnouncements(data); });
    supabase.from("settings").select("*").then(({ data }) => {
      if (!data) return;
      const s: Record<string, string> = {};
      data.forEach((r: any) => { s[r.key] = r.value; });
      setSettings(s);
    });
  }, []);

  const wa = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, "") : "";
  const normalizeUrl = (v?: string) => {
    if (!v) return "";
    const t = v.trim();
    if (!t) return "";
    if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
    return `https://${t.replace(/^\/+/, "")}`;
  };
  const tiktokHandle = (v?: string) => {
    if (!v) return "";
    const t = v.trim().replace(/^@/, "");
    if (/^https?:/i.test(t)) return t;
    return `https://www.tiktok.com/@${t}`;
  };
  const igHandle = (v?: string) => {
    if (!v) return "";
    const t = v.trim().replace(/^@/, "");
    if (/^https?:/i.test(t)) return t;
    return `https://www.instagram.com/${t}`;
  };
  const fbHandle = (v?: string) => {
    if (!v) return "";
    const t = v.trim().replace(/^@/, "");
    if (/^https?:/i.test(t)) return t;
    return `https://www.facebook.com/${t}`;
  };
  const socials = [
    wa && { label: "WhatsApp", icon: "💬", href: `https://wa.me/${wa}` },
    settings.tiktok && { label: "TikTok", icon: "🎵", href: tiktokHandle(settings.tiktok) },
    settings.instagram && { label: "Instagram", icon: "📸", href: igHandle(settings.instagram) },
    settings.facebook && { label: "Facebook", icon: "📘", href: fbHandle(settings.facebook) },
    settings.contact_email && { label: "Email", icon: "✉️", href: `mailto:${settings.contact_email.trim()}` },
    settings.contact_phone && { label: "Call", icon: "📞", href: `tel:${settings.contact_phone.trim().replace(/\s+/g, "")}` },
  ].filter(Boolean).filter((s: any) => !!s.href) as { label: string; icon: string; href: string }[];

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
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
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
            <Link to="/shop" search={{}}>
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
            {categories.map((cat) => (
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
            <Link to="/shop" search={{}} className="text-gold text-sm font-medium hover:underline flex items-center gap-1">
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

      {/* Connect with us — social channels */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-2 text-gradient-gold">Connect With Us</h2>
          <p className="text-center text-sm text-muted-foreground mb-8">Reach us anytime, on any channel.</p>
          {socials.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="glass-card rounded-xl p-4 text-center hover:border-gold/40 hover:scale-105 transition-all">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className="text-xs font-medium text-foreground">{s.label}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Social links coming soon.</p>
          )}
          <div className="text-center mt-6">
            <Link to="/contact">
              <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                <HeadphonesIcon className="mr-2 h-4 w-4" /> Visit Contact Page
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gradient-gold mb-4">About Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Welcome to The Rejoice Collection — your premier destination for luxury fashion in Nigeria.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Heart,
                title: "Our Story",
                desc: "Founded with a passion for bringing world-class luxury fashion to Nigeria, The Rejoice Collection curates only the finest pieces from premium brands and independent artisans. Every item is hand-selected for quality, style, and authenticity.",
              },
              {
                icon: Award,
                title: "Our Promise",
                desc: "We guarantee 100% authentic products, premium packaging, and exceptional customer service. With our 7-day return policy and dedicated AI Concierge, we ensure every shopping experience is seamless and delightful.",
              },
              {
                icon: Globe,
                title: "Our Mission",
                desc: "To make luxury fashion accessible to modern Nigerians. We believe everyone deserves to express themselves through premium quality fashion. From watches to jewelry, bags to footwear — we've got your style covered.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-2xl p-8 text-center"
              >
                <div className="h-14 w-14 rounded-full gradient-gold flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-8 md:p-12 text-center"
          >
            <Crown className="h-10 w-10 text-gold mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">Why Choose Us?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              {[
                { value: "500+", label: "Happy Customers" },
                { value: "100%", label: "Authentic Products" },
                { value: "24/7", label: "AI Support" },
                { value: "₦50K+", label: "Free Shipping" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-gradient-gold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
