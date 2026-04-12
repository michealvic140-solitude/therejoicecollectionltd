import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setUsers(data); });
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Users ({users.length})</h2>
      {users.map(u => (
        <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{u.full_name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">{u.user_id?.slice(0, 12)}...</p>
          </div>
          <div className="flex gap-2">
            {u.user_roles?.map((r: any, i: number) => (
              <Badge key={i} className="gradient-gold text-primary-foreground">{r.role}</Badge>
            ))}
            <Badge variant="outline" className={u.status === "Banned" ? "border-destructive text-destructive" : "border-gold/30 text-gold"}>
              {u.status || "Active"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
