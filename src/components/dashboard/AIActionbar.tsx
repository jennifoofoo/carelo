import { useState } from "react";
import { 
  FileText, AlertTriangle, Heart, ListChecks, Languages, 
  PenLine, FileBarChart, Loader2, Check, Sparkles, Shield
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

interface AIAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  shortLabel?: string;
}

const getActionsForType = (contentType: string): AIAction[] => {
  const baseActions: AIAction[] = [
    { id: "summarize", label: "Summarize", icon: FileText, shortLabel: "Sum" },
    { id: "extract-risks", label: "Extract Risks", icon: AlertTriangle, shortLabel: "Risks" },
    { id: "help-plan", label: "Draft Help Plan", icon: Heart, shortLabel: "Plan" },
    { id: "tasks", label: "Create Tasks", icon: ListChecks, shortLabel: "Tasks" },
  ];

  if (contentType === "voice" || contentType === "note") {
    return [
      ...baseActions,
      { id: "translate", label: "Translate", icon: Languages },
      { id: "rewrite", label: "Fix Grammar", icon: PenLine },
      { id: "report", label: "Report Segment", icon: FileBarChart },
      { id: "anonymize", label: "Anonymize", icon: Shield, shortLabel: "Anon" },
    ];
  }

  if (contentType === "document") {
    return [
      ...baseActions,
      { id: "report", label: "Report Segment", icon: FileBarChart },
      { id: "anonymize", label: "Anonymize", icon: Shield, shortLabel: "Anon" },
    ];
  }

  return baseActions;
};

interface AIActionbarProps {
  contentType: "voice" | "note" | "visit" | "document" | "plan" | "task";
  contentId: string;
  onActionClick?: (actionId: string, contentId: string) => void;
  compact?: boolean;
}

