import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Users, ShoppingBag, DollarSign, Sparkles, TrendingUp, Bot } from "lucide-react";

export function AdminOverview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0, aiLogs: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ai_logs").select("id", { count: "exact", head: true }),
    ]).then(([products, orders, users, aiLogs]) => {
      const revenue = orders.data?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        users: users.count || 0,
        revenue,
        aiLogs: aiLogs.count || 0,
      });
    });
  }, []);

  const cards = [
    { icon: Package, label: "Products", value: stats.products, color: "text-gold" },
    { icon: ShoppingBag, label: "Orders", value: stats.orders, color: "text-gold" },
    { icon: Users, label: "Users", value: stats.users, color: "text-gold" },
    { icon: DollarSign, label: "Revenue", value: `₱${stats.revenue.toLocaleString()}`, color: "text-gold" },
    { icon: Bot, label: "AI Interactions", value: stats.aiLogs, color: "text-gold" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="glass-card rounded-xl p-6">
            <card.icon className={`h-8 w-8 ${card.color} mb-3`} />
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* AI Recommendations Summary */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-gold" />
          <h3 className="font-display text-lg font-semibold text-foreground">AI Insights</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Most Asked About</p>
            <p className="font-semibold text-foreground mt-1">Shipping & Delivery</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Top Recommendation</p>
            <p className="font-semibold text-foreground mt-1">Add size guides to product pages</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">User Satisfaction</p>
            <p className="font-semibold text-foreground mt-1 flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" /> 92% Positive</p>
          </div>
        </div>
      </div>
    </div>
  );
}
