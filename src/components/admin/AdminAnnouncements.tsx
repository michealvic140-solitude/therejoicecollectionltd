import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function AdminAnnouncements() {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  const create = async () => {
    if (!message.trim()) { toast.error("Message required"); return; }
    const { error } = await supabase.from("announcements").insert({ message });
    if (error) { toast.error(error.message); return; }
    toast.success("Announcement created!");
    setShow(false);
    setMessage("");
    fetch();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("announcements").update({ active: !active }).eq("id", id);
    fetch();
  };

  const del = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("Deleted");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold" /> Announcements ({items.length})
        </h2>
        <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => setShow(!show)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      {show && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <Textarea placeholder="Announcement message..." value={message} onChange={e => setMessage(e.target.value)} className="bg-secondary border-border min-h-[80px]" />
          <Button className="gradient-gold text-primary-foreground w-full" onClick={create}>Post Announcement</Button>
        </div>
      )}
      {items.map(a => (
        <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-foreground">{a.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge className={a.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} onClick={() => toggle(a.id, a.active)} style={{ cursor: "pointer" }}>
              {a.active ? "Active" : "Inactive"}
            </Badge>
            <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => del(a.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && !show && <p className="text-center text-muted-foreground py-10">No announcements yet.</p>}
    </div>
  );
}
