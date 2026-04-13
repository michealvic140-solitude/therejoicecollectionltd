import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle, Shield } from "lucide-react";
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

function ChatPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const channel = supabase
      .channel('user-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const { error } = await supabase.from("messages").insert({ user_id: user.id, content: input, sender: "user" });
    if (error) { toast.error("Failed to send"); return; }
    setInput("");
    fetchMessages();
  };

  // Show loading state while auth is initializing - don't redirect to login
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
        <p className="text-muted-foreground mb-8 text-sm">Send a message to our team. You can also use the AI Concierge (bottom-right) for instant help.</p>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div ref={scrollRef} className="h-[60vh] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No messages yet. Start a conversation with our support team!</p>
            )}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.sender !== "user" && (
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                    <Shield className="h-3.5 w-3.5 text-gold" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.sender === "user" ? "gradient-gold text-primary-foreground" : 
                  msg.sender === "admin" ? "bg-gold/10 border border-gold/20 text-foreground" :
                  "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.sender === "admin" && <p className="text-xs text-gold font-medium mb-1">Admin</p>}
                  {msg.sender === "system" && <p className="text-xs text-muted-foreground font-medium mb-1">System</p>}
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message to our support team..."
              className="flex-1 bg-secondary border-border"
            />
            <Button className="gradient-gold text-primary-foreground" onClick={sendMessage} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
