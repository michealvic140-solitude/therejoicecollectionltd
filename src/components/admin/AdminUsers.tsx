import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, CheckCircle, Eye } from "lucide-react";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status } as any).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`User ${status === "Banned" ? "banned" : "activated"}`);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-foreground">Users ({users.length})</h2>

      {selectedUser && (
        <div className="glass-card rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">User Details</h3>
            <Button size="sm" variant="outline" onClick={() => setSelectedUser(null)}>Close</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedUser.full_name || "N/A"}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedUser.phone || "N/A"}</span></div>
            <div><span className="text-muted-foreground">State:</span> <span className="text-foreground">{selectedUser.state || "N/A"}</span></div>
            <div><span className="text-muted-foreground">LGA:</span> <span className="text-foreground">{selectedUser.lga || "N/A"}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{selectedUser.home_address || "N/A"}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Delivery:</span> <span className="text-foreground">{selectedUser.delivery_address || "N/A"}</span></div>
            <div><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{selectedUser.date_of_birth || "N/A"}</span></div>
            <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
          </div>
        </div>
      )}

      {users.map(u => (
        <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{u.full_name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground">{u.phone || u.user_id?.slice(0, 12) + "..."}</p>
          </div>
          <div className="flex items-center gap-2">
            {u.user_roles?.map((r: any, i: number) => (
              <Badge key={i} className="gradient-gold text-primary-foreground">{r.role}</Badge>
            ))}
            <Badge variant="outline" className={u.status === "Banned" ? "border-destructive text-destructive" : "border-gold/30 text-gold"}>
              {u.status || "Active"}
            </Badge>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)}>
              <Eye className="h-4 w-4" />
            </Button>
            {u.status === "Banned" ? (
              <Button size="sm" variant="outline" className="border-green-500/30 text-green-400" onClick={() => updateStatus(u.user_id, "Active")}>
                <CheckCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-destructive/30 text-destructive" onClick={() => updateStatus(u.user_id, "Banned")}>
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
