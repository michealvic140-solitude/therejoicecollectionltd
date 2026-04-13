import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminPopupAds() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", image_url: "", link_url: "" });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("popup_ads").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("popup_ads").insert({
      title: form.title,
      content: form.content || null,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Popup ad created!");
    setShow(false);
    setForm({ title: "", content: "", image_url: "", link_url: "" });
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("popup_ads").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("popup_ads").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-gold" /> Popup Ads ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Input placeholder="Ad Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
          <Textarea placeholder="Content/Message" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="bg-secondary border-border min-h-[60px]" />
          <Input placeholder="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="bg-secondary border-border" />
          <Input placeholder="Link URL" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} className="bg-secondary border-border" />
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Create Popup Ad</Button>
        </div>
      )}
      {items.map(a => (
        <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{a.title}</p>
            {a.content && <p className="text-xs text-muted-foreground line-clamp-1">{a.content}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={a.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(a.id, a.active)} style={{ cursor: "pointer" }}>
              {a.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(a.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No popup ads yet.</p>}
    </div>
  );
}
