import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Handshake } from "lucide-react";
import { toast } from "sonner";

export function AdminNegotiations() {
  const [items, setItems] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("negotiations").select("*, products(name)").order("created_at", { ascending: false });
    if (data) {
      const userIds = [...new Set(data.map(n => n.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setItems(data.map(n => ({ ...n, user_name: map.get(n.user_id) || "Unknown" })));
    }
  };

  const respond = async (id: string, status: string) => {
    const { error } = await supabase.from("negotiations").update({
      status,
      admin_response: responses[id] || (status === "accepted" ? "Offer accepted!" : "Offer declined."),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    toast.success(`Negotiation ${status}`);
    fetch();
  };

  const statusColor = (s: string) => s === "accepted" ? "bg-green-500/20 text-green-400" : s === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400";

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
        <Handshake className="h-5 w-5 text-gold" /> Negotiations ({items.length})
      </h2>
      {items.map(n => (
        <div key={n.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{n.user_name}</span>
            <Badge className={statusColor(n.status)}>{n.status}</Badge>
          </div>
          <p className="text-sm text-foreground">Product: {n.products?.name || "Unknown"}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Original: <span className="text-foreground">₦{Number(n.original_price).toLocaleString()}</span></span>
            <span className="text-muted-foreground">Offered: <span className="text-gold font-bold">₦{Number(n.offered_price).toLocaleString()}</span></span>
          </div>
          {n.admin_response && <p className="text-xs text-muted-foreground bg-secondary/50 rounded p-2">Admin: {n.admin_response}</p>}
          {n.status === "pending" && (
            <div className="space-y-2 pt-2">
              <Textarea placeholder="Response (optional)" value={responses[n.id] || ""} onChange={e => setResponses(prev => ({ ...prev, [n.id]: e.target.value }))} className="bg-secondary border-border min-h-[50px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => respond(n.id, "accepted")}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => respond(n.id, "rejected")}>Reject</Button>
              </div>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-muted-foreground py-10">No negotiations yet.</p>}
    </div>
  );
}
