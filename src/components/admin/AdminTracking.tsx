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
  const [editData, setEditData] = useState({ tracking_number: "", carrier: "", status: "", notes: "", estimated_delivery: "" });

  useEffect(() => { fetchTracking(); }, []);

  const fetchTracking = async () => {
    const { data } = await supabase.from("tracking").select("*").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const orderIds = [...new Set(data.filter(t => t.order_id).map(t => t.order_id))];
      
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone, delivery_address, delivery_state, delivery_lga").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const { data: orders } = orderIds.length > 0 
        ? await supabase.from("orders").select("id, total, status, items").in("id", orderIds)
        : { data: [] };
      const orderMap = new Map(orders?.map(o => [o.id, o]) || []);
      
      setItems(data.map(t => ({ 
        ...t, 
        profile: profileMap.get(t.user_id) || {},
        order: orderMap.get(t.order_id) || null,
      })));
    }
  };

  const save = async (id: string) => {
    const { error } = await supabase.from("tracking").update({ 
      ...editData, 
      estimated_delivery: editData.estimated_delivery || null,
      updated_at: new Date().toISOString() 
    }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success("Tracking updated!");
    setEditId(null);
    fetchTracking();
  };

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-500/20 text-yellow-400",
    shipped: "bg-blue-500/20 text-blue-400",
    in_transit: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Truck className="h-5 w-5 text-gold" /> Order Tracking ({items.length})
        </h2>
        <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchTracking}>Refresh</Button>
      </div>
      {items.map(t => (
        <div key={t.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-foreground">{t.profile?.full_name || "Unknown"}</span>
              {t.profile?.phone && <span className="text-xs text-muted-foreground ml-2">({t.profile.phone})</span>}
            </div>
            <Badge className={statusColors[t.status] || "bg-secondary text-foreground"}>{t.status}</Badge>
          </div>
          
          {t.order_id && (
            <p className="text-xs text-muted-foreground">
              Order: #{t.order_id.slice(0, 8)} 
              {t.order && <span> — ₦{t.order.total?.toLocaleString()} — {t.order.status}</span>}
            </p>
          )}
          
          {t.profile?.delivery_address && (
            <p className="text-xs text-muted-foreground">📍 {t.profile.delivery_address}, {t.profile.delivery_lga}, {t.profile.delivery_state}</p>
          )}
          
          {t.tracking_number && <p className="text-sm text-foreground">Tracking #: <span className="font-mono text-gold">{t.tracking_number}</span></p>}
          {t.carrier && <p className="text-xs text-muted-foreground">Carrier: {t.carrier}</p>}
          {t.estimated_delivery && <p className="text-xs text-muted-foreground">ETA: {new Date(t.estimated_delivery).toLocaleDateString()}</p>}
          {t.notes && <p className="text-xs text-muted-foreground bg-secondary/30 rounded p-2">Notes: {t.notes}</p>}
          
          {editId === t.id ? (
            <div className="space-y-2 pt-2 border-t border-border">
              <Input placeholder="Tracking Number" value={editData.tracking_number} onChange={e => setEditData(d => ({ ...d, tracking_number: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Carrier (e.g. GIG, DHL)" value={editData.carrier} onChange={e => setEditData(d => ({ ...d, carrier: e.target.value }))} className="bg-secondary border-border" />
              <Select value={editData.status} onValueChange={v => setEditData(d => ({ ...d, status: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["processing", "shipped", "in_transit", "delivered"].map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" placeholder="Estimated Delivery" value={editData.estimated_delivery} onChange={e => setEditData(d => ({ ...d, estimated_delivery: e.target.value }))} className="bg-secondary border-border" />
              <Input placeholder="Notes" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} className="bg-secondary border-border" />
              <div className="flex gap-2">
                <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => save(t.id)}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={() => { setEditId(t.id); setEditData({ tracking_number: t.tracking_number || "", carrier: t.carrier || "", status: t.status, notes: t.notes || "", estimated_delivery: t.estimated_delivery ? t.estimated_delivery.split("T")[0] : "" }); }}>Edit Tracking</Button>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No tracking entries yet. Tracking is auto-created when orders are marked as processing or shipped.</p>}
    </div>
  );
}
