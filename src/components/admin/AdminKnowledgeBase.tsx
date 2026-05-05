import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Plus, Search, Trash2, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  source_log_id?: string | null;
  created_at: string;
}

export function AdminKnowledgeBase() {
  const [kb, setKb] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");
  const [newKb, setNewKb] = useState({ question: "", answer: "", category: "general" });

  useEffect(() => {
    fetchKb();
  }, []);

  const fetchKb = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ai_knowledge_base")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setKb((data || []) as any);
    }
    setLoading(false);
  };

  const addEntry = async () => {
    if (!newKb.question.trim() || !newKb.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    const { error } = await supabase.from("ai_knowledge_base").insert({
      question: newKb.question.trim(),
      answer: newKb.answer.trim(),
      category: newKb.category.trim() || "general",
      active: true,
    } as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Knowledge added — AI will use it next time");
    setNewKb({ question: "", answer: "", category: "general" });
    fetchKb();
  };

  const toggleActive = async (entry: KBEntry) => {
    const { error } = await supabase
      .from("ai_knowledge_base")
      .update({ active: !entry.active } as any)
      .eq("id", entry.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(entry.active ? "Disabled" : "Enabled");
    fetchKb();
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this knowledge entry? The AI will forget this answer.")) return;
    const { error } = await supabase.from("ai_knowledge_base").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    fetchKb();
  };

  const categories = Array.from(new Set(kb.map(e => e.category || "general")));

  const filtered = kb.filter(e => {
    const matchSearch = !search ||
      e.question.toLowerCase().includes(search.toLowerCase()) ||
      e.answer.toLowerCase().includes(search.toLowerCase()) ||
      (e.category || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? e.active : !e.active);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="glass-card rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="h-5 w-5 text-blue-400" />
          <h2 className="font-display text-xl font-semibold text-foreground">Teach the AI</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Add a question + answer the AI Concierge should know. It will be injected into the AI's system prompt.
        </p>
        <div className="space-y-3">
          <Input
            placeholder="Question users might ask (e.g. 'How long does shipping take?')"
            value={newKb.question}
            onChange={e => setNewKb(k => ({ ...k, question: e.target.value }))}
            className="bg-secondary border-border"
          />
          <Textarea
            placeholder="The exact answer the AI should give..."
            value={newKb.answer}
            onChange={e => setNewKb(k => ({ ...k, answer: e.target.value }))}
            className="bg-secondary border-border min-h-[80px]"
          />
          <div className="flex gap-2">
            <Input
              placeholder="Category (e.g. shipping, returns, sizing)"
              value={newKb.category}
              onChange={e => setNewKb(k => ({ ...k, category: e.target.value }))}
              className="bg-secondary border-border flex-1"
            />
            <Button className="gradient-gold text-primary-foreground" onClick={addEntry}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-gold" />
            <h2 className="font-display text-2xl font-semibold text-foreground">Knowledge Base</h2>
            <Badge variant="outline" className="border-gold/30 text-gold ml-2">
              {kb.filter(e => e.active).length} active / {kb.length} total
            </Badge>
          </div>
          <Button size="sm" variant="outline" className="border-gold/30 text-gold" onClick={fetchKb}>
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions, answers, or categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "disabled"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  filter === f ? "gradient-gold text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(c => (
              <Badge key={c} variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                {c} ({kb.filter(e => e.category === c).length})
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-10">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{kb.length === 0 ? "No knowledge entries yet. Add one above." : "No results match your search."}</p>
            </div>
          ) : (
            filtered.map(e => (
              <div
                key={e.id}
                className={`bg-secondary/30 rounded-lg p-4 space-y-2 border ${
                  e.active ? "border-border" : "border-destructive/20 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                      {e.category || "general"}
                    </Badge>
                    {e.source_log_id && (
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                        from user question
                      </Badge>
                    )}
                    {!e.active && (
                      <Badge className="text-[10px] bg-destructive/20 text-destructive">disabled</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => toggleActive(e)}
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {e.active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[11px]"
                      onClick={() => deleteEntry(e.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Q: {e.question}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">A: {e.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
