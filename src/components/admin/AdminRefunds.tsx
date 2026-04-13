import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

export function AdminRefunds() {
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("refunds").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setItems(data.map(r => ({ ...r, user_name: map.get(r.user_id) || "Unknown" })));
    }
  };

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("refunds").update({ status, admin_notes: notes[id] || null, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success(`Refund ${status}`);
    fetch();
  };

  const statusColor = (s: string) => s === "approved" ? "bg-green-500/20 text-green-400" : s === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400";

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-gold" /> Refund Requests ({items.length})
      </h2>
      {items.map(r => (
        <div key={r.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{r.user_name}</span>
            <Badge className={statusColor(r.status)}>{r.status}</Badge>
          </div>
          <p className="text-sm text-gold font-bold">₦{Number(r.amount).toLocaleString()}</p>
          {r.reason && <p className="text-sm text-muted-foreground">Reason: {r.reason}</p>}
          <p className="text-xs text-muted-foreground">Order: {r.order_id?.slice(0, 8)}...</p>
          {r.admin_notes && <p className="text-xs bg-secondary/50 rounded p-2 text-muted-foreground">Admin: {r.admin_notes}</p>}
          {r.status === "pending" && (
            <div className="space-y-2 pt-2">
              <Textarea placeholder="Admin notes..." value={notes[r.id] || ""} onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))} className="bg-secondary border-border min-h-[50px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => update(r.id, "approved")}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => update(r.id, "rejected")}>Reject</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No refund requests.</p>}
    </div>
  );
}
