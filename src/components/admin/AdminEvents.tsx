import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminEvents() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", start_date: "", end_date: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Event created!");
    setShow(false);
    setForm({ title: "", description: "", image_url: "", start_date: "", end_date: "" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("events").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gold" /> Events ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Input placeholder="Event Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
          <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border min-h-[60px]" />
          <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="bg-secondary border-border" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="datetime-local" placeholder="Start" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-secondary border-border" />
            <Input type="datetime-local" placeholder="End" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="bg-secondary border-border" />
          </div>
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Create Event</Button>
        </div>
      )}
      {items.map(e => (
        <div key={e.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{e.title}</p>
            {e.description && <p className="text-xs text-muted-foreground line-clamp-1">{e.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {e.start_date && new Date(e.start_date).toLocaleDateString()} — {e.end_date && new Date(e.end_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={e.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(e.id, e.active)} style={{ cursor: "pointer" }}>
              {e.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(e.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No events yet.</p>}
    </div>
  );
}