export const AIActionbar = ({ contentType, contentId, onActionClick, compact = false }: AIActionbarProps) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [aiResults, setAiResults] = useState<any>(null);
  const [showAllResults, setShowAllResults] = useState(false);

  const actions = getActionsForType(contentType);

  const handleAction = async (action: AIAction) => {
    if (activeAction) return;
    
    setActiveAction(action.id);
    
    try {
      console.log(`🤖 Running AI Action: ${action.id} for note ${contentId.substring(0, 8)}...`);
      
      // Special handling for "Create Tasks" action
      if (action.id === "tasks") {
        // First, get or run Universal Agent to get AI results
        const aiResult = await api.ai.runUniversalAgent(contentId, false);
        
        if (aiResult.status === "ready" && aiResult.result) {
          const tasks = aiResult.result.helpPlanDraft?.actions || [];
          
          if (tasks.length > 0) {
            // Get the case ID from the note
            const note = await api.notes.get(contentId);
            const caseId = note.case_id;
            
            if (!caseId) {
              toast({
                title: "❌ Error",
                description: "Note is not associated with a case",
                variant: "destructive",
              });
              setActiveAction(null);
              return;
            }
            
            // Create tasks via batch API
            const { invalidateCache } = await import('@/hooks/useCachedData');
            const taskSuggestions = tasks.map((task: string) => ({
              title: task,
              priority: 'medium',
            }));
            
            await api.tasks.batchCreate(caseId, taskSuggestions);
            
            // Invalidate cache and dispatch event
            invalidateCache(`tasks_${caseId}`);
            window.dispatchEvent(new CustomEvent('taskCreated', { detail: { caseId } }));
            
            setCompletedActions(prev => new Set([...prev, action.id]));
            
            toast({
              title: "✅ Tasks created!",
              description: `${tasks.length} tasks added to your task list`,
            });
            
            onActionClick?.(action.id, contentId);
          } else {
            toast({
              title: "ℹ️ No tasks found",
              description: "No task suggestions available for this note",
            });
          }
        }
        
        setActiveAction(null);
        return;
      }
      
      // Check if analysis already exists (should be instant if auto-generated)
      // Show loading toast only if needed
      
      // Special handling for anonymize action
      if (action.id === "anonymize") {
        const result = await api.ai.anonymizeNote(contentId);
        
        if (result.status === "ready") {
          setCompletedActions(prev => new Set([...prev, action.id]));
          toast({
            title: "✅ Document anonymized",
            description: "Anonymized version created and added to documents",
          });
          
          // Trigger refresh of notes/documents
          window.dispatchEvent(new CustomEvent('noteCreated'));
          
          // Callback if provided
          onActionClick?.(action.id, contentId);
        } else {
          toast({
            title: "❌ Anonymization failed",
            description: result.error || "Please try again",
            variant: "destructive",
          });
        }
        return;
      }
      
      // Run Universal AI Agent for other actions
      const result = await api.ai.runUniversalAgent(contentId, false);
      
      if (result.status === "ready" && result.result) {
        setAiResults(result.result);
        // Mark ALL actions as completed since Universal Agent generates all results at once
        setCompletedActions(new Set(['summarize', 'extract-risks', 'help-plan', 'report', 'rewrite']));
        
        // Show specific result based on action
        const messages: Record<string, { title: string; description: string }> = {
          summarize: {
            title: "✅ Zusammenfassung generiert!",
            description: result.result.summary?.substring(0, 100) || "...",
          },
          'extract-risks': {
            title: `⚠️  ${result.result.risks?.length || 0} Risiken gefunden`,
            description: result.result.risks?.[0] || "Keine Risiken erkannt",
          },
          'help-plan': {
            title: "💚 Hilfeplan-Vorschläge generiert!",
            description: `${result.result.helpPlanDraft?.goals?.length || 0} Ziele, ${result.result.helpPlanDraft?.actions?.length || 0} Maßnahmen`,
          },
          report: {
            title: "📄 Report-Segment erstellt!",
            description: result.result.reportSegment?.substring(0, 100) || "...",
          },
          rewrite: {
            title: "✅ Grammatik korrigiert!",
            description: "Text wurde verbessert",
          },
        };
        
        const message = messages[action.id] || {
          title: "✅ AI-Analyse abgeschlossen!",
          description: "Ergebnisse verfügbar"
        };
        
        toast(message);
        
        console.log('✅ AI Results:', result.result);
        
        // Callback if provided
        onActionClick?.(action.id, contentId);
        
      } else if (result.status === "error") {
        toast({
          title: "❌ AI-Analyse fehlgeschlagen",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('❌ AI Action error:', error);
      toast({
        title: "❌ Fehler",
        description: error.message || "AI-Analyse fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setActiveAction(null);
    }
  };

  // Calculate result counts
  const getResultCount = (actionId: string): number | null => {
    if (!aiResults) return null;
    
    switch (actionId) {
      case 'extract-risks':
        return aiResults.risks?.length || 0;
      case 'help-plan':
        const goals = aiResults.helpPlanDraft?.goals?.length || 0;
        const actions = aiResults.helpPlanDraft?.actions?.length || 0;
        return goals + actions;
      case 'tasks':
        return aiResults.helpPlanDraft?.actions?.length || 0;
      default:
        return null;
    }
  };

  // Check if AI analysis is available
  const hasAIAnalysis = completedActions.size > 0;

  return (
    <div 
      className={`${compact ? "mt-2" : "mt-3 pt-3"}`}
      style={{ borderTop: compact ? "none" : "1px solid hsl(var(--border))" }}
    >
      {/* AI Analysis Ready Badge */}
      {hasAIAnalysis && !compact && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-md bg-primary/5">
          <Sparkles className="w-3 h-3 text-primary" strokeWidth={2} />
          <span className="text-xs font-medium text-primary">✨ Analyzed</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        {!hasAIAnalysis && (
          <div className="flex items-center gap-0.5 mr-1 text-muted-foreground">
            <Sparkles className="w-3 h-3" strokeWidth={2} />
          </div>
        )}
        
        <div className="flex items-center gap-1 flex-wrap">
          {actions.slice(0, compact ? 4 : 7).map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;
            const isCompleted = completedActions.has(action.id);
            const count = getResultCount(action.id);
            
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={isActive}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.02] disabled:cursor-wait ${
                  isCompleted 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                ) : isCompleted ? (
                  <Check className="w-3 h-3" strokeWidth={2} />
                ) : (
                  <Icon className="w-3 h-3" strokeWidth={2} />
                )}
                <span className="group-hover:underline">
                  {compact && action.shortLabel ? action.shortLabel : action.label}
                </span>
                {isCompleted && count !== null && count > 0 && (
                  <span className="ml-0.5 text-[10px] px-1 py-0.5 rounded-full bg-primary/20 font-semibold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
