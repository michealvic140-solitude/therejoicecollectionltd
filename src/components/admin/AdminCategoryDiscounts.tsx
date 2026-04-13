import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Percent, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Watches", "Bags", "Jewelry", "Accessories", "Footwear", "Clothes"];

export function AdminCategoryDiscounts() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ category: "", discount_percent: "0" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("category_discounts").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.category) { toast.error("Category required"); return; }
    const { error } = await supabase.from("category_discounts").insert({
      category: form.category,
      discount_percent: Number(form.discount_percent),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Category discount added!");
    setShow(false);
    setForm({ category: "", discount_percent: "0" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("category_discounts").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("category_discounts").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Percent className="h-5 w-5 text-gold" /> Category Discounts ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Discount %" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} className="bg-secondary border-border" />
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Add Discount</Button>
        </div>
      )}
      {items.map(d => (
        <div key={d.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{d.category}</p>
            <p className="text-gold font-bold">{d.discount_percent}% off</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={d.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(d.id, d.active)} style={{ cursor: "pointer" }}>
              {d.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(d.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No category discounts yet.</p>}
    </div>
  );
}
