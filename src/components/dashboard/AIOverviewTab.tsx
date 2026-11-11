import { 
  TrendingUp, AlertTriangle, Heart, ListChecks, FileText, 
  Calendar, ArrowRight, Sparkles, Clock, Users, Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCachedData } from "@/hooks/useCachedData";

interface AIOverviewTabProps {
  caseId: string;
  onNavigate?: (tab: "timeline" | "tasks" | "reports" | "documents") => void;
}

interface OverviewData {
  summary: string;
  statistics: {
    total_notes: number;
    open_tasks: number;
    completed_tasks: number;
    risk_level: string;
    last_update: string;
  };
  trends: Array<{
    label: string;
    value: number;
    trend: "up" | "down" | "stable";
    description: string;
  }>;
  risks: Array<{
    title: string;
    severity: "high" | "medium" | "low";
    mentions: number;
    lastSeen: string;
  }>;
  recommendations: Array<{
    title: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  help_plan_progress?: {
    goals: Array<{
      goal: string;
      progress: number;
      status: "on-track" | "needs-attention" | "ahead";
    }>;
  };
}

export const AIOverviewTab = ({ caseId, onNavigate }: AIOverviewTabProps) => {
  const { toast } = useToast();
  
  // Use cached data with 10-minute TTL - only regenerates when cache expires or case changes
  const { data, isLoading, error } = useCachedData(
    async () => {
      if (!caseId) return null;
      try {
        return await api.ai.getCaseOverview(caseId);
      } catch (err: any) {
        console.error("Error loading AI overview:", err);
        toast({
          title: "Error",
          description: "Could not load AI overview. Please try again.",
          variant: "destructive",
        });
        throw err;
      }
    },
    {
      cacheKey: `ai_overview_${caseId}`,
      ttl: 30 * 60 * 1000, // 30 minutes — AI overview rarely changes mid-session
      enabled: !!caseId,
    }
  );

  if (!caseId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Please select a case to view AI overview</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generating AI overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">Error loading overview</p>
          <p className="text-xs text-muted-foreground">{error.message || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  const getRiskIcon = (level: string) => {
    if (level.toLowerCase() === "high") return "🔴";
    if (level.toLowerCase() === "medium") return "🟡";
    return "🟢";
  };

  const getRecommendationIcon = (priority: string) => {
    if (priority === "high") return AlertTriangle;
    if (priority === "medium") return FileText;
    return Calendar;
  };

  return (
    <div className="space-y-6">
      {/* AI Summary Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/15">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-2">Case Intelligence Summary</h2>
            <p className="text-sm text-white/80 leading-relaxed">
              {data.summary || "No summary available. Please add notes to generate insights."}
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          <button 
            onClick={() => onNavigate?.("timeline")}
            className="p-3 rounded-xl text-center bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white/60 mx-auto mb-1" strokeWidth={2} />
            <p className="text-lg font-semibold text-white">{data.statistics.total_notes}</p>
            <p className="text-[10px] text-white/60">Total Notes</p>
          </button>
          <button 
            onClick={() => onNavigate?.("tasks")}
            className="p-3 rounded-xl text-center bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <ListChecks className="w-4 h-4 text-white/60 mx-auto mb-1" strokeWidth={2} />
            <p className="text-lg font-semibold text-white">{data.statistics.open_tasks}</p>
            <p className="text-[10px] text-white/60">Open Tasks</p>
          </button>
          <div className="p-3 rounded-xl text-center bg-white/10">
            <AlertTriangle className="w-4 h-4 text-white/60 mx-auto mb-1" strokeWidth={2} />
            <p className="text-lg font-semibold text-white">{getRiskIcon(data.statistics.risk_level)} {data.statistics.risk_level}</p>
            <p className="text-[10px] text-white/60">Risk Level</p>
          </div>
          <div className="p-3 rounded-xl text-center bg-white/10">
            <Clock className="w-4 h-4 text-white/60 mx-auto mb-1" strokeWidth={2} />
            <p className="text-lg font-semibold text-white">{data.statistics.last_update}</p>
            <p className="text-[10px] text-white/60">Last Update</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trends & Patterns */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-info" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-foreground">Trends & Patterns</h3>
          </div>
          
          <div className="space-y-4">
            {data.trends && data.trends.length > 0 ? (
              data.trends.map((trend, i) => (
                <TrendItem key={i} {...trend} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No trend data available</p>
            )}
          </div>
        </div>

        {/* Active Risks */}
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-foreground">Active Risks</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
              {data.risks.length} active
            </span>
          </div>
          
          <div className="space-y-3">
            {data.risks && data.risks.length > 0 ? (
              data.risks.map((risk, i) => (
                <RiskCard key={i} {...risk} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No active risks identified</p>
            )}
          </div>
        </div>
      </div>

      {/* Help Plan Progress */}
      {data.help_plan_progress && data.help_plan_progress.goals && data.help_plan_progress.goals.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-foreground">Help Plan Progress</h3>
            </div>
            <button 
              onClick={() => onNavigate?.("reports")}
              className="text-xs font-medium flex items-center gap-1 hover:opacity-70 transition-opacity text-primary"
            >
              View Full Plan <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {data.help_plan_progress.goals.map((goal, i) => (
              <GoalCard key={i} {...goal} />
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" strokeWidth={2} />
          <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {data.recommendations && data.recommendations.length > 0 ? (
            data.recommendations.map((rec, i) => {
              const Icon = getRecommendationIcon(rec.priority);
              
              // Determine navigation based on recommendation title
              const getNavigationForRecommendation = (title: string) => {
                if (title.toLowerCase().includes('task')) return () => onNavigate?.("tasks");
                if (title.toLowerCase().includes('help plan') || title.toLowerCase().includes('plan')) return () => onNavigate?.("reports");
                if (title.toLowerCase().includes('risk') || title.toLowerCase().includes('note')) return () => onNavigate?.("timeline");
                return undefined;
              };
              
              return (
                <RecommendationCard 
                  key={i} 
                  {...rec} 
                  icon={Icon} 
                  onClick={getNavigationForRecommendation(rec.title)}
                />
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground col-span-2">No recommendations available</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const TrendItem = ({ label, value, trend, description }: { 
  label: string; 
  value: number; 
  trend: "up" | "down" | "stable"; 
  description: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-secondary">
      <div 
        className={`h-full rounded-full transition-all ${
          trend === "up" ? "bg-primary" : trend === "down" ? "bg-warning" : "bg-muted-foreground"
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
    <p className="text-[10px] mt-1 text-muted-foreground">{description}</p>
  </div>
);

const RiskCard = ({ title, severity, mentions, lastSeen }: {
  title: string;
  severity: "high" | "medium" | "low";
  mentions: number;
  lastSeen: string;
}) => (
  <div className={`p-3 rounded-xl ${severity === "high" ? "bg-warning/10" : severity === "medium" ? "bg-warning/5" : "bg-secondary"}`}>
    <div className="flex items-start justify-between mb-2">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        severity === "high" 
          ? "bg-warning/20 text-warning" 
          : severity === "medium"
            ? "bg-warning/10 text-warning"
            : "bg-muted text-muted-foreground"
      }`}>
        {severity}
      </span>
    </div>
    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
      <span>{mentions} mention{mentions !== 1 ? 's' : ''}</span>
      <span>•</span>
      <span>Last: {lastSeen}</span>
    </div>
  </div>
);

const GoalCard = ({ goal, progress, status }: {
  goal: string;
  progress: number;
  status: "on-track" | "needs-attention" | "ahead";
}) => (
  <div className="p-4 rounded-xl bg-secondary">
    <p className="text-sm font-medium mb-2 text-foreground">{goal}</p>
    <div className="h-2 rounded-full mb-2 bg-muted">
      <div 
        className={`h-full rounded-full ${
          status === "ahead" ? "bg-primary" : status === "needs-attention" ? "bg-warning" : "bg-info"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-foreground">{progress}%</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
        status === "ahead" 
          ? "bg-primary/10 text-primary" 
          : status === "needs-attention" 
            ? "bg-warning/10 text-warning" 
            : "bg-info/10 text-info"
      }`}>
        {status.replace("-", " ")}
      </span>
    </div>
  </div>
);

const RecommendationCard = ({ title, reason, priority, icon: Icon, onClick }: {
  title: string;
  reason: string;
  priority: "high" | "medium" | "low";
  icon: React.ComponentType<any>;
  onClick?: () => void;
}) => (
  <button 
    onClick={onClick}
    className="p-4 rounded-md text-left transition-colors hover:bg-muted/50 hover:border-primary/30 bg-card border border-border"
  >
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        priority === "high" ? "bg-warning/10" : "bg-secondary"
      }`}>
        <Icon 
          className={`w-4 h-4 ${priority === "high" ? "text-warning" : "text-muted-foreground"}`}
          strokeWidth={2} 
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-0.5 text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{reason}</p>
      </div>
    </div>
  </button>
);
