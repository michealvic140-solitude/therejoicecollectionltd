import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  sender: string;
  created_at: string;
  escalated: boolean;
  admin_reply: string | null;
  replied_at: string | null;
  profiles?: { full_name: string | null };
}

export function AdminMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "escalated" | "unreplied">("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles!messages_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    
    if (data) {
      // profiles join might fail due to no FK, so let's fetch profiles separately
      const userIds = [...new Set(data.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      setMessages(data.map((m: any) => ({
        ...m,
        profiles: { full_name: profileMap.get(m.user_id) || null }
      })));
    }
  };

  const handleReply = async (msg: ChatMessage) => {
    const reply = replyInputs[msg.id]?.trim();
    if (!reply) return;

    const { error } = await supabase.from("messages").update({
      admin_reply: reply,
      replied_at: new Date().toISOString(),
    }).eq("id", msg.id);

    if (error) {
      toast.error("Failed to send reply");
      return;
    }

    // Also insert as a new message so the user sees it in their chat
    await supabase.from("messages").insert({
      user_id: msg.user_id,
      content: reply,
      sender: "admin",
    });

    toast.success("Reply sent!");
    setReplyInputs(prev => ({ ...prev, [msg.id]: "" }));
    fetchMessages();
  };

  const filtered = messages.filter(m => {
    if (m.sender === "admin") return false; // Don't show admin replies as separate entries
    if (filter === "escalated") return m.escalated;
    if (filter === "unreplied") return !m.admin_reply && m.sender !== "admin";
    return true;
  });

  const escalatedCount = messages.filter(m => m.escalated && !m.admin_reply).length;
  const unrepliedCount = messages.filter(m => !m.admin_reply && m.sender === "user").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <MessageCircle className="h-6 w-6 text-gold mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{messages.filter(m => m.sender !== "admin").length}</p>
          <p className="text-xs text-muted-foreground">Total Messages</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{escalatedCount}</p>
          <p className="text-xs text-muted-foreground">Escalated (Pending)</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{unrepliedCount}</p>
          <p className="text-xs text-muted-foreground">Unreplied</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "escalated", "unreplied"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f ? "gradient-gold text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f} {f === "escalated" && escalatedCount > 0 && `(${escalatedCount})`}
          </button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto border-gold/30 text-gold" onClick={fetchMessages}>
          Refresh
        </Button>
      </div>

      {/* Messages */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filtered.map(msg => (
          <div key={msg.id} className={`glass-card rounded-xl p-4 space-y-3 ${msg.escalated ? "border-orange-500/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground text-sm">{msg.profiles?.full_name || "Unknown User"}</span>
                {msg.escalated && (
                  <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> AI Escalated
                  </Badge>
                )}
                {msg.sender === "system" && (
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">System</Badge>
                )}
                {msg.admin_reply && (
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" /> Replied
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
            </div>
            
            <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">{msg.content}</p>

            {msg.admin_reply && (
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <p className="text-xs text-green-400 mb-1 font-medium">Admin Reply ({msg.replied_at ? new Date(msg.replied_at).toLocaleString() : ""})</p>
                <p className="text-sm text-foreground">{msg.admin_reply}</p>
              </div>
            )}

            {!msg.admin_reply && msg.sender !== "admin" && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyInputs[msg.id] || ""}
                  onChange={e => setReplyInputs(prev => ({ ...prev, [msg.id]: e.target.value }))}
                  className="flex-1 bg-secondary border-border min-h-[60px] text-sm"
                />
                <Button
                  size="icon"
                  className="gradient-gold text-primary-foreground self-end"
                  onClick={() => handleReply(msg)}
                  disabled={!replyInputs[msg.id]?.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
