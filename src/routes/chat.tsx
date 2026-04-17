import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: "Chat — The Rejoice Collection" },
      { name: "description", content: "Chat with our support team." },
    ],
  }),
});

interface ChatRow {
  id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  is_system: boolean;
  created_at: string;
}

function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatRow[]);
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const channel = supabase
      .channel('user-chats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    const { error } = await supabase.from("chats").insert({
      user_id: user.id,
      message: text,
      is_admin: false,
      is_system: false,
    });
    if (error) { toast.error("Failed to send"); setInput(text); }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Please sign in to chat with our support team.</p>
          <Link to="/login" className="text-gold hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-gradient-gold mb-2">Chat Support</h1>
        <p className="text-muted-foreground mb-8 text-sm">Send a message to our team. The AI Concierge (bottom-right) can also help instantly.</p>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No messages yet. Say hello to our team!</p>
            )}
            {messages.map((msg) => {
              const mine = !msg.is_admin && !msg.is_system;
              return (
                <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"} gap-2`}>
                  {!mine && (
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                      {msg.is_system ? <Sparkles className="h-3.5 w-3.5 text-gold" /> : <Shield className="h-3.5 w-3.5 text-gold" />}
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                    mine ? "gradient-gold text-primary-foreground" :
                    msg.is_admin ? "bg-gold/10 border border-gold/20 text-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
                    {msg.is_admin && <p className="text-xs text-gold font-medium mb-1">Admin</p>}
                    {msg.is_system && <p className="text-xs text-muted-foreground font-medium mb-1">System / AI</p>}
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message to our support team..."
              className="flex-1 bg-secondary border-border"
              disabled={sending}
            />
            <Button className="gradient-gold text-primary-foreground" onClick={sendMessage} disabled={!input.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
