import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { Eye, Check, X, CreditCard } from "lucide-react";
import { toast } from "sonner";

const PAYMENT_STATUSES = [
  "Pending Payment", "Payment Confirmed", "Refunded", "Refund In Progress",
  "Escalating Refund", "Reviewing Payment", "Refund Denied",
];

export function AdminPayments() {
  const [orders, setOrders] = useState<any[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [declineMsg, setDeclineMsg] = useState("");
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const approvePayment = async (order: any) => {
    await supabase.from("orders").update({ status: "Payment Confirmed" } as any).eq("id", order.id);
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      title: "Payment Approved",
      message: `Your payment for order #${order.id.slice(0, 8)} has been approved! Your order is now being processed.`,
      type: "success",
      link: "/orders",
    } as any);
    toast.success("Payment approved");
    fetchOrders();
  };

  const setPaymentStatus = async (order: any, status: string) => {
    await supabase.from("orders").update({ status, refund_status: status.toLowerCase().includes("refund") ? status : null } as any).eq("id", order.id);
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      title: `Payment status: ${status}`,
      message: `Your order #${order.id.slice(0, 8)} payment status was updated to: ${status}`,
      type: status === "Refunded" ? "success" : status === "Refund Denied" ? "error" : "info",
      link: "/orders",
    } as any);
    toast.success(`Status: ${status}`);
    fetchOrders();
  };

  const declinePayment = async (orderId: string, userId: string) => {
    await supabase.from("orders").update({ status: "Pending Payment", cancellation_reason: declineMsg } as any).eq("id", orderId);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Payment Declined",
      message: `Your payment for order #${orderId.slice(0, 8)} was declined. Reason: ${declineMsg || "No reason provided"}`,
      type: "error",
      link: "/orders",
    } as any);
    toast.success("Payment declined");
    setDecliningId(null);
    setDeclineMsg("");
    fetchOrders();
  };

  const paymentOrders = orders.filter((o: any) =>
    (o.screenshot_url && o.screenshot_url.trim() !== "") || o.status === "Pending Payment" ||
    PAYMENT_STATUSES.includes(o.status)
  );

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-gold" /> Payment Verification ({paymentOrders.length})
      </h2>

      {paymentOrders.length === 0 && (
        <p className="text-center text-muted-foreground py-10">No pending payments.</p>
      )}

      {paymentOrders.map(order => {
        const hasScreenshot = order.screenshot_url && order.screenshot_url.trim() !== "";
        return (
          <div key={order.id} className="glass-card rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                <p className="text-sm text-foreground">by {order.user_name || "Unknown"}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasScreenshot ? (
                  <Badge className="bg-green-500/20 text-green-400">Proof Uploaded</Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400">No Proof</Badge>
                )}
                <Badge variant="outline">{order.status}</Badge>
              </div>
            </div>
            
            <p className="text-gold font-bold">{formatPrice(order.total)}</p>

            <div className="flex items-center gap-2 flex-wrap">
              {hasScreenshot && (
                <Button size="sm" variant="outline" className="text-xs border-blue-500/30 text-blue-400" onClick={() => setViewImage(order.screenshot_url)}>
                  <Eye className="h-3 w-3 mr-1" /> View Proof
                </Button>
              )}
              {order.status === "Pending Payment" && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approvePayment(order)}>
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDecliningId(order.id)}>
                    <X className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </>
              )}
            </div>

            {order.cancellation_reason && (
              <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">
                Decline reason: {order.cancellation_reason}
              </p>
            )}
          </div>
        );
      })}

      {/* View Image Dialog */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Payment Proof</DialogTitle></DialogHeader>
          {viewImage && <img src={viewImage} alt="Payment proof" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={!!decliningId} onOpenChange={() => setDecliningId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Decline Payment</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Reason for declining..."
            value={declineMsg}
            onChange={e => setDeclineMsg(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button variant="destructive" onClick={() => {
            const order = orders.find(o => o.id === decliningId);
            if (order) declinePayment(order.id, order.user_id);
          }}>
            Confirm Decline
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
