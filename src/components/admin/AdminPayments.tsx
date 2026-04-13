import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setPayments(data.map(p => ({ ...p, user_name: map.get(p.user_id) || "Unknown" })));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Payment ${status}`);
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
              <span className="font-medium text-foreground">{p.user_name}</span>
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
          {p.reference && <p className="text-xs text-muted-foreground">Ref: {p.reference}</p>}
          {p.notes && <p className="text-xs text-muted-foreground">Notes: {p.notes}</p>}
          {p.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(p.id, "approved")}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, "rejected")}>Reject</Button>
            </div>
          )}
        </div>
      ))}
      {payments.length === 0 && <p className="text-center text-muted-foreground py-10">No payments yet.</p>}
    </div>
  );
}
