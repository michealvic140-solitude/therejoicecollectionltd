import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { Eye, MapPin, Store } from "lucide-react";
import { toast } from "sonner";

const statuses = [
  "Pending Payment", "Payment Confirmed", "Processing", "Shipped", "Delivered", "Cancelled",
  "Refunded", "Refund In Progress", "Escalating Refund", "Reviewing Payment", "Refund Denied",
];

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string, userId?: string) => {
    await supabase.from("orders").update({ status } as any).eq("id", orderId);
    if (userId) {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Order Status Updated",
        message: `Your order #${orderId.slice(0, 8)} status has been updated to: ${status}`,
        type: "info",
        link: "/orders",
      } as any);
    }
    toast.success(`Order updated to ${status}`);
    fetchOrders();
  };

  const statusColor = (s: string) => {
    if (s === "Delivered" || s === "Refunded") return "bg-green-500/20 text-green-400";
    if (s === "Cancelled" || s === "Refund Denied") return "bg-red-500/20 text-red-400";
    if (s === "Shipped") return "bg-purple-500/20 text-purple-400";
    if (s === "Processing") return "bg-blue-500/20 text-blue-400";
    if (s === "Payment Confirmed") return "bg-emerald-500/20 text-emerald-400";
    if (s === "Refund In Progress" || s === "Reviewing Payment") return "bg-orange-500/20 text-orange-400";
    if (s === "Escalating Refund") return "bg-pink-500/20 text-pink-400";
    return "bg-yellow-500/20 text-yellow-400";
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Orders ({orders.length})</h2>
      {orders.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        return (
          <div key={order.id} className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                <p className="font-semibold text-foreground">{order.user_name || "Unknown"}</p>
              </div>
              <div className="flex items-center gap-2">
                {order.screenshot_url && (
                  <Button size="sm" variant="outline" className="text-xs border-blue-500/30 text-blue-400" onClick={() => setViewImage(order.screenshot_url)}>
                    <Eye className="h-3 w-3 mr-1" /> Proof
                  </Button>
                )}
                <Select value={order.status} onValueChange={v => updateStatus(order.id, v, order.user_id)}>
                  <SelectTrigger className="w-[180px] text-xs bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery / Pickup Info */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {order.delivery_method === "pickup" ? <Store className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                {order.delivery_method === "pickup" ? "Pickup" : "Delivery"}
              </Badge>
              <Badge className={statusColor(order.status)}>{order.status}</Badge>
            </div>

            {order.delivery_method === "pickup" ? (
              <p className="text-xs text-muted-foreground">Location: {order.pickup_location || "Not specified"}</p>
            ) : (
              <div className="text-xs text-muted-foreground space-y-1">
                {order.delivery_address && <p>Address: {order.delivery_address}</p>}
                {(order.delivery_city || order.delivery_state) && (
                  <p>{[order.delivery_city, order.delivery_state].filter(Boolean).join(", ")}</p>
                )}
                {!order.delivery_address && !order.delivery_city && !order.delivery_state && (
                  <p className="italic">No address provided</p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              {(items as any[]).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm bg-secondary/50 rounded p-2">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="text-gold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold text-gold">Total: {formatPrice(order.total)}</span>
              <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
        );
      })}

      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {viewImage && <img src={viewImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
