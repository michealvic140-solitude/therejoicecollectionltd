import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — The Rejoice Collection" },
      { name: "description", content: "View your order history." },
    ],
  }),
});

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to view orders.</p>
          <Link to="/login" className="text-gold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  const statusIcon = (s: string) => {
    switch(s) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-destructive" />;
      case "processing": return <Clock className="h-4 w-4 text-gold" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-8">My Orders</h1>
        {orders.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
            <Link to="/shop" search={{}} className="text-gold hover:underline mt-2 inline-block">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="glass-card rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(order.status)}
                    <Badge variant="outline" className="capitalize border-gold/30 text-gold">{order.status}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</span>
                  <span className="font-display text-xl font-bold text-gold">₱{order.total?.toLocaleString()}</span>
                </div>
                {order.items && Array.isArray(order.items) && (
                  <p className="text-xs text-muted-foreground">{order.items.length} item(s)</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
