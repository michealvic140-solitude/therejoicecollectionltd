import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Clock, CheckCircle, XCircle, RotateCcw, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — The Rejoice Collection" },
      { name: "description", content: "View your order history and track every step of your delivery in real time." },
    ],
  }),
});

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [tracking, setTracking] = useState<Record<string, any[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [refundOrder, setRefundOrder] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setOrders(data);
      const ids = data.map(o => o.id);
      if (ids.length) {
        const { data: tr } = await supabase.from("order_tracking").select("*").in("order_id", ids).order("created_at", { ascending: true });
        const map: Record<string, any[]> = {};
        (tr || []).forEach(t => { if (t.order_id) (map[t.order_id] ||= []).push(t); });
        setTracking(map);
      }
    }
  };

  useEffect(() => { load(); }, [user]);

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
    const x = s?.toLowerCase() || "";
    if (x.includes("deliver") || x === "completed" || x.includes("confirm")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (x.includes("cancel") || x.includes("denied")) return <XCircle className="h-4 w-4 text-destructive" />;
    if (x.includes("ship") || x.includes("transit")) return <Truck className="h-4 w-4 text-blue-400" />;
    if (x.includes("refund")) return <RotateCcw className="h-4 w-4 text-orange-400" />;
    return <Clock className="h-4 w-4 text-gold" />;
  };

  const submitRefund = async () => {
    if (!refundOrder) return;
    const { error } = await supabase.from("refunds").insert({
      user_id: user.id,
      order_id: refundOrder.id,
      amount: refundOrder.total,
      reason: refundReason || "No reason provided",
      status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Refund request submitted");
    setRefundOrder(null);
    setRefundReason("");
    load();
  };

  const canRefund = (status: string) => {
    const x = status?.toLowerCase() || "";
    return x.includes("confirm") || x.includes("ship") || x.includes("deliver") || x === "processing";
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
            {orders.map(order => {
              const timeline = tracking[order.id] || [];
              // Always include the order creation as first node, and current status as last if missing
              const nodes = [
                { id: `${order.id}-created`, status: "Order Placed", description: "Order received", created_at: order.created_at },
                ...timeline,
              ];
              const last = nodes[nodes.length - 1];
              if (!last || last.status?.toLowerCase() !== order.status?.toLowerCase()) {
                nodes.push({ id: `${order.id}-current`, status: order.status, description: "Current status", created_at: new Date().toISOString() });
              }
              const isOpen = open[order.id];
              return (
                <div key={order.id} className="glass-card rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(order.status)}
                      <Badge variant="outline" className="capitalize border-gold/30 text-gold">{order.status}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</span>
                    <span className="font-display text-xl font-bold text-gold">{formatPrice(order.total || 0)}</span>
                  </div>
                  {order.items && Array.isArray(order.items) && (
                    <p className="text-xs text-muted-foreground">{order.items.length} item(s)</p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="border-gold/30 text-gold"
                      onClick={() => setOpen(o => ({ ...o, [order.id]: !o[order.id] }))}>
                      {isOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {isOpen ? "Hide" : "Show"} Tracking
                    </Button>
                    {canRefund(order.status) && !order.refund_status && (
                      <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-400"
                        onClick={() => setRefundOrder(order)}>
                        <RotateCcw className="h-3 w-3 mr-1" /> Request Refund
                      </Button>
                    )}
                    {order.refund_status && (
                      <Badge className="bg-orange-500/20 text-orange-400">Refund: {order.refund_status}</Badge>
                    )}
                  </div>

                  {isOpen && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs uppercase tracking-widest text-gold mb-3">Tracking Timeline</p>
                      <ol className="relative border-l-2 border-gold/20 ml-2 space-y-4">
                        {nodes.map((n, i) => {
                          const isLast = i === nodes.length - 1;
                          return (
                            <li key={n.id || i} className="ml-4">
                              <span className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ${isLast ? "bg-gold ring-4 ring-gold/20" : "bg-secondary border border-gold/40"}`}>
                                {isLast && <span className="h-1.5 w-1.5 rounded-full bg-background" />}
                              </span>
                              <p className="text-sm font-medium text-foreground capitalize">{n.status}</p>
                              {n.description && <p className="text-xs text-muted-foreground">{n.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!refundOrder} onOpenChange={() => { setRefundOrder(null); setRefundReason(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Refund</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Order #{refundOrder?.id.slice(0, 8)} — {formatPrice(refundOrder?.total || 0)}
          </p>
          <Textarea
            placeholder="Tell admin why you'd like a refund (damaged, wrong item, etc.)"
            value={refundReason}
            onChange={e => setRefundReason(e.target.value)}
            className="bg-secondary border-border min-h-[100px]"
          />
          <Button className="gradient-gold text-primary-foreground" onClick={submitRefund}>
            Submit Refund Request
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
