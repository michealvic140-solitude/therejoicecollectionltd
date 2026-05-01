import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

const REFUND_STATUSES = [
  "pending",
  "Reviewing Payment",
  "Refund In Progress",
  "Escalating Refund",
  "Refunded",
  "Refund Denied",
];

export function AdminRefunds() {
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("refunds").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setItems(data.map(r => ({ ...r, user_name: map.get(r.user_id) || "Unknown" })));
    }
  };

  const update = async (refund: any, status: string) => {
    const { error } = await supabase.from("refunds")
      .update({ status, admin_notes: notes[refund.id] || refund.admin_notes || null, updated_at: new Date().toISOString() })
      .eq("id", refund.id);
    if (error) { toast.error("Failed"); return; }

    // Sync the linked order
    if (refund.order_id) {
      const orderUpdate: any = { refund_status: status };
      if (status === "Refunded") orderUpdate.status = "Refunded";
      else if (status === "Refund Denied") orderUpdate.status = "Refund Denied";
      else if (["Reviewing Payment", "Refund In Progress", "Escalating Refund"].includes(status)) {
        orderUpdate.status = status;
      }
      await supabase.from("orders").update(orderUpdate).eq("id", refund.order_id);
    }

    // Notify user
    await supabase.from("notifications").insert({
      user_id: refund.user_id,
      title: `Refund: ${status}`,
      message: status === "Refunded"
        ? `Your refund of ₦${Number(refund.amount).toLocaleString()} has been processed.`
        : status === "Refund Denied"
        ? `Your refund request was denied. ${notes[refund.id] || refund.admin_notes || ""}`.trim()
        : `Your refund status is now: ${status}.`,
      type: status === "Refunded" ? "success" : status === "Refund Denied" ? "error" : "info",
      link: "/orders",
    });

    toast.success(`Refund status: ${status}`);
    fetchAll();
  };

  const statusColor = (s: string) =>
    s === "Refunded" ? "bg-green-500/20 text-green-400" :
    s === "Refund Denied" ? "bg-red-500/20 text-red-400" :
    s === "Refund In Progress" ? "bg-blue-500/20 text-blue-400" :
    s === "Escalating Refund" ? "bg-orange-500/20 text-orange-400" :
    s === "Reviewing Payment" ? "bg-purple-500/20 text-purple-400" :
    "bg-yellow-500/20 text-yellow-400";

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-gold" /> Refund Requests ({items.length})
      </h2>
      {items.map(r => (
        <div key={r.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-medium text-foreground">{r.user_name}</span>
              <p className="text-xs text-muted-foreground">Order: {r.order_id?.slice(0, 8)}...</p>
            </div>
            <Badge className={statusColor(r.status)}>{r.status}</Badge>
          </div>
          <p className="text-sm text-gold font-bold">₦{Number(r.amount).toLocaleString()}</p>
          {r.reason && <p className="text-sm text-muted-foreground">Reason: {r.reason}</p>}
          {r.admin_notes && <p className="text-xs bg-secondary/50 rounded p-2 text-muted-foreground">Admin: {r.admin_notes}</p>}

          <div className="space-y-2 pt-2 border-t border-border">
            <Textarea
              placeholder="Admin notes / reason (sent to user on denial)..."
              value={notes[r.id] ?? ""}
              onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
              className="bg-secondary border-border min-h-[50px] text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Select value={r.status} onValueChange={v => update(r, v)}>
                <SelectTrigger className="w-[220px] bg-secondary border-border text-xs">
                  <SelectValue placeholder="Set refund status" />
                </SelectTrigger>
                <SelectContent>
                  {REFUND_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => update(r, "Refunded")}>Mark Refunded</Button>
              <Button size="sm" variant="destructive" onClick={() => update(r, "Refund Denied")}>Deny</Button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No refund requests.</p>}
    </div>
  );
}
