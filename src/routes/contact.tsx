import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User as UserIcon, Shield, Loader2, LifeBuoy, Phone, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact Us — The Rejoice Collection" },
      { name: "description", content: "Reach out via WhatsApp, TikTok, Instagram, email, or chat with our AI Concierge — escalate to a human admin anytime." },
      { property: "og:title", content: "Contact Us — The Rejoice Collection" },
      { property: "og:description", content: "WhatsApp, TikTok, Instagram, Facebook, email, AI Concierge & live admin chat." },
    ],
  }),
});

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;

interface Msg { role: "user" | "assistant"; content: string; }

function ContactPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"ai" | "admin">("ai");
  const [aiMessages, setAiMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AI Concierge. Ask me anything about products, orders, payments, refunds or our policies. If you'd rather speak to a human, just say so and I'll connect you to admin." },
  ]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      if (!data) return;
      const s: Record<string, string> = {};
      data.forEach((r: any) => { s[r.key] = r.value; });
      setSettings(s);
    });
  }, []);

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
    const channel = supabase.channel("contact-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats", filter: `user_id=eq.${user.id}` }, fetchAdminMessages)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [aiMessages, adminMessages, mode]);

  const cleanTags = (t: string) =>
    t.replace(/\[ESCALATE_TO_ADMIN\]/g, "")
     .replace(/\[USER_FEEDBACK\]/g, "")
     .replace(/\[AI_ASKS_ADMIN\][^\n]*/g, "")
     .replace(/\[CANCEL_ORDER:[^\]]*\]/g, "")
     .replace(/\[REQUEST_REFUND:[^\]]*\]/g, "")
     .trim();

  const sendAdmin = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const text = input;
    setInput("");
    const { error } = await supabase.from("chats").insert({
      user_id: user.id, message: text, is_admin: false, is_system: false,
    });
    if (error) { toast.error("Failed to send"); setInput(text); }
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
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
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

      if (user && assistantContent.includes("[AI_ASKS_ADMIN]")) {
        const m = assistantContent.match(/\[AI_ASKS_ADMIN\]([^\n]+)/);
        const q = m ? m[1].trim() : `Question about: ${text}`;
        await supabase.from("ai_logs").insert({
          user_id: user.id, message: q, type: "ai_admin_question",
          metadata: { user_query: text },
        });
      }

      if (user) {
        await supabase.from("ai_logs").insert({
          user_id: user.id, message: text, type: "concierge_query",
        });
        await supabase.from("ai_logs").insert({
          user_id: user.id, message: cleanTags(assistantContent), type: "concierge_response",
          metadata: { user_query: text },
        });
      }
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble. Please try Admin Chat or use the social links above." }]);
    }
    setSending(false);
  };

  const send = () => mode === "ai" ? sendAI() : sendAdmin();

  const wa = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, "") : "";
  const channels = [
    wa && { label: "WhatsApp", icon: "💬", href: `https://wa.me/${wa}`, color: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400" },
    settings.contact_email && { label: "Email", icon: "✉️", href: `mailto:${settings.contact_email}`, color: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400" },
    settings.tiktok && { label: "TikTok", icon: "🎵", href: settings.tiktok, color: "from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400" },
    settings.instagram && { label: "Instagram", icon: "📸", href: settings.instagram, color: "from-purple-500/20 to-fuchsia-600/20 border-purple-500/30 text-purple-400" },
    settings.facebook && { label: "Facebook", icon: "📘", href: settings.facebook, color: "from-blue-500/20 to-indigo-600/20 border-blue-500/30 text-blue-400" },
    settings.contact_phone && { label: "Call", icon: "📞", href: `tel:${settings.contact_phone}`, color: "from-gold/20 to-yellow-500/20 border-gold/30 text-gold" },
    settings.contact_sms && { label: "SMS", icon: "📨", href: `sms:${settings.contact_sms}`, color: "from-cyan-500/20 to-teal-600/20 border-cyan-500/30 text-cyan-400" },
  ].filter(Boolean) as { label: string; icon: string; href: string; color: string }[];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="h-8 w-8 text-gold" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gradient-gold">Contact Us</h1>
        </div>
        <p className="text-muted-foreground mb-6 text-sm">
          Reach us on your favourite channel, or chat with our AI Concierge below — it can hand you over to a human admin instantly.
        </p>

        {/* Social / contact channels */}
        {channels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`glass-card rounded-xl p-4 text-center bg-gradient-to-br ${c.color} hover:scale-105 transition-transform`}
              >
                <div className="text-2xl mb-1">{c.icon}</div>
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 mb-8 text-center text-sm text-muted-foreground">
            Social channels will appear here once admin configures them in Settings.
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-3 mb-6">
          {settings.contact_phone && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3"><Phone className="h-5 w-5 text-gold" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-semibold text-foreground">{settings.contact_phone}</p></div></div>
          )}
          {settings.contact_email && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3"><Mail className="h-5 w-5 text-gold" /><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-semibold text-foreground break-all">{settings.contact_email}</p></div></div>
          )}
          {settings.contact_sms && (
            <div className="glass-card rounded-xl p-4 flex items-center gap-3"><MessageSquare className="h-5 w-5 text-gold" /><div><p className="text-xs text-muted-foreground">SMS</p><p className="text-sm font-semibold text-foreground">{settings.contact_sms}</p></div></div>
          )}
        </div>

        <h2 className="font-display text-xl font-semibold text-foreground mb-3">Live Chat</h2>

        {!user ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground mb-3">Sign in to chat with our AI Concierge or admin team.</p>
            <Link to="/login"><Button className="gradient-gold text-primary-foreground">Sign In</Button></Link>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
