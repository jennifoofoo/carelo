import { useState, useEffect } from "react";
import {
  AlertTriangle, TrendingUp, Heart, ListChecks, Sparkles,
  RefreshCw, ArrowRight, FileText, ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface Insight {
  id: string;
  case_id: string;
  type: string;
  title?: string;
  content: Record<string, any>;
  severity?: "high" | "medium" | "low";
  is_read: boolean;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  due_date?: string;
  priority?: "low" | "medium" | "high";
  status: string;
}

interface MobileAIInsightsProps {
  caseId?: string;
  onNavigateToHelpPlan?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToTasks?: () => void;
}

export const MobileAIInsights = ({ 
  caseId, 
  onNavigateToHelpPlan, 
  onNavigateToReports, 
  onNavigateToTasks 
}: MobileAIInsightsProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("risks");
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset state when caseId changes
  useEffect(() => {
    setExpandedSection("risks");
    setIsGenerating(false);
  }, [caseId]);

  // Use cached data for insights
  const { data: insightsData, isLoading: isLoadingInsights, refetch: refetchInsights } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.insights.list(caseId);
    },
    {
      cacheKey: `insights_${caseId}`,
      ttl: 30 * 60 * 1000, // 30 minutes — only changes on explicit regenerate
      enabled: !!caseId,
    }
  );
  const allInsights = insightsData ?? [];

  // Use cached data for tasks
  const { data: tasksData, refetch: refetchTasks } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.tasks.list(caseId);
    },
    {
      cacheKey: `tasks_${caseId}`,
      ttl: 2 * 60 * 1000, // 2 minutes
      enabled: !!caseId,
    }
  );
  const tasks: Task[] = tasksData ?? [];

  // Process insights by type
  const riskInsights = allInsights.filter((i: Insight) => i.type === "risk" && !i.is_read);
  const patternInsights = allInsights.filter((i: Insight) => i.type === "pattern" && !i.is_read);
  const suggestionInsights = allInsights.filter((i: Insight) => i.type === "suggestion" && !i.is_read);
  const unreadInsightsCount = riskInsights.length + patternInsights.length + suggestionInsights.length;

  // Handle regenerate insights
  const handleRegenerateInsights = async () => {
    if (!caseId) return;
    
    setIsGenerating(true);
    try {
      await api.insights.generate(caseId);
      
      toast({
        title: "✨ Generating insights...",
        description: "This may take a few seconds.",
      });

      // Wait and refetch
      setTimeout(() => {
        invalidateCache(`insights_${caseId}`);
        refetchInsights();
        setIsGenerating(false);
        
        toast({
          title: "✅ Insights updated",
          description: "New AI insights have been generated.",
        });
      }, 3000);
    } catch (error: any) {
      setIsGenerating(false);
      toast({
        title: "❌ Failed to generate insights",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (insightId: string) => {
    try {
      await api.insights.markAsRead(insightId);
      invalidateCache(`insights_${caseId}`);
      refetchInsights();
    } catch (error) {
      console.error("Failed to mark insight as read:", error);
    }
  };

  const levelConfig = {
    high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", icon: "🔴" },
    medium: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", icon: "🟡" },
    low: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", icon: "🟢" }
  };

  return (
    <div className="pb-28">
      {/* Header Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">AI Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              {unreadInsightsCount} new insights
            </p>
          </div>
          <button
            onClick={handleRegenerateInsights}
            disabled={isGenerating || !caseId}
            className="p-2 rounded-xl bg-primary/10 text-primary disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive mb-2" />
            <div className="text-2xl font-bold text-foreground">{riskInsights.length}</div>
            <div className="text-xs text-muted-foreground">Risks</div>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-bold text-foreground">{patternInsights.length}</div>
            <div className="text-xs text-muted-foreground">Patterns</div>
          </div>
          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
            <ListChecks className="w-5 h-5 text-accent mb-2" />
            <div className="text-2xl font-bold text-foreground">{tasks.length}</div>
            <div className="text-xs text-muted-foreground">Tasks</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onNavigateToHelpPlan}
            className="p-4 rounded-xl bg-card border border-border text-center hover:bg-muted transition-colors"
          >
            <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xs font-medium">Help Plan</span>
          </button>
          <button
            onClick={onNavigateToReports}
            className="p-4 rounded-xl bg-card border border-border text-center hover:bg-muted transition-colors"
          >
            <ClipboardList className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xs font-medium">Reports</span>
          </button>
          <button
            onClick={onNavigateToTasks}
            className="p-4 rounded-xl bg-card border border-border text-center hover:bg-muted transition-colors"
          >
            <ListChecks className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-xs font-medium">Tasks</span>
          </button>
        </div>
      </div>

      {/* Critical Risks Section */}
      {riskInsights.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === "risks" ? null : "risks")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">
                Critical Risks ({riskInsights.length})
              </h3>
            </div>
            <ArrowRight 
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expandedSection === "risks" ? "rotate-90" : ""
              }`}
            />
          </button>
          
          <AnimatePresence>
            {expandedSection === "risks" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                {riskInsights.slice(0, 5).map((risk) => {
                  const level = (risk.severity || "medium") as "high" | "medium" | "low";
                  const config = levelConfig[level] || levelConfig.medium;
                  
                  return (
                    <div
                      key={risk.id}
                      className={`p-4 rounded-xl border ${config.bg} ${config.border}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-lg">{config.icon}</span>
                        <button
                          onClick={() => handleMarkAsRead(risk.id)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Dismiss
                        </button>
                      </div>
                      <h4 className={`text-sm font-semibold ${config.text} mb-1`}>
                        {risk.title || risk.content.title || "Risk Alert"}
                      </h4>
                      <p className="text-xs text-foreground/70">
                        {risk.content.description || risk.content.summary || "No description available"}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Patterns Section */}
      {patternInsights.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === "patterns" ? null : "patterns")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Patterns Detected ({patternInsights.length})
              </h3>
            </div>
            <ArrowRight 
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expandedSection === "patterns" ? "rotate-90" : ""
              }`}
            />
          </button>
          
          <AnimatePresence>
            {expandedSection === "patterns" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                {patternInsights.slice(0, 5).map((pattern) => (
                  <div
                    key={pattern.id}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <button
                        onClick={() => handleMarkAsRead(pattern.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                    <h4 className="text-sm font-semibold text-primary mb-1">
                      {pattern.title || pattern.content.title || "Pattern"}
                    </h4>
                    <p className="text-xs text-foreground/70">
                      {pattern.content.description || pattern.content.summary || "No description available"}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Help Plan Suggestions Section */}
      {suggestionInsights.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setExpandedSection(expandedSection === "suggestions" ? null : "suggestions")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Help Plan Suggestions ({suggestionInsights.length})
              </h3>
            </div>
            <ArrowRight 
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                expandedSection === "suggestions" ? "rotate-90" : ""
              }`}
            />
          </button>
          
          <AnimatePresence>
            {expandedSection === "suggestions" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                {suggestionInsights.slice(0, 5).map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-xl bg-accent/5 border border-accent/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Heart className="w-4 h-4 text-accent" />
                      <button
                        onClick={() => handleMarkAsRead(suggestion.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </button>
                    </div>
                    <h4 className="text-sm font-semibold text-accent mb-1">
                      {suggestion.title || suggestion.content.title || "Suggestion"}
                    </h4>
                    <p className="text-xs text-foreground/70">
                      {suggestion.content.description || suggestion.content.summary || "No description available"}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {unreadInsightsCount === 0 && !isLoadingInsights && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-sm font-semibold text-foreground mb-2">No insights yet</h3>
          <p className="text-xs text-muted-foreground mb-6">
            Generate AI insights to see risks, patterns, and suggestions
          </p>
          <button
            onClick={handleRegenerateInsights}
            disabled={isGenerating || !caseId}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Insights"}
          </button>
        </div>
      )}
    </div>
  );
};
