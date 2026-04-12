import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setOrders(data); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    const { data } = await supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Orders ({orders.length})</h2>
      {orders.map(order => (
        <div key={order.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
              <p className="text-sm text-muted-foreground">{order.profiles?.full_name || "Unknown"}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gold">₱{order.total?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize border-gold/30 text-gold">{order.status}</Badge>
            <select
              value={order.status}
              onChange={e => updateStatus(order.id, e.target.value)}
              className="text-xs rounded-md bg-secondary border border-border px-2 py-1 text-foreground"
            >
              {["pending", "processing", "shipped", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-muted-foreground text-center py-10">No orders yet.</p>}
    </div>
  );
}
