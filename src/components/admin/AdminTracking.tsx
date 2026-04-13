import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck } from "lucide-react";
import { toast } from "sonner";

export function AdminTracking() {
  const [items, setItems] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ tracking_number: "", carrier: "", status: "", notes: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("tracking").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setItems(data.map(t => ({ ...t, user_name: map.get(t.user_id) || "Unknown" })));
    }
  };

  const save = async (id: string) => {
    const { error } = await supabase.from("tracking").update({ ...editData, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success("Updated!");
    setEditId(null);
    fetch();
  };

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-500/20 text-yellow-400",
    shipped: "bg-blue-500/20 text-blue-400",
    in_transit: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <Truck className="h-5 w-5 text-gold" /> Order Tracking ({items.length})
      </h2>
      {items.map(t => (
        <div key={t.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{t.user_name}</span>
            <Badge className={statusColors[t.status] || "bg-secondary text-foreground"}>{t.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Order: {t.order_id?.slice(0, 8)}...</p>
          {t.tracking_number && <p className="text-sm text-foreground">Tracking #: {t.tracking_number}</p>}
          {t.carrier && <p className="text-xs text-muted-foreground">Carrier: {t.carrier}</p>}
          {editId === t.id ? (
            <div className="space-y-2 pt-2">
              <Input placeholder="Tracking Number" value={editData.tracking_number} onChange={e => setEditData(d => ({ ...d, tracking_number: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Carrier" value={editData.carrier} onChange={e => setEditData(d => ({ ...d, carrier: e.target.value }))} className="bg-secondary border-border" />
              <Select value={editData.status} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["processing", "shipped", "in_transit", "delivered"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => save(t.id)}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={() => { setEditId(t.id); setEditData({ tracking_number: t.tracking_number || "", carrier: t.carrier || "", status: t.status, notes: t.notes || "" }); }}>Edit</Button>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No tracking entries yet.</p>}
    </div>
  );
}
