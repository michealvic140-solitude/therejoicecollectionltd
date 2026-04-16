import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Package, Users, DollarSign, ShoppingBag, TrendingUp, RotateCcw, Ticket, BarChart3 } from "lucide-react";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundRequests: number;
  activeCoupons: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const CHART_COLORS = ["hsl(40,70%,50%)", "hsl(220,70%,55%)", "hsl(150,60%,45%)", "hsl(0,70%,55%)", "hsl(280,60%,55%)", "hsl(30,80%,55%)"];

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalOrders: 0, totalUsers: 0, totalProducts: 0,
    inStockProducts: 0, outOfStockProducts: 0, pendingOrders: 0, deliveredOrders: 0,
    cancelledOrders: 0, refundRequests: 0, activeCoupons: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, usersRes, productsRes, couponsRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("id"),
        supabase.from("products").select("id, out_of_stock"),
        supabase.from("coupons").select("id").eq("active", true),
      ]);

      const orders = (ordersRes.data || []) as any[];
      const approvedOrders = orders.filter((o: any) => ["Payment Confirmed", "Processing", "Shipped", "Delivered"].includes(o.status));
      const totalRevenue = approvedOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const products = (productsRes.data || []) as any[];

      // Daily revenue for last 14 days
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().slice(0, 10);
      });
      const daily = last14.map(date => {
        const dayOrders = approvedOrders.filter((o: any) => o.created_at.slice(0, 10) === date);
        return { date: date.slice(5), revenue: dayOrders.reduce((s: number, o: any) => s + Number(o.total), 0), orders: dayOrders.length };
      });
      setDailyRevenue(daily);

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: usersRes.data?.length || 0,
        totalProducts: products.length,
        inStockProducts: products.filter((p: any) => !p.out_of_stock).length,
        outOfStockProducts: products.filter((p: any) => p.out_of_stock).length,
        pendingOrders: orders.filter((o: any) => o.status === "Pending Payment").length,
        deliveredOrders: orders.filter((o: any) => o.status === "Delivered").length,
        cancelledOrders: orders.filter((o: any) => o.status === "Cancelled").length,
        refundRequests: orders.filter((o: any) => o.refund_status && o.refund_status !== "").length,
        activeCoupons: couponsRes.data?.length || 0,
      });
    };
    fetchStats();

    const channel = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const maxRevenue = Math.max(...dailyRevenue.map(r => r.revenue), 1);
  const maxOrders = Math.max(...dailyRevenue.map(r => r.orders), 1);
  const totalStatusCount = statusData.reduce((s, d) => s + d.value, 0) || 1;

  const cards = [
    { title: "Total Revenue", value: formatPrice(stats.totalRevenue), icon: DollarSign, desc: "From approved payments", color: "text-emerald-400" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, desc: `${stats.pendingOrders} pending · ${stats.deliveredOrders} delivered`, color: "text-blue-400" },
    { title: "Total Users", value: stats.totalUsers, icon: Users, desc: "Registered customers", color: "text-purple-400" },
    { title: "Products", value: stats.totalProducts, icon: Package, desc: `${stats.inStockProducts} in stock · ${stats.outOfStockProducts} out`, color: "text-gold" },
    { title: "Refund Requests", value: stats.refundRequests, icon: RotateCcw, desc: "All refund requests", color: "text-red-400" },
    { title: "Active Coupons", value: stats.activeCoupons, icon: Ticket, desc: "Currently active", color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <c.icon className={`h-6 w-6 ${c.color} mb-2`} />
            <p className="text-xl font-display font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.title}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" /> Revenue (Last 14 Days)
          </h3>
          <div className="space-y-2">
            {dailyRevenue.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">{d.date}</span>
                <div className="flex-1 h-4 rounded bg-secondary overflow-hidden">
                  <div className="h-full rounded bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                </div>
                <span className="text-xs text-emerald-400 w-20 text-right">{formatPrice(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Pie (simplified) */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gold" /> Order Status Breakdown
          </h3>
          <div className="space-y-3">
            {statusData.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="text-foreground font-medium">{s.value}</span>
                </div>
                <div className="h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.value / totalStatusCount) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
            {statusData.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No orders yet.</p>}
          </div>
        </div>

        {/* Daily Orders */}
        <div className="glass-card rounded-xl p-6 md:col-span-2">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-400" /> Daily Orders (Last 14 Days)
          </h3>
          <div className="flex items-end gap-1 h-32">
            {dailyRevenue.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">{d.orders}</span>
                <div className="w-full rounded-t bg-blue-500/70" style={{ height: `${Math.max(4, (d.orders / maxOrders) * 100)}%` }} />
                <span className="text-[8px] text-muted-foreground">{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
