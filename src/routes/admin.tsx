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
import { AdminMessages } from "@/components/admin/AdminMessages";
import { AdminAILogs } from "@/components/admin/AdminAILogs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { Shield } from "lucide-react";
import { useEffect } from "react";

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

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [loading, isAdmin]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!isAdmin) return null;

  const tabs = [
    { value: "overview", label: "Overview", component: <AdminOverview /> },
    { value: "products", label: "Products", component: <AdminProducts /> },
    { value: "orders", label: "Orders", component: <AdminOrders /> },
    { value: "payments", label: "Payments", component: <AdminPayments /> },
    { value: "tracking", label: "Tracking", component: <AdminTracking /> },
    { value: "users", label: "Users", component: <AdminUsers /> },
    { value: "negotiations", label: "Negotiations", component: <AdminNegotiations /> },
    { value: "refunds", label: "Refunds", component: <AdminRefunds /> },
    { value: "promo-codes", label: "Promo Codes", component: <AdminPromoCodes /> },
    { value: "coupons", label: "Coupons", component: <AdminCoupons /> },
    { value: "events", label: "Events", component: <AdminEvents /> },
    { value: "spin-wheel", label: "Spin Wheel", component: <AdminSpinWheels /> },
    { value: "popup-ads", label: "Popup Ads", component: <AdminPopupAds /> },
    { value: "category-discounts", label: "Category Discounts", component: <AdminCategoryDiscounts /> },
    { value: "announcements", label: "Announcements", component: <AdminAnnouncements /> },
    { value: "chats", label: "Chats", component: <AdminMessages /> },
    { value: "ai-logs", label: "AI Logs", component: <AdminAILogs /> },
    { value: "settings", label: "Settings", component: <AdminSettings /> },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-gold" />
          <h1 className="font-display text-4xl font-bold text-gradient-gold">Admin Panel</h1>
        </div>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 bg-secondary/50 p-1 rounded-xl h-auto">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                {t.label}
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
