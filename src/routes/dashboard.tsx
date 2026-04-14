import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, ShoppingBag, CreditCard, MessageCircle, Crown, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — The Rejoice Collection" },
      { name: "description", content: "Your personal dashboard." },
    ],
  }),
});

function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({ orders: 0, pendingOrders: 0, totalSpent: 0, messages: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([ordersRes, msgsRes]) => {
      const orders = ordersRes.data || [];
      setStats({
        orders: orders.length,
        pendingOrders: orders.filter(o => o.status === "pending" || o.status === "processing").length,
        totalSpent: orders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        messages: msgsRes.count || 0,
      });
      setRecentOrders(orders.slice(0, 3));
    });
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to access your dashboard.</p>
          <Link to="/login"><Button className="gradient-gold text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  const cards = [
    { icon: Package, label: "Total Orders", value: stats.orders, color: "text-gold" },
    { icon: ShoppingBag, label: "Pending", value: stats.pendingOrders, color: "text-orange-400" },
    { icon: CreditCard, label: "Total Spent", value: `₦${stats.totalSpent.toLocaleString()}`, color: "text-green-400" },
    { icon: MessageCircle, label: "Messages", value: stats.messages, color: "text-blue-400" },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-full gradient-gold flex items-center justify-center">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Welcome, {profile?.full_name?.split(" ")[0] || "Member"}!</h1>
            <p className="text-sm text-muted-foreground">Your personal dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {cards.map((c, i) => (
            <div key={i} className="glass-card rounded-xl p-5">
              <c.icon className={`h-6 w-6 ${c.color} mb-2`} />
              <p className="text-2xl font-display font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground">Recent Orders</h3>
              <Link to="/orders" className="text-gold text-sm hover:underline flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gold">₦{o.total?.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs capitalize border-gold/30 text-gold">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No orders yet. <Link to="/shop" search={{}} className="text-gold hover:underline">Start shopping!</Link></p>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/shop" search={{}} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <span className="text-sm text-foreground">Browse Products</span>
              </Link>
              <Link to="/orders" className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors">
                <Package className="h-5 w-5 text-gold" />
                <span className="text-sm text-foreground">My Orders</span>
              </Link>
              <Link to="/chat" className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors">
                <MessageCircle className="h-5 w-5 text-gold" />
                <span className="text-sm text-foreground">Chat Support</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3 hover:bg-secondary transition-colors">
                <User className="h-5 w-5 text-gold" />
                <span className="text-sm text-foreground">Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
