import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User as UserIcon, Shield, Loader2, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Contact Support — The Rejoice Collection" },
      { name: "description", content: "Get instant help from our AI assistant or chat directly with admin." },
    ],
  }),
});

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;

interface Msg {
  id?: string;
  role: "user" | "assistant" | "admin";
  content: string;
  is_system?: boolean;
}

function SupportPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"ai" | "admin">("ai");
  const [aiMessages, setAiMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AI Support Concierge. I can help with orders, payments, refunds, and product questions. If you need a human, I'll connect you to admin instantly." }
  ]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cleanTags = (t: string) =>
    t.replace(/\[ESCALATE_TO_ADMIN\]/g, "")
     .replace(/\[USER_FEEDBACK\]/g, "")
     .replace(/\[AI_ASKS_ADMIN\][^\n]*/g, "")
     .replace(/\[CANCEL_ORDER:[^\]]*\]/g, "")
     .replace(/\[REQUEST_REFUND:[^\]]*\]/g, "")
     .trim();

  const fetchAdminMessages = async () => {
    if (!user) return;
    const { data } = await supabase.from("chats").select("*")
      .eq("user_id", user.id).eq("is_system", false)
      .order("created_at", { ascending: true });
    if (data) setAdminMessages(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchAdminMessages();
    const channel = supabase.channel('support-chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `user_id=eq.${user.id}` }, fetchAdminMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [aiMessages, adminMessages, mode]);

  const sendAdmin = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    const { error } = await supabase.from("chats").insert({
      user_id: user.id, message: text, is_admin: false, is_system: false,
    });
    if (error) { toast.error("Failed"); setInput(text); }
    setSending(false);
  };

  const sendAI = async () => {
    if (!input.trim() || sending) return;
    const text = input;
    const newMsgs: Msg[] = [...aiMessages, { role: "user", content: text }];
    setAiMessages(newMsgs);
    setInput("");
    setSending(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMsgs.map(m => ({ role: m.role === "admin" ? "assistant" : m.role, content: m.content })),
          userId: user?.id || null,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("AI unavailable");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === newMsgs.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanTags(assistantContent) } : m);
                }
                return [...prev, { role: "assistant", content: cleanTags(assistantContent) }];
              });
            }
          } catch {}
        }
      }

      // Handle escalation: AI notifies admin silently (is_system) and switches user to admin chat
      if (user && assistantContent.includes("[ESCALATE_TO_ADMIN]")) {
        await supabase.from("chats").insert({
          user_id: user.id,
          message: `[AI Escalation] User asked: "${text}". Please reach out.`,
          is_admin: false, is_system: true,
        });
        await supabase.from("ai_logs").insert({
          user_id: user.id, message: `Escalation: ${text}`, type: "escalation",
        });
        setAiMessages(prev => [...prev, {
          role: "assistant",
          content: "✅ I've notified our admin team. Switching you to direct chat with admin now — they'll respond shortly.",
        }]);
        setTimeout(() => setMode("admin"), 1500);
      }

      if (user) {
        supabase.from("ai_logs").insert({
          user_id: user.id, message: text, type: "concierge_query",
        }).then(() => {});
        supabase.from("ai_logs").insert({
          user_id: user.id, message: cleanTags(assistantContent), type: "concierge_response",
          metadata: { user_query: text },
        }).then(() => {});
      }
    } catch (e: any) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble. Please switch to Admin Chat for help." }]);
    }
    setSending(false);
  };

  const send = () => mode === "ai" ? sendAI() : sendAdmin();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <LifeBuoy className="h-16 w-16 text-gold mx-auto" />
          <h1 className="font-display text-3xl text-gradient-gold">Contact Support</h1>
          <p className="text-muted-foreground">Sign in to chat with our AI Concierge or directly with our admin team.</p>
          <Link to="/login" className="inline-block"><Button className="gradient-gold text-primary-foreground">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  const messages = mode === "ai" ? aiMessages : adminMessages;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="h-7 w-7 text-gold" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-gold">Contact Support</h1>
        </div>
        <p className="text-muted-foreground mb-6 text-sm">
          Talk to our AI for instant help. If your issue needs a human, the AI will hand you over to admin.
        </p>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode("ai")}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
              ${mode === "ai" ? "gradient-gold text-primary-foreground shadow-lg" : "glass-card text-muted-foreground hover:text-foreground"}`}>
            <Sparkles className="h-4 w-4" /> AI Concierge
          </button>
          <button onClick={() => setMode("admin")}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
              ${mode === "admin" ? "gradient-gold text-primary-foreground shadow-lg" : "glass-card text-muted-foreground hover:text-foreground"}`}>
            <Shield className="h-4 w-4" /> Admin Chat
          </button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div ref={scrollRef} className="h-[55vh] overflow-y-auto p-4 space-y-3">
            {mode === "admin" && adminMessages.length === 0 && (
              <p className="text-center text-muted-foreground py-10 text-sm">No messages with admin yet. Send one to start the conversation.</p>
            )}
            {mode === "ai" && aiMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role !== "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full gradient-gold flex items-center justify-center mt-1">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.role === "user" ? "gradient-gold text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center mt-1">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {mode === "admin" && adminMessages.map((msg: any) => {
              const mine = !msg.is_admin;
              return (
                <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"} gap-2`}>
                  {!mine && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center mt-1">
                      <Shield className="h-4 w-4 text-gold" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                    mine ? "gradient-gold text-primary-foreground" : "bg-gold/10 border border-gold/20 text-foreground"
                  }`}>
                    {!mine && <p className="text-xs text-gold font-medium mb-1">Admin</p>}
                    {msg.message}
                  </div>
                </div>
              );
            })}
            {sending && mode === "ai" && (
              <div className="flex justify-start gap-2">
                <div className="flex-shrink-0 h-8 w-8 rounded-full gradient-gold flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="px-3 py-2 rounded-xl bg-secondary text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={mode === "ai" ? "Ask the AI anything..." : "Type a message to admin..."}
              className="flex-1 bg-secondary border-border" disabled={sending} />
            <Button className="gradient-gold text-primary-foreground" onClick={send} disabled={!input.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
