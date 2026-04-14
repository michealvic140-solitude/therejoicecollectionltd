import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Users, ShoppingBag, DollarSign, Sparkles, TrendingUp, Bot, MessageCircle, AlertTriangle } from "lucide-react";

export function AdminOverview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0, aiLogs: 0, messages: 0, escalated: 0 });
  const [topTopics, setTopTopics] = useState<{ topic: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ai_logs").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("escalated", true),
      supabase.from("ai_logs").select("message").eq("type", "concierge_query").limit(500),
    ]).then(([products, orders, users, aiLogs, messages, escalated, queries]) => {
      const revenue = orders.data?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        users: users.count || 0,
        revenue,
        aiLogs: aiLogs.count || 0,
        messages: messages.count || 0,
        escalated: escalated.count || 0,
      });

      // Analyze top topics
      if (queries.data) {
        const keywords: Record<string, string> = {
          shipping: "Shipping", delivery: "Shipping", return: "Returns", refund: "Returns",
          size: "Sizing", payment: "Payment", pay: "Payment", order: "Orders",
          track: "Orders", recommend: "Recommendations", help: "General Help",
          how: "Platform Guide", where: "Platform Guide", what: "Platform Guide",
        };
        const counts: Record<string, number> = {};
        queries.data.forEach((q: any) => {
          const msg = q.message.toLowerCase();
          Object.entries(keywords).forEach(([key, topic]) => {
            if (msg.includes(key)) counts[topic] = (counts[topic] || 0) + 1;
          });
        });
        setTopTopics(
          Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic, count]) => ({ topic, count }))
        );
      }
    });
  }, []);

  const cards = [
    { icon: Package, label: "Products", value: stats.products },
    { icon: ShoppingBag, label: "Orders", value: stats.orders },
    { icon: Users, label: "Users", value: stats.users },
    { icon: DollarSign, label: "Revenue", value: `₦${stats.revenue.toLocaleString()}` },
    { icon: Bot, label: "AI Chats", value: stats.aiLogs },
    { icon: MessageCircle, label: "Messages", value: stats.messages },
    { icon: AlertTriangle, label: "Escalated", value: stats.escalated },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="glass-card rounded-xl p-5">
            <card.icon className="h-7 w-7 text-gold mb-3" />
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Insights from real data */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg font-semibold text-foreground">AI Insights — Top User Topics</h3>
          </div>
          {topTopics.length > 0 ? (
            <div className="space-y-3">
              {topTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-foreground">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-gold/30 w-24">
                      <div
                        className="h-2 rounded-full gradient-gold"
                        style={{ width: `${Math.min(100, (t.count / (topTopics[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No AI interaction data yet.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg font-semibold text-foreground">Platform Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <span className="text-sm text-foreground">AI Concierge</span>
              <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <span className="text-sm text-foreground">Pending Escalations</span>
              <span className={`text-xs font-medium ${stats.escalated > 0 ? "text-orange-400" : "text-green-400"}`}>
                {stats.escalated > 0 ? `${stats.escalated} pending` : "None"}
              </span>
            </div>
            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
              <span className="text-sm text-foreground">Total Conversations</span>
              <span className="text-xs text-muted-foreground">{Math.floor(stats.aiLogs / 2)} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
