import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, CheckCircle, Clock, XCircle, Image, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [declineNotes, setDeclineNotes] = useState<Record<string, string>>({});

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setPayments(data.map(p => ({ ...p, profile: map.get(p.user_id) || {} })));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const notes = status === "rejected" ? (declineNotes[id] || "Payment declined by admin") : null;
    const { error } = await supabase.from("payments").update({ 
      status, 
      notes: notes || undefined,
      updated_at: new Date().toISOString() 
    }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    
    // If approved, update the order status too
    if (status === "approved") {
      const payment = payments.find(p => p.id === id);
      if (payment?.order_id) {
        await supabase.from("orders").update({ status: "processing" }).eq("id", payment.order_id);
      }
    }
    
    toast.success(`Payment ${status}`);
    fetchPayments();
  };

  const updatePaymentField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("payments").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success("Updated");
    fetchPayments();
  };

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (s === "rejected") return <XCircle className="h-4 w-4 text-red-400" />;
    return <Clock className="h-4 w-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Payments ({payments.length})</h2>
        <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchPayments}>Refresh</Button>
      </div>
      {payments.map(p => (
        <div key={p.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gold" />
              <span className="font-medium text-foreground">{p.profile?.full_name || "Unknown"}</span>
              {p.profile?.phone && <span className="text-xs text-muted-foreground">({p.profile.phone})</span>}
              <Badge variant="outline" className="text-xs">{p.method}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon(p.status)}
              <Badge className={p.status === "approved" ? "bg-green-500/20 text-green-400" : p.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}>
                {p.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gold font-bold">₦{Number(p.amount).toLocaleString()}</span>
            <span className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleString()}</span>
          </div>
          {p.order_id && <p className="text-xs text-muted-foreground">Order: #{p.order_id.slice(0, 8)}</p>}
          {p.reference && <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>}
          {p.proof_url && (
            <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
              <Image className="h-3 w-3" /> View Payment Proof <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {p.notes && <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">Notes: {p.notes}</p>}
          
          {/* Admin can edit method */}
          <div className="flex items-center gap-2 pt-1">
            <select
              value={p.method}
              onChange={e => updatePaymentField(p.id, "method", e.target.value)}
              className="text-xs rounded-md bg-secondary border border-border px-2 py-1 text-foreground"
            >
              {["bank_transfer", "card", "cash", "mobile_money", "other"].map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
            </select>
          </div>

          {p.status === "pending" && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Textarea
                placeholder="Decline reason (optional, shown to user)..."
                value={declineNotes[p.id] || ""}
                onChange={e => setDeclineNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                className="bg-secondary border-border min-h-[50px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(p.id, "approved")}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, "rejected")}>Reject</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {payments.length === 0 && <p className="text-center text-muted-foreground py-10">No payments yet.</p>}
    </div>
  );
}
