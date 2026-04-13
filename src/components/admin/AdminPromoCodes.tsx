import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminPromoCodes() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: "", discount_percent: "0", discount_amount: "0", max_uses: "0", expires_at: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.code.trim()) { toast.error("Code required"); return; }
    const { error } = await supabase.from("promo_codes").insert({
      code: form.code.toUpperCase(),
      discount_percent: Number(form.discount_percent),
      discount_amount: Number(form.discount_amount),
      max_uses: Number(form.max_uses),
      expires_at: form.expires_at || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Promo code created!");
    setShow(false);
    setForm({ code: "", discount_percent: "0", discount_amount: "0", max_uses: "0", expires_at: "" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_codes").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Tag className="h-5 w-5 text-gold" /> Promo Codes ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Input placeholder="Code (e.g. SAVE20)" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="bg-secondary border-border" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Discount %" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} className="bg-secondary border-border" />
            <Input type="number" placeholder="Discount ₦" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Max Uses (0=unlimited)" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} className="bg-secondary border-border" />
            <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Create Promo Code</Button>
        </div>
      )}
      {items.map(p => (
        <div key={p.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-mono font-bold text-gold">{p.code}</p>
            <p className="text-xs text-muted-foreground">
              {Number(p.discount_percent) > 0 && `${p.discount_percent}% off`}
              {Number(p.discount_amount) > 0 && ` ₦${Number(p.discount_amount).toLocaleString()} off`}
              {" · "}{p.used_count}/{p.max_uses || "∞"} used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={p.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(p.id, p.active)} style={{ cursor: "pointer" }}>
              {p.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(p.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No promo codes yet.</p>}
    </div>
  );
}
