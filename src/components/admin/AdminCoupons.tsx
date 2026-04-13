import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ticket, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminCoupons() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "0", min_purchase: "0", max_uses: "0", expires_at: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.code.trim()) { toast.error("Code required"); return; }
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      min_purchase: Number(form.min_purchase),
      max_uses: Number(form.max_uses),
      expires_at: form.expires_at || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created!");
    setShow(false);
    setForm({ code: "", type: "percentage", value: "0", min_purchase: "0", max_uses: "0", expires_at: "" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Ticket className="h-5 w-5 text-gold" /> Coupons ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Input placeholder="Coupon Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="bg-secondary border-border" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Value" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" placeholder="Min Purchase" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} className="bg-secondary border-border" />
            <Input type="number" placeholder="Max Uses" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} className="bg-secondary border-border" />
            <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Create Coupon</Button>
        </div>
      )}
      {items.map(c => (
        <div key={c.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-mono font-bold text-gold">{c.code}</p>
            <p className="text-xs text-muted-foreground">
              {c.type === "percentage" ? `${c.value}% off` : `₦${Number(c.value).toLocaleString()} off`}
              {Number(c.min_purchase) > 0 && ` · Min ₦${Number(c.min_purchase).toLocaleString()}`}
              {" · "}{c.used_count}/{c.max_uses || "∞"} used
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={c.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(c.id, c.active)} style={{ cursor: "pointer" }}>
              {c.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No coupons yet.</p>}
    </div>
  );
}
