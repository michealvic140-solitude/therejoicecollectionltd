import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to The Rejoice Collection! I'm your AI Concierge. How can I help you today? I can recommend products, answer questions about sizing, shipping, and more." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Log the AI interaction
      if (user) {
        await supabase.from("ai_logs").insert({
          user_id: user.id,
          message: input,
          type: "concierge_query",
        });
      }

      // Simple AI response (can be enhanced with Lovable AI Gateway)
      const response = generateResponse(input);
      
      const assistantMsg: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, assistantMsg]);

      // Log AI response
      if (user) {
        await supabase.from("ai_logs").insert({
          user_id: user.id,
          message: response,
          type: "concierge_response",
          metadata: { user_query: input },
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "I apologize, I'm having trouble right now. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-gold flex items-center justify-center shadow-lg animate-glow transition-transform hover:scale-110"
      >
        {open ? <X className="h-6 w-6 text-primary-foreground" /> : <Sparkles className="h-6 w-6 text-primary-foreground" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[500px] rounded-2xl glass-strong flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <h3 className="font-display font-semibold text-foreground">AI Concierge</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "gradient-gold text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-secondary text-sm text-muted-foreground animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 bg-secondary border-border"
            />
            <Button size="icon" className="gradient-gold text-primary-foreground" onClick={sendMessage} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function generateResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("shipping") || q.includes("delivery")) {
    return "We offer nationwide shipping within the Philippines! Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days. Free shipping on orders above ₱2,000.";
  }
  if (q.includes("return") || q.includes("refund")) {
    return "We accept returns within 7 days of delivery. Items must be in original condition with tags attached. Refunds are processed within 5-7 business days.";
  }
  if (q.includes("size") || q.includes("sizing")) {
    return "We follow standard sizing. For the best fit, please check our size guide on each product page. If you're between sizes, we recommend going up one size.";
  }
  if (q.includes("payment") || q.includes("pay")) {
    return "We accept GCash, Maya, bank transfers, and COD (Cash on Delivery). All payments are secure and encrypted.";
  }
  if (q.includes("recommend") || q.includes("suggest")) {
    return "Based on our bestsellers, I'd recommend checking out our luxury watch collection and premium jewelry pieces. Visit our Shop page to browse! 💎";
  }
  return "Thank you for your question! I'd recommend browsing our Shop for the latest collection. For specific inquiries, you can also reach out through our Chat page or contact our support team. Is there anything specific I can help you with?";
}
