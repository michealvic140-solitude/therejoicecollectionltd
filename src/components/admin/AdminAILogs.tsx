import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bot, MessageCircle, Sparkles, Star, Filter, AlertTriangle, ThumbsUp, HelpCircle, Zap, BookOpen, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AILog {
  id: string;
  user_id: string;
  message: string;
  type: string;
  metadata: any;
  created_at: string;
  handled?: boolean;
  profiles?: { full_name: string | null };
}

interface KBEntry { id: string; question: string; answer: string; category: string; active: boolean; }


interface AIRecommendation {
  category: string;
  count: number;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export function AdminAILogs() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [feedbackLogs, setFeedbackLogs] = useState<AILog[]>([]);
  const [adminQuestions, setAdminQuestions] = useState<AILog[]>([]);
  const [aiActions, setAiActions] = useState<AILog[]>([]);
  const [kb, setKb] = useState<KBEntry[]>([]);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [newKb, setNewKb] = useState({ question: "", answer: "", category: "general" });

  useEffect(() => { fetchLogs(); fetchKb(); }, []);

  const fetchKb = async () => {
    const { data } = await supabase.from("ai_knowledge_base").select("*").order("created_at", { ascending: false });
    if (data) setKb(data as any);
  };

  const teachAi = async (log: AILog) => {
    const answer = (answerDraft[log.id] || "").trim();
    if (!answer) { toast.error("Type an answer first"); return; }
    const { error } = await supabase.from("ai_knowledge_base").insert({
      question: log.message, answer, category: "from_admin_question", source_log_id: log.id, active: true,
    } as any);
    if (error) { toast.error(error.message); return; }
    await supabase.from("ai_logs").update({ handled: true } as any).eq("id", log.id);
    toast.success("AI learned this answer");
    setAnswerDraft(d => { const n = { ...d }; delete n[log.id]; return n; });
    fetchLogs();
    fetchKb();
  };

