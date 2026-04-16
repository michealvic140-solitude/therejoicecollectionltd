import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";

interface ChatUser {
  user_id: string;
  user_name: string;
  last_message: string;
  last_time: string;
}

interface ChatMsg {
  id: string;
  message: string;
  is_admin: boolean;
  is_system: boolean;
  created_at: string;
  user_id: string;
}

export function AdminChats() {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchChatUsers = async () => {
    const { data } = await supabase.from("chats").select("user_id, message, created_at").order("created_at", { ascending: false });
    if (!data) return;
    const userMap = new Map<string, ChatUser>();
    for (const msg of data as any[]) {
      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          user_name: "",
          last_message: msg.message,
          last_time: msg.created_at,
        });
      }
    }
    const userIds = [...userMap.keys()];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          const u = userMap.get(p.user_id);
          if (u) u.user_name = p.full_name;
        });
      }
    }
    setChatUsers([...userMap.values()]);
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase.from("chats").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMsg[]);
  };

  useEffect(() => { fetchChatUsers(); }, []);
  useEffect(() => { if (selectedUserId) fetchMessages(selectedUserId); }, [selectedUserId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUserId) return;
    await supabase.from("chats").insert({ user_id: selectedUserId, message: `[ADMIN] ${input.trim()}`, is_admin: true } as any);
    setInput("");
    fetchMessages(selectedUserId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* User List */}
      <div className="glass-card rounded-xl p-4 overflow-y-auto space-y-2">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Customer Chats
        </h3>
        {chatUsers.map(u => (
          <button
            key={u.user_id}
            onClick={() => setSelectedUserId(u.user_id)}
            className={`w-full text-left p-3 rounded-lg transition-all ${selectedUserId === u.user_id ? "bg-gold/10 border border-gold/30" : "hover:bg-secondary"}`}
          >
            <p className="font-medium text-foreground text-sm">{u.user_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground truncate">{u.last_message}</p>
          </button>
        ))}
        {chatUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No conversations yet</p>}
      </div>

      {/* Messages */}
      <div className="md:col-span-2 glass-card rounded-xl p-4 flex flex-col">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">
          {selectedUserId ? "Conversation" : "Select a chat"}
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.is_admin ? "gradient-gold text-primary-foreground" : msg.is_system ? "bg-blue-500/20 text-blue-300" : "bg-secondary text-foreground"}`}>
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {selectedUserId && (
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Reply..." className="flex-1 bg-secondary border-border" />
            <Button type="submit" className="gradient-gold text-primary-foreground"><Send className="h-4 w-4" /></Button>
          </form>
        )}
      </div>
    </div>
  );
}
