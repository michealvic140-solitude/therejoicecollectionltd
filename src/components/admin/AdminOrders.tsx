import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(o => o.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone, delivery_address, delivery_state, delivery_lga").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setOrders(data.map(o => ({ ...o, profile: map.get(o.user_id) || {} })));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order updated to ${status}`);

    // Auto-create tracking entry when marked as processing/shipped
    if (status === "processing" || status === "shipped") {
      const order = orders.find(o => o.id === id);
      if (order) {
        const { data: existing } = await supabase.from("tracking").select("id").eq("order_id", id).maybeSingle();
        if (!existing) {
          await supabase.from("tracking").insert({
            order_id: id,
            user_id: order.user_id,
            status: status === "shipped" ? "shipped" : "processing",
          });
        } else {
          await supabase.from("tracking").update({ status: status === "shipped" ? "shipped" : "processing", updated_at: new Date().toISOString() }).eq("order_id", id);
        }
      }
    }

    fetchOrders();
  };

  const createPaymentForOrder = async (order: any) => {
    const { data: existing } = await supabase.from("payments").select("id").eq("order_id", order.id).maybeSingle();
    if (existing) { toast.info("Payment record already exists for this order"); return; }
    const { error } = await supabase.from("payments").insert({
      order_id: order.id,
      user_id: order.user_id,
      amount: order.total,
      method: "bank_transfer",
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Payment record created for order");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    completed: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Orders ({orders.length})</h2>
        <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchOrders}>Refresh</Button>
      </div>
      {orders.map(order => (
        <div key={order.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">{order.profile?.full_name || "Unknown"}</p>
              {order.profile?.phone && <p className="text-xs text-muted-foreground">📞 {order.profile.phone}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-gold">₦{order.total?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={statusColors[order.status] || "bg-secondary text-foreground"}>{order.status}</Badge>
            <select
              value={order.status}
              onChange={e => updateStatus(order.id, e.target.value)}
              className="text-xs rounded-md bg-secondary border border-border px-2 py-1 text-foreground"
            >
              {["pending", "processing", "shipped", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="outline" className="text-xs border-gold/30 text-gold" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              {expandedOrder === order.id ? "Collapse" : "Details"}
            </Button>
            <Button size="sm" variant="outline" className="text-xs border-blue-500/30 text-blue-400" onClick={() => createPaymentForOrder(order)}>
              + Payment
            </Button>
          </div>

          {expandedOrder === order.id && (
            <div className="space-y-2 pt-2 border-t border-border">
              {/* Order Items */}
              {order.items && Array.isArray(order.items) && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Items:</p>
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-secondary/50 rounded p-2">
                      <span className="text-foreground">{item.name || "Product"} × {item.quantity || 1}</span>
                      <span className="text-gold">₦{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Delivery Info */}
              {order.profile?.delivery_address && (
                <div className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                  <p className="font-medium">Delivery:</p>
                  <p>{order.profile.delivery_address}, {order.profile.delivery_lga}, {order.profile.delivery_state}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {orders.length === 0 && <p className="text-muted-foreground text-center py-10">No orders yet.</p>}
    </div>
  );
}