  const addKbEntry = async () => {
    if (!newKb.question.trim() || !newKb.answer.trim()) { toast.error("Question + answer required"); return; }
    const { error } = await supabase.from("ai_knowledge_base").insert(newKb as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Knowledge added");
    setNewKb({ question: "", answer: "", category: "general" });
    fetchKb();
  };

  const toggleKb = async (entry: KBEntry) => {
    await supabase.from("ai_knowledge_base").update({ active: !entry.active } as any).eq("id", entry.id);
    fetchKb();
  };

  const deleteKb = async (id: string) => {
    await supabase.from("ai_knowledge_base").delete().eq("id", id);
    fetchKb();
  };


  const fetchLogs = async () => {
    const { data } = await supabase
      .from("ai_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.filter(l => l.user_id).map(l => l.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
        : { data: [] };
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      const enriched = data.map(l => ({ ...l, profiles: { full_name: profileMap.get(l.user_id) || null } }));
      setLogs(enriched);
      generateRecommendations(enriched);
      setFeedbackLogs(enriched.filter(l => l.type === "feedback"));
      setAdminQuestions(enriched.filter(l => l.type === "ai_admin_question"));
      setAiActions(enriched.filter(l => l.type === "ai_action"));
    }
  };

  const generateRecommendations = (logsData: AILog[]) => {
    const queries = logsData.filter(l => l.type === "concierge_query").map(l => l.message.toLowerCase());
    const topics: Record<string, number> = {};
    const keywords = [
      { key: "shipping", topic: "Shipping & Delivery" }, { key: "delivery", topic: "Shipping & Delivery" },
      { key: "return", topic: "Returns & Refunds" }, { key: "refund", topic: "Returns & Refunds" },
      { key: "size", topic: "Sizing Guide" }, { key: "payment", topic: "Payment Methods" },
      { key: "pay", topic: "Payment Methods" }, { key: "discount", topic: "Discounts & Promotions" },
      { key: "coupon", topic: "Discounts & Promotions" }, { key: "quality", topic: "Product Quality" },
      { key: "recommend", topic: "Product Recommendations" }, { key: "track", topic: "Order Tracking" },
      { key: "order", topic: "Order Management" }, { key: "cancel", topic: "Cancellations" },
      { key: "feedback", topic: "User Feedback" }, { key: "request", topic: "Feature Requests" },
    ];
    queries.forEach(q => { keywords.forEach(kw => { if (q.includes(kw.key)) topics[kw.topic] = (topics[kw.topic] || 0) + 1; }); });
    
    const suggestions: Record<string, string> = {
      "Shipping & Delivery": "Add detailed shipping info page with delivery timelines per state.",
      "Returns & Refunds": "Create a clear return policy page and simplify the refund process.",
      "Sizing Guide": "Add size charts with Nigerian measurements to product pages.",
      "Payment Methods": "Consider adding more payment options. Ensure bank details are always up to date in Settings.",
      "Discounts & Promotions": "Run targeted promotions and improve coupon visibility on the homepage.",
      "Product Quality": "Add customer reviews and authenticity badges to build trust.",
      "Product Recommendations": "Leverage AI data to create personalized product suggestions.",
      "Order Tracking": "Send automated tracking updates via notifications.",
      "Order Management": "Improve order detail visibility for users.",
      "Cancellations": "Review cancellation patterns — consider offering exchanges instead.",
      "User Feedback": "Act on common themes in user feedback.",
      "Feature Requests": "Prioritize frequently requested features.",
    };

    setRecommendations(
      Object.entries(topics).sort((a, b) => b[1] - a[1]).map(([category, count]) => ({
        category, count,
        suggestion: suggestions[category] || "Review user feedback for improvements.",
        priority: count > 10 ? "high" : count > 5 ? "medium" : "low",
      }))
    );
  };

  const filteredLogs = logs.filter(l => {
    const matchType = filter === "all" || l.type === filter;
    const matchSearch = !searchQuery || l.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const typeColors: Record<string, string> = {
    concierge_query: "border-blue-500/30 text-blue-400",
    concierge_response: "border-green-500/30 text-green-400",
    feedback: "border-gold/30 text-gold",
    ai_admin_question: "border-purple-500/30 text-purple-400",
    ai_action: "border-orange-500/30 text-orange-400",
  };

  const typeIcons: Record<string, typeof Bot> = {
    concierge_query: MessageCircle, concierge_response: Bot,
    feedback: ThumbsUp, ai_admin_question: HelpCircle, ai_action: Zap,
  };

  return (
    <div className="space-y-6">
      {/* AI Actions (cancellations, refunds) */}
      {aiActions.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-orange-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">AI Actions Taken</h2>
            <Badge className="bg-orange-500/20 text-orange-400">{aiActions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Actions the AI performed on behalf of users (order cancellations, refund requests, etc.):</p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {aiActions.map(log => (
              <div key={log.id} className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-orange-400 font-medium">{log.profiles?.full_name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{log.message}</p>
                {log.metadata?.action && <Badge variant="outline" className="text-xs mt-1 border-orange-500/30 text-orange-400">{log.metadata.action}</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Questions for Admin — teach-back loop */}
      {adminQuestions.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-purple-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">AI Questions for Admin</h2>
            <Badge className="bg-purple-500/20 text-purple-400">{adminQuestions.filter(q => !q.handled).length} pending</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Answer these and the AI will permanently learn the response.</p>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {adminQuestions.map(log => (
              <div key={log.id} className={`bg-purple-500/5 border rounded-lg p-4 space-y-3 ${log.handled ? "border-green-500/20 opacity-60" : "border-purple-500/10"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-400 font-medium">{log.profiles?.full_name || "Unknown user"} asked</span>
                  <div className="flex items-center gap-2">
                    {log.handled && <Badge className="bg-green-500/20 text-green-400 text-[10px]"><Check className="h-3 w-3 mr-1" />Taught</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground font-medium">"{log.message}"</p>
                {!log.handled && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type the answer the AI should give next time..."
                      value={answerDraft[log.id] || ""}
                      onChange={e => setAnswerDraft(d => ({ ...d, [log.id]: e.target.value }))}
                      className="bg-secondary border-border text-sm min-h-[60px]"
                    />
                    <Button size="sm" className="gradient-gold text-primary-foreground" onClick={() => teachAi(log)}>
                      <BookOpen className="h-3 w-3 mr-1" /> Teach AI
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Knowledge Base */}
      <div className="glass-card rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <h2 className="font-display text-xl font-semibold text-foreground">AI Knowledge Base</h2>
          <Badge className="bg-blue-500/20 text-blue-400">{kb.filter(e => e.active).length} active</Badge>
        </div>
        <div className="space-y-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
          <Input placeholder="Question users might ask..." value={newKb.question}
            onChange={e => setNewKb(k => ({ ...k, question: e.target.value }))} className="bg-secondary border-border" />
          <Textarea placeholder="The answer the AI should give..." value={newKb.answer}
            onChange={e => setNewKb(k => ({ ...k, answer: e.target.value }))} className="bg-secondary border-border min-h-[60px]" />
          <div className="flex gap-2">
            <Input placeholder="Category (e.g. shipping)" value={newKb.category}
              onChange={e => setNewKb(k => ({ ...k, category: e.target.value }))} className="bg-secondary border-border flex-1" />
            <Button size="sm" className="gradient-gold text-primary-foreground" onClick={addKbEntry}>Add</Button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {kb.map(e => (
            <div key={e.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{e.category}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => toggleKb(e)}>
                    {e.active ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => deleteKb(e.id)}>Delete</Button>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground">Q: {e.question}</p>
              <p className="text-xs text-muted-foreground">A: {e.answer}</p>
            </div>
          ))}
          {kb.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No knowledge entries yet.</p>}
        </div>
      </div>


      {/* User Feedback */}
      {feedbackLogs.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-6 w-6 text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">User Feedback & Recommendations</h2>
            <Badge className="bg-gold/20 text-gold">{feedbackLogs.length}</Badge>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {feedbackLogs.map(log => (
              <div key={log.id} className="bg-gold/5 border border-gold/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gold font-medium">{log.profiles?.full_name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-gold" />
          <h2 className="font-display text-2xl font-semibold text-foreground">AI Recommendations to Improve</h2>
        </div>
        {recommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{rec.category}</h4>
                  <Badge className={rec.priority === "high" ? "bg-red-500/20 text-red-400" : rec.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.count} queries</p>
                <div className="flex items-start gap-2 p-3 bg-background/50 rounded-md">
                  <Star className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{rec.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">No AI data yet. Recommendations appear as users interact.</p>
        )}
      </div>

      {/* Full Audit Trail */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-gold" />
            <h2 className="font-display text-2xl font-semibold text-foreground">Audit Trail</h2>
            <Badge variant="outline" className="border-gold/30 text-gold ml-2">{logs.length}</Badge>
          </div>
          <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchLogs}>Refresh</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "concierge_query", "concierge_response", "feedback", "ai_admin_question", "ai_action"].map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${filter === t ? "gradient-gold text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>
                {t === "ai_admin_question" ? "AI Questions" : t === "ai_action" ? "Actions" : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredLogs.map(log => {
            const Icon = typeIcons[log.type] || Star;
            return (
              <div key={log.id} className="bg-secondary/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${
                      log.type === "concierge_query" ? "text-blue-400" :
                      log.type === "concierge_response" ? "text-green-400" :
                      log.type === "feedback" ? "text-gold" :
                      log.type === "ai_admin_question" ? "text-purple-400" :
                      log.type === "ai_action" ? "text-orange-400" : "text-muted-foreground"
                    }`} />
                    <Badge variant="outline" className={typeColors[log.type] || "border-border text-muted-foreground"}>
                      {log.type === "ai_admin_question" ? "AI Question" : log.type === "ai_action" ? "AI Action" : log.type.replace(/_/g, " ")}
                    </Badge>
                    {log.profiles?.full_name && <span className="text-xs text-muted-foreground">by {log.profiles.full_name}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground pl-6">{log.message}</p>
                {log.metadata && log.type === "concierge_response" && log.metadata.user_query && (
                  <p className="text-xs text-muted-foreground pl-6 italic">↳ Re: "{log.metadata.user_query}"</p>
                )}
              </div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
