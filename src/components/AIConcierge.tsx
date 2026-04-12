import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;

export function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to **The Rejoice Collection**! 👋 I'm your AI Concierge — I can help with anything: product questions, orders, platform guidance, or even general questions. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const cleanTags = (text: string) => {
    return text
      .replace(/\[ESCALATE_TO_ADMIN\]/g, "")
      .replace(/\[USER_FEEDBACK\]/g, "")
      .replace(/\[AI_ASKS_ADMIN\][^\n]*/g, "")
      .trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    // Log user query
    if (user) {
      supabase.from("ai_logs").insert({
        user_id: user.id,
        message: input,
        type: "concierge_query",
      }).then(() => {});
    }

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id || null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
        throw new Error(err.error || "AI service error");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length === allMessages.length + 1) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cleanTags(content) } : m);
          }
          return [...prev, { role: "assistant", content: cleanTags(content) }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Handle escalation
      if (assistantContent.includes("[ESCALATE_TO_ADMIN]")) {
        const displayContent = cleanTags(assistantContent) + "\n\n*I've notified our support team. They'll reach out to you soon!* 🙋";
        updateAssistant(displayContent);
        
        if (user) {
          await supabase.from("messages").insert({
            user_id: user.id,
            content: `[AI Escalation] User asked: "${input}" — AI suggested escalation.`,
            sender: "system",
            escalated: true,
          });
        }
      }

      // Handle user feedback/recommendation
      if (assistantContent.includes("[USER_FEEDBACK]")) {
        if (user) {
          await supabase.from("ai_logs").insert({
            user_id: user.id,
            message: input,
            type: "feedback",
            metadata: { ai_response: cleanTags(assistantContent) },
          });
        }
      }

      // Handle AI asking admin
      if (assistantContent.includes("[AI_ASKS_ADMIN]")) {
        const adminQuestion = assistantContent.split("[AI_ASKS_ADMIN]")[1]?.trim() || "";
        if (user && adminQuestion) {
          await supabase.from("messages").insert({
            user_id: user.id,
            content: `[AI Question for Admin] Re: "${input}" — AI asks: ${adminQuestion}`,
            sender: "system",
            escalated: true,
          });
          await supabase.from("ai_logs").insert({
            user_id: user.id,
            message: `AI asks admin: ${adminQuestion} (User query: "${input}")`,
            type: "ai_admin_question",
            metadata: { user_query: input, admin_question: adminQuestion },
          });
        }
      }

      // Log AI response
      if (user) {
        supabase.from("ai_logs").insert({
          user_id: user.id,
          message: cleanTags(assistantContent),
          type: "concierge_response",
          metadata: { user_query: input },
        }).then(() => {});
      }
    } catch (e: any) {
      const errorMsg = e.message || "I apologize, I'm having trouble right now. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-gold flex items-center justify-center shadow-lg animate-glow transition-transform hover:scale-110"
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <Sparkles className="h-6 w-6 text-primary-foreground" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[520px] rounded-2xl glass-strong flex flex-col overflow-hidden shadow-2xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-2 gradient-gold">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
            <h3 className="font-display font-semibold text-primary-foreground">AI Concierge</h3>
            <span className="ml-auto text-xs text-primary-foreground/70">Powered by AI</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 h-7 w-7 rounded-full gradient-gold flex items-center justify-center mt-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "gradient-gold text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-secondary flex items-center justify-center mt-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="flex-shrink-0 h-7 w-7 rounded-full gradient-gold flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="px-3 py-2 rounded-xl bg-secondary text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 bg-secondary border-border"
              disabled={loading}
            />
            <Button size="icon" className="gradient-gold text-primary-foreground" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
