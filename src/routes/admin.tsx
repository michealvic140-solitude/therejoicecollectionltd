import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminPayments } from "@/components/admin/AdminPayments";
import { AdminTracking } from "@/components/admin/AdminTracking";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminNegotiations } from "@/components/admin/AdminNegotiations";
import { AdminRefunds } from "@/components/admin/AdminRefunds";
import { AdminPromoCodes } from "@/components/admin/AdminPromoCodes";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
import { AdminEvents } from "@/components/admin/AdminEvents";
import { AdminSpinWheels } from "@/components/admin/AdminSpinWheels";
import { AdminPopupAds } from "@/components/admin/AdminPopupAds";
import { AdminCategoryDiscounts } from "@/components/admin/AdminCategoryDiscounts";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminChats } from "@/components/admin/AdminChats";
import { AdminAILogs } from "@/components/admin/AdminAILogs";
import { AdminKnowledgeBase } from "@/components/admin/AdminKnowledgeBase";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — The Rejoice Collection" },
      { name: "description", content: "Admin dashboard." },
    ],
  }),
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin]);

  const fetchCounts = async () => {
    const [pay, neg, ref, chat, users, notif] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending Payment"),
      supabase.from("negotiations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("chats").select("id", { count: "exact", head: true }).eq("is_admin", false).eq("is_system", false).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false),
    ]);
    setCounts({
      payments: pay.count || 0,
      negotiations: neg.count || 0,
      refunds: ref.count || 0,
      chats: chat.count || 0,
      users: users.count || 0,
      notifications: notif.count || 0,
    });
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchCounts();
    const channel = supabase.channel('admin-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'negotiations' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCounts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const tabs = [
    { value: "overview", label: "Overview", component: <AdminOverview /> },
    { value: "products", label: "Products", component: <AdminProducts /> },
    { value: "orders", label: "Orders", component: <AdminOrders /> },
    { value: "payments", label: "Payments", component: <AdminPayments />, count: counts.payments },
    { value: "tracking", label: "Tracking", component: <AdminTracking /> },
    { value: "users", label: "Users", component: <AdminUsers />, count: counts.users },
    { value: "negotiations", label: "Negotiations", component: <AdminNegotiations />, count: counts.negotiations },
    { value: "refunds", label: "Refunds", component: <AdminRefunds />, count: counts.refunds },
    { value: "promo-codes", label: "Promo Codes", component: <AdminPromoCodes /> },
    { value: "coupons", label: "Coupons", component: <AdminCoupons /> },
    { value: "events", label: "Events", component: <AdminEvents /> },
    { value: "spin-wheel", label: "Spin Wheel", component: <AdminSpinWheels /> },
    { value: "popup-ads", label: "Popup Ads", component: <AdminPopupAds /> },
    { value: "category-discounts", label: "Category Discounts", component: <AdminCategoryDiscounts /> },
    { value: "announcements", label: "Announcements", component: <AdminAnnouncements /> },
    { value: "chats", label: "Chats", component: <AdminChats />, count: counts.chats },
    { value: "ai-logs", label: "AI Logs", component: <AdminAILogs /> },
    { value: "settings", label: "Settings", component: <AdminSettings /> },
  ];

  const totalNew = (counts.payments || 0) + (counts.negotiations || 0) + (counts.refunds || 0) + (counts.chats || 0) + (counts.users || 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-gold" />
          <h1 className="font-display text-4xl font-bold text-gradient-gold">Admin Panel</h1>
          {totalNew > 0 && (
            <span className="ml-2 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
              {totalNew} new
            </span>
          )}
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 bg-secondary/50 p-1 rounded-xl h-auto">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                {t.label}
                {t.count && t.count > 0 ? (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {t.count}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(t => (
            <TabsContent key={t.value} value={t.value}>{t.component}</TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
