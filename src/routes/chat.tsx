import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "Chat — The Rejoice Collection" },
      { name: "description", content: "Chat with us." },
    ],
  }),
});

function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
  }, [user]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const { error } = await supabase.from("messages").insert({ user_id: user.id, content: input, sender: "user" });
    if (error) { toast.error("Failed to send"); return; }
    setInput("");
    // Refresh
    const { data } = await supabase.from("messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to chat.</p>
          <Link to="/login" className="text-gold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-8">Chat</h1>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No messages yet. Start a conversation!</p>
            )}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.sender === "user" ? "gradient-gold text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="flex-1 bg-secondary border-border" />
            <Button className="gradient-gold text-primary-foreground" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
