import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bot, MessageCircle, Sparkles, Star, Filter, AlertTriangle, ThumbsUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AILog {
  id: string;
  user_id: string;
  message: string;
  type: string;
  metadata: any;
  created_at: string;
  profiles?: { full_name: string | null };
}

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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("ai_logs")
      .select("*, profiles!ai_logs_user_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) {
      setLogs(data);
      generateRecommendations(data);
      setFeedbackLogs(data.filter(l => l.type === "feedback"));
      setAdminQuestions(data.filter(l => l.type === "ai_admin_question"));
    }
  };

  const generateRecommendations = (logsData: AILog[]) => {
    const queries = logsData.filter(l => l.type === "concierge_query").map(l => l.message.toLowerCase());
    
    const topics: Record<string, number> = {};
    const keywords = [
      { key: "shipping", topic: "Shipping & Delivery" },
      { key: "delivery", topic: "Shipping & Delivery" },
      { key: "return", topic: "Returns & Refunds" },
      { key: "refund", topic: "Returns & Refunds" },
      { key: "size", topic: "Sizing Guide" },
      { key: "sizing", topic: "Sizing Guide" },
      { key: "payment", topic: "Payment Methods" },
      { key: "pay", topic: "Payment Methods" },
      { key: "discount", topic: "Discounts & Promotions" },
      { key: "coupon", topic: "Discounts & Promotions" },
      { key: "promo", topic: "Discounts & Promotions" },
      { key: "quality", topic: "Product Quality" },
      { key: "authentic", topic: "Product Quality" },
      { key: "recommend", topic: "Product Recommendations" },
      { key: "suggest", topic: "Product Recommendations" },
      { key: "track", topic: "Order Tracking" },
      { key: "order", topic: "Order Tracking" },
      { key: "feedback", topic: "User Feedback" },
      { key: "request", topic: "Feature Requests" },
      { key: "wish", topic: "Feature Requests" },
      { key: "want", topic: "Feature Requests" },
    ];

    queries.forEach(q => {
      keywords.forEach(kw => {
        if (q.includes(kw.key)) {
          topics[kw.topic] = (topics[kw.topic] || 0) + 1;
        }
      });
    });

    const recs: AIRecommendation[] = Object.entries(topics)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        suggestion: getSuggestion(category),
        priority: count > 10 ? "high" : count > 5 ? "medium" : "low",
      }));

    setRecommendations(recs);
  };

  const getSuggestion = (category: string): string => {
    const suggestions: Record<string, string> = {
      "Shipping & Delivery": "Consider adding a detailed shipping info page and real-time tracking links.",
      "Returns & Refunds": "Create a clear return policy page and simplify the refund process.",
      "Sizing Guide": "Add comprehensive size charts with measurements to each product page.",
      "Payment Methods": "Expand payment options and add a FAQ about accepted payment methods.",
      "Discounts & Promotions": "Run more targeted promotions and improve coupon discoverability.",
      "Product Quality": "Add customer reviews and authenticity badges to product pages.",
      "Product Recommendations": "Implement AI-powered product recommendations on the homepage.",
      "Order Tracking": "Add real-time order tracking with status notifications.",
      "User Feedback": "Review user feedback regularly and create action items from common themes.",
      "Feature Requests": "Prioritize frequently requested features in product roadmap.",
    };
    return suggestions[category] || "Analyze user feedback for actionable improvements.";
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
    recommendation: "border-orange-500/30 text-orange-400",
  };

  const typeIcons: Record<string, typeof Bot> = {
    concierge_query: MessageCircle,
    concierge_response: Bot,
    feedback: ThumbsUp,
    ai_admin_question: HelpCircle,
  };

  return (
    <div className="space-y-6">
      {/* AI Questions for Admin */}
      {adminQuestions.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-purple-400" />
            <h2 className="font-display text-xl font-semibold text-foreground">AI Questions for Admin</h2>
            <Badge className="bg-purple-500/20 text-purple-400">{adminQuestions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">The AI Concierge needs your input on these user queries:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {adminQuestions.map(log => (
              <div key={log.id} className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-400 font-medium">
                    {log.profiles?.full_name || "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Feedback & Recommendations */}
      {feedbackLogs.length > 0 && (
        <div className="glass-card rounded-xl p-6 border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <ThumbsUp className="h-6 w-6 text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">User Feedback & Recommendations</h2>
            <Badge className="bg-gold/20 text-gold">{feedbackLogs.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Feedback and suggestions collected from user interactions with the AI:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {feedbackLogs.map(log => (
              <div key={log.id} className="bg-gold/5 border border-gold/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gold font-medium">
                    {log.profiles?.full_name || "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations from patterns */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-gold" />
          <h2 className="font-display text-2xl font-semibold text-foreground">AI Insights & Recommendations</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Based on user interactions with the AI Concierge, here are the top areas that need attention:
        </p>
        {recommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{rec.category}</h4>
                  <Badge className={rec.priority === "high" ? "bg-red-500/20 text-red-400" : rec.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rec.count} user queries</p>
                <div className="flex items-start gap-2 mt-2 p-3 bg-background/50 rounded-md">
                  <Star className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{rec.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No AI interaction data yet. Recommendations will appear as users interact with the AI Concierge.</p>
          </div>
        )}
      </div>

      {/* Full AI Logs / Audit Trail */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-gold" />
            <h2 className="font-display text-2xl font-semibold text-foreground">AI Chat & Audit Logs</h2>
            <Badge variant="outline" className="border-gold/30 text-gold ml-2">{logs.length} entries</Badge>
          </div>
          <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchLogs}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "concierge_query", "concierge_response", "feedback", "ai_admin_question"].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  filter === t ? "gradient-gold text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "ai_admin_question" ? "AI Questions" : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Log entries */}
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
                      log.type === "ai_admin_question" ? "text-purple-400" : "text-muted-foreground"
                    }`} />
                    <Badge variant="outline" className={typeColors[log.type] || "border-border text-muted-foreground"}>
                      {log.type === "ai_admin_question" ? "AI Question" : log.type.replace(/_/g, " ")}
                    </Badge>
                    {log.profiles?.full_name && (
                      <span className="text-xs text-muted-foreground">by {log.profiles.full_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-foreground pl-6">{log.message}</p>
                {log.metadata && log.type === "concierge_response" && log.metadata.user_query && (
                  <p className="text-xs text-muted-foreground pl-6 italic">↳ In response to: "{log.metadata.user_query}"</p>
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
