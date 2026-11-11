import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, AlertTriangle, TrendingUp, Heart,
  ListChecks, Sparkles, Eye, Clock, ArrowRight, RefreshCw, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface AIInsightPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  inline?: boolean;
  caseId?: string;
  onNavigateToTasks?: () => void;
  onNavigateToOverview?: () => void;
}

export const AIInsightPanel = ({ collapsed, onToggle, inline = false, caseId, onNavigateToTasks, onNavigateToOverview }: AIInsightPanelProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>("risks");
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset state when caseId changes
  useEffect(() => {
    setExpandedSection("risks");
    setIsGenerating(false);
  }, [caseId]);

  // Use cached data for insights
  const { data: insightsData, isLoading: isLoadingInsights, refetch: refetchInsights, error: insightsError } = useCachedData(
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
  const insights: Insight[] = insightsData ?? [];

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

  // Listen for task changes (create, update, delete)
  useEffect(() => {
    if (!caseId) return;

    const handleTaskChange = (event: CustomEvent) => {
      if (event.detail?.caseId === caseId) {
        invalidateCache(`tasks_${caseId}`);
        refetchTasks();
      }
    };

    window.addEventListener('taskCreated', handleTaskChange as EventListener);
    window.addEventListener('taskUpdated', handleTaskChange as EventListener);
    window.addEventListener('taskDeleted', handleTaskChange as EventListener);

    return () => {
      window.removeEventListener('taskCreated', handleTaskChange as EventListener);
      window.removeEventListener('taskUpdated', handleTaskChange as EventListener);
      window.removeEventListener('taskDeleted', handleTaskChange as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleGenerateInsights = async () => {
    if (!caseId) {
      toast({
        title: "No Case Selected",
        description: "Please select a case first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await api.insights.generate(caseId);
      
      toast({
        title: "✅ Generating Insights",
        description: "This may take a moment...",
      });

      // Reload insights after a delay
      setTimeout(() => {
        invalidateCache(`insights_${caseId}`);
        refetchInsights();
      }, 3000);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error Generating Insights",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsRead = async (insightId: string) => {
    try {
      await api.insights.markAsRead(insightId);
      refetchInsights();
    } catch (error: any) {
      console.error('Error marking insight as read:', error);
    }
  };

  // Calculate stats from real data
  // Note: riskInsights are already prioritized by LLM in loadInsights
  const riskInsights = insights.filter(i => i.type === "risk" && !i.is_read);
  const patternInsights = insights.filter(i => i.type === "pattern");
  const suggestionInsights = insights.filter(i => i.type === "suggestion");
  const openTasks = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
  const overdueTasks = openTasks.filter(t => {
    if (!t.due_date) return false;
    return new Date(t.due_date) < new Date() && new Date(t.due_date).toDateString() !== new Date().toDateString();
  });

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  if (collapsed) {
    return (
      <aside 
        className="fixed right-0 top-0 bottom-0 w-14 flex flex-col items-center pt-20 gap-3 z-10 bg-card/80 backdrop-blur-md border-l border-border"
      >
        <button
          onClick={onToggle}
          className="w-9 h-9 rounded-md flex items-center justify-center transition-all hover:scale-105 bg-secondary"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" strokeWidth={2} />
        </button>
        
        <div className="flex flex-col items-center gap-2 mt-4">
          <div 
            className="w-9 h-9 rounded-md flex items-center justify-center bg-red-500/10 relative"
            title={`${riskInsights.length} Critical Risks`}
          >
            <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2} />
            {riskInsights.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {riskInsights.length}
              </span>
            )}
          </div>
          <div 
            className="w-9 h-9 rounded-md flex items-center justify-center bg-primary/10"
            title="AI Insights"
          >
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div 
            className="w-9 h-9 rounded-md flex items-center justify-center bg-secondary relative"
            title={`${openTasks.length} Pending Tasks`}
          >
            <ListChecks className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            {openTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {openTasks.length}
              </span>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // Inline mode for medium screens
  if (inline) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-2 border-b border-border">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">AI Intelligence</span>
            <p className="text-[10px] text-muted-foreground">Real-time case analysis</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-md bg-destructive/5 border border-destructive/10">
              <p className="text-h4 font-semibold text-destructive">{riskInsights.length}</p>
              <p className="text-[10px] text-muted-foreground">Critical Risks</p>
            </div>
            <div className="text-center p-3 rounded-md bg-warning/5 border border-warning/10">
              <p className="text-h4 font-semibold text-warning">{patternInsights.length}</p>
              <p className="text-[10px] text-muted-foreground">Patterns</p>
            </div>
            <div className="text-center p-3 rounded-md bg-primary/5 border border-primary/10">
              <p className="text-h4 font-semibold text-primary">{openTasks.length}</p>
              <p className="text-[10px] text-muted-foreground">Tasks Due</p>
            </div>
          </div>
        </div>

        {/* Content - Collapsed accordion style for inline */}
        <div className="px-4 py-4">
          <InsightSection
            title="Critical Risks"
            icon={AlertTriangle}
            iconColor="text-red-600"
            bgColor="bg-red-500/5"
            borderColor="border-red-500/10"
            isExpanded={expandedSection === "risks"}
            onToggle={() => setExpandedSection(expandedSection === "risks" ? null : "risks")}
            badge={riskInsights.length > 0 ? riskInsights.length.toString() : undefined}
            badgeColor="bg-red-500"
          >
            {riskInsights.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No risks detected
              </div>
            ) : (
              <div className="space-y-2">
                {riskInsights.map(insight => (
                  <RiskCard 
                    key={insight.id}
                    title={insight.title || insight.content?.title || "Risk Detected"}
                    description={insight.content?.description || insight.content?.message || "No description available"}
                    level={(insight.severity || "medium") as "high" | "medium" | "low"}
                    timeAgo={getTimeAgo(insight.created_at)}
                    isRead={insight.is_read}
                    onMarkAsRead={() => handleMarkAsRead(insight.id)}
                  />
                ))}
              </div>
            )}
          </InsightSection>

          <InsightSection
            title="Tasks & Follow-ups"
            icon={ListChecks}
            iconColor="text-muted-foreground"
            bgColor="bg-secondary"
            borderColor="border-border"
            isExpanded={expandedSection === "tasks"}
            onToggle={() => setExpandedSection(expandedSection === "tasks" ? null : "tasks")}
            badge={openTasks.length > 0 ? openTasks.length.toString() : undefined}
            badgeColor="bg-foreground"
          >
            {openTasks.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                No open tasks
              </div>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 5).map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && 
                                    new Date(task.due_date).toDateString() !== new Date().toDateString();
                  return (
                    <div 
                      key={task.id}
                      onClick={() => onNavigateToTasks?.()}
                      className={`flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer border ${
                        isOverdue 
                          ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                          : "bg-card border-border hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isOverdue ? "border-red-500" : "border-primary"
                        }`} />
                        <div>
                          <span className="text-sm text-foreground">{task.title}</span>
                          {isOverdue && (
                            <p className="text-[10px] text-red-600 font-medium">Overdue</p>
                          )}
                        </div>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3 h-3 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </InsightSection>
        </div>
      </div>
    );
  }

  return (
    <aside 
      className="fixed right-0 top-0 bottom-0 w-[360px] flex flex-col z-10 bg-card border-l border-border"
    >
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">AI Intelligence</span>
            <p className="text-[10px] text-muted-foreground">Real-time case analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-secondary disabled:opacity-50"
            title="Regenerate Insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isGenerating ? "animate-spin" : ""}`} strokeWidth={2} />
          </button>
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-secondary"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 py-4 border-b border-border">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-md bg-red-500/5 border border-red-500/10">
            <p className="text-2xl font-bold text-red-600">{riskInsights.length}</p>
            <p className="text-[10px] text-muted-foreground">Critical Risks</p>
          </div>
          <div className="text-center p-3 rounded-md bg-amber-500/5 border border-amber-500/10">
            <p className="text-2xl font-bold text-amber-600">{patternInsights.length}</p>
            <p className="text-[10px] text-muted-foreground">Patterns</p>
          </div>
          <div className="text-center p-3 rounded-md bg-primary/5 border border-primary/10">
            <p className="text-2xl font-bold text-primary">{openTasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Tasks Due</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Error Banner */}
        {insightsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>Insights konnten nicht geladen werden.</span>
              <button
                onClick={() => refetchInsights()}
                className="ml-3 text-xs font-medium underline underline-offset-2 hover:no-underline"
              >
                Wiederholen
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State Banner */}
        {insights.length === 0 && !isLoadingInsights && (
          <div className="mx-0 mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">Noch keine Insights</p>
            <p className="text-xs text-muted-foreground mb-3">
              Analysiere diesen Fall mit KI, um Risiken, Muster und Handlungsempfehlungen zu erkennen.
            </p>
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? "Wird generiert..." : "Insights generieren"}
            </button>
          </div>
        )}

        {/* Emerging Risks - Top Priority */}
        <InsightSection
          title="Critical Risks"
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-500/5"
          borderColor="border-red-500/10"
          isExpanded={expandedSection === "risks"}
          onToggle={() => setExpandedSection(expandedSection === "risks" ? null : "risks")}
          badge={riskInsights.length > 0 ? riskInsights.length.toString() : undefined}
          badgeColor="bg-red-500"
        >
          {isLoadingInsights ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          ) : riskInsights.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Noch keine Risiken erkannt — Insights generieren, um Risiken zu sehen
            </div>
          ) : (
            <div className="space-y-2">
              {riskInsights.map(insight => (
                <RiskCard 
                  key={insight.id}
                  title={insight.title || insight.content?.title || "Risk Detected"}
                  description={insight.content?.description || insight.content?.message || "No description available"}
                  level={(insight.severity || "medium") as "high" | "medium" | "low"}
                  timeAgo={getTimeAgo(insight.created_at)}
                  isRead={insight.is_read}
                  onMarkAsRead={() => handleMarkAsRead(insight.id)}
                />
              ))}
            </div>
          )}
        </InsightSection>

        {/* Patterns Detected */}
        <InsightSection
          title="Patterns Detected"
          icon={TrendingUp}
          iconColor="text-amber-600"
          bgColor="bg-amber-500/5"
          borderColor="border-amber-500/10"
          isExpanded={expandedSection === "patterns"}
          onToggle={() => setExpandedSection(expandedSection === "patterns" ? null : "patterns")}
          badge={patternInsights.length > 0 ? patternInsights.length.toString() : undefined}
          badgeColor="bg-amber-500"
        >
          {patternInsights.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Noch keine Muster erkannt
            </div>
          ) : (
            <div className="space-y-2">
              {patternInsights.map(insight => (
                <div key={insight.id} className="p-3 rounded-md bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {insight.title || insight.content?.title || "Pattern Detected"}
                    </span>
                    {insight.content?.trend && (
                      <span className={`text-xs font-medium ${
                        insight.content.trend === "up" ? "text-primary" : 
                        insight.content.trend === "down" ? "text-warning" : 
                        "text-muted-foreground"
                      }`}>
                        {insight.content.trend === "up" ? "↑" : insight.content.trend === "down" ? "↓" : "→"} 
                        {insight.content.trend === "up" ? " Improving" : 
                         insight.content.trend === "down" ? " Declining" : 
                         " Stable"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {insight.content?.description || insight.content?.message || "No description available"}
                  </p>
                  {insight.content?.progress && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${insight.content.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-primary">{insight.content.progress}%</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">{getTimeAgo(insight.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </InsightSection>

        {/* Help Plan Suggestions */}
        <InsightSection
          title="Help Plan Suggestions"
          icon={Heart}
          iconColor="text-primary"
          bgColor="bg-primary/5"
          borderColor="border-primary/10"
          isExpanded={expandedSection === "plan"}
          onToggle={() => setExpandedSection(expandedSection === "plan" ? null : "plan")}
          badge={suggestionInsights.length > 0 ? "AI" : undefined}
          badgeColor="bg-primary"
        >
          {suggestionInsights.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Noch keine Vorschläge — Insights generieren, um Empfehlungen zu sehen
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Based on recent activity, AI suggests:
              </p>
              {suggestionInsights.map((insight, idx) => {
                // Parse suggestions from content
                const suggestionsText = insight.content?.suggestions || insight.content?.message || "";
                // Try to extract bullet points or list items
                const suggestions = suggestionsText
                  .split(/\n|\r/)
                  .filter(line => line.trim().length > 0 && (line.includes('-') || line.includes('•') || line.match(/^\d+\./)))
                  .map(line => line.replace(/^[-•\d.\s]+/, '').trim())
                  .filter(line => line.length > 0)
                  .slice(0, 5); // Limit to 5 suggestions
                
                // If no structured suggestions found, show the text as-is
                const displaySuggestions = suggestions.length > 0 
                  ? suggestions 
                  : [suggestionsText.substring(0, 200) + (suggestionsText.length > 200 ? '...' : '')];
                
                return (
                  <div key={insight.id} className="space-y-2">
                    {displaySuggestions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {idx < suggestionInsights.length - 1 && (
                      <div className="border-t border-border my-2" />
                    )}
                  </div>
                );
              })}
              <button 
                onClick={() => onNavigateToOverview?.()}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90"
              >
                <Eye className="w-4 h-4" strokeWidth={2} />
                View in Help Plan
              </button>
            </div>
          )}
        </InsightSection>

        {/* Tasks & Follow-ups */}
        <InsightSection
          title="Tasks & Follow-ups"
          icon={ListChecks}
          iconColor="text-muted-foreground"
          bgColor="bg-secondary"
          borderColor="border-border"
          isExpanded={expandedSection === "tasks"}
          onToggle={() => setExpandedSection(expandedSection === "tasks" ? null : "tasks")}
          badge={openTasks.length > 0 ? openTasks.length.toString() : undefined}
          badgeColor="bg-foreground"
        >
          {openTasks.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Keine offenen Tasks
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.slice(0, 5).map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && 
                                  new Date(task.due_date).toDateString() !== new Date().toDateString();
                return (
                  <div 
                    key={task.id}
                    onClick={() => {
                      onNavigateToTasks?.();
                    }}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors cursor-pointer border ${
                      isOverdue 
                        ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                        : "bg-card border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        isOverdue ? "border-red-500" : "border-primary"
                      }`} />
                      <div>
                        <span className="text-sm text-foreground">{task.title}</span>
                        {isOverdue && (
                          <p className="text-[10px] text-red-600 font-medium">Überfällig</p>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3 h-3 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </InsightSection>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-border">
        <button 
          onClick={() => onNavigateToOverview?.()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        >
          <span>View Full Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

// Helper Components
interface InsightSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

const InsightSection = ({ 
  title, icon: Icon, iconColor, bgColor, borderColor, isExpanded, onToggle, badge, badgeColor, children 
}: InsightSectionProps) => (
  <div className="mb-3">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 rounded-md transition-all border ${
        isExpanded ? `${bgColor} ${borderColor}` : "border-transparent hover:bg-secondary"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${isExpanded ? "bg-card" : bgColor}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2} />
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium text-white ${badgeColor || "bg-primary"}`}>
          {badge}
        </span>
      )}
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-3 pb-3 pt-2">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface RiskCardProps {
  title: string;
  description: string;
  level: "high" | "medium" | "low";
  timeAgo: string;
  isRead?: boolean;
  onMarkAsRead?: () => void;
}

const RiskCard = ({ title, description, level, timeAgo, isRead, onMarkAsRead }: RiskCardProps) => {
  const levelConfig = {
    high: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20", label: "High" },
    medium: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", label: "Medium" },
    low: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", label: "Low" },
  };

  const config = levelConfig[level] || levelConfig.medium; // Fallback to medium if level is invalid

  return (
    <div 
      className={`p-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer ${
        isRead ? "opacity-60" : ""
      }`}
      onClick={onMarkAsRead}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}>
          {config.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        {!isRead && (
          <span className="text-[10px] text-primary">Neu</span>
        )}
      </div>
    </div>
  );
};