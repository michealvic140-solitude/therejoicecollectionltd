import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disc3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminSpinWheels() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ label: "", prize_type: "discount", prize_value: "", probability: "10" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("spin_wheels").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.label.trim()) { toast.error("Label required"); return; }
    const { error } = await supabase.from("spin_wheels").insert({
      label: form.label,
      prize_type: form.prize_type,
      prize_value: form.prize_value,
      probability: Number(form.probability),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Prize added!");
    setShow(false);
    setForm({ label: "", prize_type: "discount", prize_value: "", probability: "10" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("spin_wheels").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("spin_wheels").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Disc3 className="h-5 w-5 text-gold" /> Spin Wheel Prizes ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Input placeholder="Label (e.g. 10% Off!)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="bg-secondary border-border" />
          <div className="grid grid-cols-3 gap-2">
            <Select value={form.prize_type} onValueChange={v => setForm(f => ({ ...f, prize_type: v }))}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Discount %</SelectItem>
                <SelectItem value="fixed">Fixed ₦</SelectItem>
                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                <SelectItem value="nothing">No Prize</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Value" value={form.prize_value} onChange={e => setForm(f => ({ ...f, prize_value: e.target.value }))} className="bg-secondary border-border" />
            <Input type="number" placeholder="Probability %" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Add Prize</Button>
        </div>
      )}
      {items.map(s => (
        <div key={s.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.prize_type}: {s.prize_value} · {s.probability}% chance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={s.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(s.id, s.active)} style={{ cursor: "pointer" }}>
              {s.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(s.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No spin wheel prizes yet.</p>}
    </div>
  );
}
