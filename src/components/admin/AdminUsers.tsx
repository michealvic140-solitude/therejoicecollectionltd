import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format";
import { Send, Eye, Ban, AlertTriangle, MessageSquare, Pencil } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", username: "", phone: "", address: "", state: "", city: "", lga: "", landmark: "", dob: "" });
  const [msgDialog, setMsgDialog] = useState<string | null>(null);
  const [broadcastDialog, setBroadcastDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status } as any).eq("user_id", userId);
    if (status === "Banned") {
      await supabase.from("notifications").insert({
        user_id: userId, title: "Account Banned",
        message: "Your account has been banned. Please contact support for more information.",
        type: "error", link: "/chat",
      } as any);
    }
    toast.success(`User status updated to ${status}`);
    fetchUsers();
  };

  const updateBadge = async (userId: string, badge: string) => {
    await supabase.from("profiles").update({ badge } as any).eq("user_id", userId);
    toast.success(`Badge updated to ${badge}`);
    fetchUsers();
  };

  const toggleRestriction = async (user: any) => {
    const restricted = !user.restricted;
    await supabase.from("profiles").update({ restricted } as any).eq("user_id", user.user_id);
    await supabase.from("notifications").insert({
      user_id: user.user_id,
      title: restricted ? "Account Restricted" : "Restriction Removed",
      message: restricted ? "Your account has been restricted from making purchases." : "Your purchasing restriction has been lifted.",
      type: restricted ? "warning" : "success",
    } as any);
    toast.success(restricted ? "User restricted" : "Restriction removed");
    fetchUsers();
  };

  const sendWarning = async (userId: string, warning: string) => {
    await supabase.from("profiles").update({ warning_message: warning } as any).eq("user_id", userId);
    await supabase.from("notifications").insert({
      user_id: userId, title: "⚠️ Warning", message: warning, type: "warning",
    } as any);
    toast.success("Warning sent");
  };

  const sendPrivateMessage = async (userId: string) => {
    if (!message.trim()) return;
    await supabase.from("notifications").insert({
      user_id: userId, title: msgTitle || "Message from Admin", message, type: "info",
    } as any);
    toast.success("Message sent");
    setMsgDialog(null); setMessage(""); setMsgTitle("");
  };

  const broadcastMessage = async () => {
    if (!message.trim()) return;
    const inserts = users.map(u => ({ user_id: u.user_id, title: msgTitle || "Announcement", message, type: "info" as const }));
    await supabase.from("notifications").insert(inserts as any);
    toast.success(`Message sent to ${users.length} users`);
    setBroadcastDialog(false); setMessage(""); setMsgTitle("");
  };

  const viewUserProfile = async (user: any) => {
    setSelectedUser(user);
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.user_id).order("created_at", { ascending: false });
    setUserOrders(data || []);
  };

  const openEditProfile = (user: any) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name || "",
      username: user.username || "",
      phone: user.phone || "",
      address: user.address || user.home_address || "",
      state: user.state || "",
      city: user.city || "",
      lga: user.lga || "",
      landmark: user.landmark || user.delivery_landmarks || "",
      dob: user.dob || user.date_of_birth || "",
    });
  };

  const saveEditProfile = async () => {
    if (!editUser) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      username: editForm.username,
      phone: editForm.phone,
      address: editForm.address,
      home_address: editForm.address,
      state: editForm.state,
      city: editForm.city,
      lga: editForm.lga,
      landmark: editForm.landmark,
      delivery_landmarks: editForm.landmark,
      dob: editForm.dob || null,
      date_of_birth: editForm.dob || null,
    } as any).eq("user_id", editUser.user_id);
    if (error) { toast.error("Failed to update: " + error.message); return; }
    toast.success("Profile updated");
    setEditUser(null);
    fetchUsers();
  };

  const badgeColors: Record<string, string> = {
    VIP: "bg-gold text-primary-foreground",
    Verified: "bg-blue-500/20 text-blue-400",
    Regular: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Users ({users.length})</h2>
        <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={() => setBroadcastDialog(true)}>
          <Send className="h-3 w-3 mr-1" /> Broadcast Message
        </Button>
      </div>

      {users.map(u => (
        <div key={u.id} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-semibold text-foreground">{u.full_name || "No name"}</p>
              <p className="text-xs text-muted-foreground">{u.username || "No username"} · {u.phone || "No phone"}</p>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={badgeColors[u.badge] || badgeColors.Regular}>{u.badge || "Regular"}</Badge>
              {u.status === "Banned" && <Badge variant="destructive">Banned</Badge>}
              {u.restricted && <Badge className="bg-orange-500/20 text-orange-400">Restricted</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={u.status || "Active"} onValueChange={v => updateStatus(u.user_id, v)}>
              <SelectTrigger className="w-[120px] text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
                <SelectItem value="Frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={u.badge || "Regular"} onValueChange={v => updateBadge(u.user_id, v)}>
              <SelectTrigger className="w-[120px] text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => toggleRestriction(u)} title={`${u.restricted ? "Unrestrict" : "Restrict"}`}>
              <Ban className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => { const msg = prompt("Enter warning message:"); if (msg) sendWarning(u.user_id, msg); }} title="Send Warning">
              <AlertTriangle className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setMsgDialog(u.user_id)} title="Private Message">
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => openEditProfile(u)} title="Edit Profile">
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => viewUserProfile(u)} title="View Profile">
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {/* Edit Profile Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User Profile</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>Username</Label><Input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>Date of Birth</Label><Input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>State</Label><Input value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>City</Label><Input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>LGA</Label><Input value={editForm.lga} onChange={e => setEditForm({...editForm, lga: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>Landmark</Label><Input value={editForm.landmark} onChange={e => setEditForm({...editForm, landmark: e.target.value})} className="bg-secondary border-border" /></div>
            <div><Label>Full Address</Label><Input value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="bg-secondary border-border" /></div>
            <Button className="gradient-gold text-primary-foreground w-full" onClick={saveEditProfile}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Private Message Dialog */}
      <Dialog open={!!msgDialog} onOpenChange={() => setMsgDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Private Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Message title" className="bg-secondary border-border" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." className="bg-secondary border-border" /></div>
            <Button className="gradient-gold text-primary-foreground w-full" onClick={() => { if (msgDialog) sendPrivateMessage(msgDialog); }}>
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Broadcast to All Users</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Announcement title" className="bg-secondary border-border" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." className="bg-secondary border-border" /></div>
            <Button className="gradient-gold text-primary-foreground w-full" onClick={broadcastMessage}>
              <Send className="h-4 w-4 mr-1" /> Send to {users.length} users
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedUser.full_name || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedUser.phone || "N/A"}</span></div>
                <div><span className="text-muted-foreground">State:</span> <span className="text-foreground">{selectedUser.state || "N/A"}</span></div>
                <div><span className="text-muted-foreground">LGA:</span> <span className="text-foreground">{selectedUser.lga || "N/A"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{selectedUser.home_address || selectedUser.address || "N/A"}</span></div>
                <div><span className="text-muted-foreground">Badge:</span> <span className="text-foreground">{selectedUser.badge || "Regular"}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground">{selectedUser.status || "Active"}</span></div>
                <div><span className="text-muted-foreground">Joined:</span> <span className="text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
              </div>

              <h4 className="font-semibold text-foreground mt-4">Orders ({userOrders.length})</h4>
              {userOrders.slice(0, 5).map((o: any) => (
                <div key={o.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                    <Badge variant="outline" className="text-xs">{o.status}</Badge>
                  </div>
                  <p className="text-gold font-bold">{formatPrice(o.total)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
