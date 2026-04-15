import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Users, ShoppingBag, DollarSign, Sparkles, TrendingUp, Bot, MessageCircle, AlertTriangle, CreditCard, RotateCcw } from "lucide-react";

export function AdminOverview() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, revenue: 0, aiLogs: 0, messages: 0, escalated: 0, payments: 0, pendingPayments: 0, refunds: 0 });
  const [topTopics, setTopTopics] = useState<{ topic: string; count: number }[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; total: number }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id, total, status, created_at", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("ai_logs").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("escalated", true),
      supabase.from("ai_logs").select("message").eq("type", "concierge_query").limit(500),
      supabase.from("payments").select("id, status", { count: "exact" }),
      supabase.from("refunds").select("id", { count: "exact", head: true }),
    ]).then(([products, orders, users, aiLogs, messages, escalated, queries, payments, refunds]) => {
      const revenue = orders.data?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      const pendingPayments = payments.data?.filter((p: any) => p.status === "pending").length || 0;
      
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        users: users.count || 0,
        revenue,
        aiLogs: aiLogs.count || 0,
        messages: messages.count || 0,
        escalated: escalated.count || 0,
        payments: payments.count || 0,
        pendingPayments,
        refunds: refunds.count || 0,
      });

      // Revenue by month
      if (orders.data) {
        const monthMap: Record<string, number> = {};
        orders.data.forEach((o: any) => {
          if (o.status !== "cancelled") {
            const month = new Date(o.created_at).toLocaleDateString("en", { year: "numeric", month: "short" });
            monthMap[month] = (monthMap[month] || 0) + (o.total || 0);
          }
        });
        setRevenueByMonth(
          Object.entries(monthMap)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .slice(-6)
            .map(([month, total]) => ({ month, total }))
        );

        // Orders by status
        const statusMap: Record<string, number> = {};
        orders.data.forEach((o: any) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
        setOrdersByStatus(Object.entries(statusMap).map(([status, count]) => ({ status, count })));
      }

      // Analyze topics
      if (queries.data) {
        const keywords: Record<string, string> = {
          shipping: "Shipping", delivery: "Shipping", return: "Returns", refund: "Returns",
          size: "Sizing", payment: "Payment", pay: "Payment", order: "Orders",
          track: "Orders", recommend: "Recommendations", help: "General Help",
          how: "Platform Guide", where: "Platform Guide", what: "Platform Guide",
          cancel: "Cancellations", price: "Pricing",
        };
        const counts: Record<string, number> = {};
        queries.data.forEach((q: any) => {
          const msg = q.message.toLowerCase();
          Object.entries(keywords).forEach(([key, topic]) => {
            if (msg.includes(key)) counts[topic] = (counts[topic] || 0) + 1;
          });
        });
        setTopTopics(
          Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => ({ topic, count }))
        );
      }
    });
  }, []);

  const cards = [
    { icon: Package, label: "Products", value: stats.products, color: "text-gold" },
    { icon: ShoppingBag, label: "Orders", value: stats.orders, color: "text-gold" },
    { icon: Users, label: "Users", value: stats.users, color: "text-gold" },
    { icon: DollarSign, label: "Revenue", value: `₦${stats.revenue.toLocaleString()}`, color: "text-green-400" },
    { icon: CreditCard, label: "Pending Pay", value: stats.pendingPayments, color: "text-yellow-400" },
    { icon: RotateCcw, label: "Refunds", value: stats.refunds, color: "text-orange-400" },
    { icon: Bot, label: "AI Chats", value: stats.aiLogs, color: "text-blue-400" },
    { icon: MessageCircle, label: "Messages", value: stats.messages, color: "text-purple-400" },
    { icon: AlertTriangle, label: "Escalated", value: stats.escalated, color: "text-red-400" },
  ];

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.total), 1);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    shipped: "bg-purple-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <card.icon className={`h-6 w-6 ${card.color} mb-2`} />
            <p className="text-xl font-display font-bold text-foreground">{card.value}</p>
            <p className="text-[10px] text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="font-display text-lg font-semibold text-foreground">Revenue Overview</h3>
          </div>
          {revenueByMonth.length > 0 ? (
            <div className="space-y-3">
              {revenueByMonth.map((r, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{r.month}</span>
                    <span className="font-bold text-green-400">₦{r.total.toLocaleString()}</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                      style={{ width: `${(r.total / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No revenue data yet.</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg font-semibold text-foreground">Orders by Status</h3>
          </div>
          {ordersByStatus.length > 0 ? (
            <div className="space-y-3">
              {ordersByStatus.map((o, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${statusColors[o.status] || "bg-gray-500"}`} />
                    <span className="text-sm font-medium text-foreground capitalize">{o.status}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{o.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>
          )}
        </div>

        {/* AI Insights */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg font-semibold text-foreground">AI Insights — Top Topics</h3>
          </div>
          {topTopics.length > 0 ? (
            <div className="space-y-3">
              {topTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-foreground">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-gold/30 w-24">
                      <div className="h-2 rounded-full gradient-gold" style={{ width: `${Math.min(100, (t.count / (topTopics[0]?.count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No AI data yet.</p>
          )}
        </div>

        {/* Platform Status */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-gold" />
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
              <span className="text-sm text-foreground">Pending Payments</span>
              <span className={`text-xs font-medium ${stats.pendingPayments > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {stats.pendingPayments > 0 ? `${stats.pendingPayments} awaiting review` : "None"}
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
