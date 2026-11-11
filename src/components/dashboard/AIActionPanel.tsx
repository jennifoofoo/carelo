import { useState } from "react";
import { 
  FileText, AlertTriangle, ClipboardList, ListChecks, PenLine, Tag, 
  Clock, Languages, Lightbulb, ShieldAlert, Sparkles, Check, Loader2,
  ChevronDown, ChevronRight, Eye, Users, Heart, Calendar
} from "lucide-react";

interface AIAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  outputType: "case-notes" | "help-plan" | "risks" | "tasks" | "timeline" | "tags";
}

const AI_ACTIONS: AIAction[] = [
  { id: "summarize", label: "Summarize", icon: FileText, description: "Generate a concise summary", outputType: "case-notes" },
  { id: "extract-risks", label: "Extract Risks & Concerns", icon: AlertTriangle, description: "Identify potential risks", outputType: "risks" },
  { id: "report-points", label: "Generate Report Points", icon: ClipboardList, description: "Create report sections", outputType: "case-notes" },
  { id: "help-plan", label: "Generate Help Plan Items", icon: Heart, description: "Create help plan actions", outputType: "help-plan" },
  { id: "action-items", label: "Extract Action Items", icon: ListChecks, description: "Find todos and follow-ups", outputType: "tasks" },
  { id: "rewrite", label: "Rewrite for Clarity", icon: PenLine, description: "Improve writing quality", outputType: "case-notes" },
  { id: "tag-needs", label: "Tag Needs / Topics", icon: Tag, description: "Auto-categorize content", outputType: "tags" },
  { id: "timeline-entry", label: "Create Timeline Entry", icon: Clock, description: "Add to case timeline", outputType: "timeline" },
  { id: "translate", label: "Translate", icon: Languages, description: "Translate to another language", outputType: "case-notes" },
  { id: "follow-ups", label: "Suggest Follow-ups", icon: Lightbulb, description: "Recommend next steps", outputType: "tasks" },
  { id: "sensitive", label: "Detect Sensitive Content", icon: ShieldAlert, description: "Flag sensitive information", outputType: "risks" },
];

interface AnalysisResult {
  risks: string[];
  patterns: string[];
  mentions: { label: string; count: number }[];
  followUps: string[];
  topics: string[];
  needs: string[];
}

interface AIActionPanelProps {
  extractedText: string | null;
  fileType: "pdf" | "image" | "audio" | "voice" | "text" | "doc" | "spreadsheet" | "other";
  onActionComplete?: (actionId: string, result: any) => void;
}

export const AIActionPanel = ({ extractedText, fileType, onActionComplete }: AIActionPanelProps) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisExpanded, setAnalysisExpanded] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAction = async (action: AIAction) => {
    if (!extractedText) return;
    
    setActiveAction(action.id);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCompletedActions(prev => new Set([...prev, action.id]));
    setActiveAction(null);
    
    onActionComplete?.(action.id, { 
      outputType: action.outputType,
      savedTo: action.outputType 
    });
  };

  const runAutoAnalysis = async () => {
    if (!extractedText) return;
    
    setIsAnalyzing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setAnalysis({
      risks: ["Social isolation mentioned", "Sleep pattern concerns noted"],
      patterns: ["Weekly mentions of school stress", "Recurring family meeting requests"],
      mentions: [
        { label: "Emma", count: 5 },
        { label: "School", count: 3 },
        { label: "Mother", count: 2 },
      ],
      followUps: [
        "Schedule school counselor meeting",
        "Check in about sleep next week",
        "Contact family support services"
      ],
      topics: ["Education", "Family", "Health", "Social"],
      needs: ["Emotional support", "School integration", "Sleep hygiene"]
    });
    
    setIsAnalyzing(false);
  };

  const getExtractionStatus = () => {
    switch (fileType) {
      case "pdf": return { method: "PDF Text Extraction", status: "extracted" };
      case "image": return { method: "OCR (Optical Character Recognition)", status: "extracted" };
      case "voice": return { method: "Speech-to-Text Transcription", status: "transcribed" };
      case "text": return { method: "Direct Text", status: "ready" };
      default: return { method: "Text Extraction", status: "extracted" };
    }
  };

  const extraction = getExtractionStatus();

  return (
    <div className="flex flex-col h-full">
      {/* Text Extraction Status */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${extractedText ? "bg-primary" : "bg-muted"}`} />
          <span className="text-xs font-medium text-muted-foreground">
            {extraction.method}
          </span>
        </div>
        {extractedText ? (
          <p className="text-xs text-primary">
            ✓ Text {extraction.status} ({extractedText.split(' ').length} words)
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Extracting text...
          </p>
        )}
      </div>

      {/* AI Actions */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="text-xs font-semibold mb-3 text-muted-foreground">
            AI ACTIONS
          </h4>
          <div className="space-y-1">
            {AI_ACTIONS.map(action => {
              const Icon = action.icon;
              const isActive = activeAction === action.id;
              const isCompleted = completedActions.has(action.id);
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={!extractedText || isActive}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left group ${
                    isCompleted 
                      ? "bg-primary/10 border border-primary/20" 
                      : "border border-transparent hover:bg-secondary"
                  } ${!extractedText ? "opacity-50" : ""}`}
                >
                  <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isCompleted ? "bg-primary/20" : "bg-secondary"
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" strokeWidth={2} />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                    ) : (
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {action.label}
                    </p>
                    {isCompleted && (
                      <p className="text-[10px] text-primary">
                        Saved to {action.outputType}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Analysis Section */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setAnalysisExpanded(!analysisExpanded)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              {analysisExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
              )}
              <h4 className="text-xs font-semibold text-muted-foreground">
                AUTO ANALYSIS
              </h4>
            </div>
            {!analysis && !isAnalyzing && extractedText && (
              <button
                onClick={(e) => { e.stopPropagation(); runAutoAnalysis(); }}
                className="text-xs px-2 py-1 rounded transition-colors bg-primary/10 text-primary"
              >
                Run
              </button>
            )}
          </button>

          {analysisExpanded && (
            <div className="space-y-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" strokeWidth={2} />
                  <span className="text-sm text-muted-foreground">Analyzing document...</span>
                </div>
              ) : analysis ? (
                <>
                  {analysis.risks.length > 0 && (
                    <AnalysisSection 
                      title="Detected Risks" 
                      icon={AlertTriangle}
                      variant="warning"
                      items={analysis.risks}
                    />
                  )}

                  {analysis.patterns.length > 0 && (
                    <AnalysisSection 
                      title="Detected Patterns" 
                      icon={Eye}
                      variant="info"
                      items={analysis.patterns}
                    />
                  )}

                  {analysis.mentions.length > 0 && (
                    <div className="p-3 rounded-lg bg-secondary border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                        <span className="text-xs font-medium text-muted-foreground">Mentions</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.mentions.map((m, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-card text-foreground border border-border">
                            {m.label} <span className="text-muted-foreground">×{m.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.followUps.length > 0 && (
                    <AnalysisSection 
                      title="Suggested Follow-ups" 
                      icon={Calendar}
                      variant="primary"
                      items={analysis.followUps}
                    />
                  )}

                  <div className="flex gap-2">
                    {analysis.topics.length > 0 && (
                      <div className="flex-1 p-3 rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] font-medium text-muted-foreground">Topics</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {analysis.topics.map((t, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.needs.length > 0 && (
                      <div className="flex-1 p-3 rounded-lg bg-secondary border border-border">
                        <span className="text-[10px] font-medium text-muted-foreground">Needs</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {analysis.needs.map((n, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-center py-4 text-muted-foreground">
                  Run analysis to detect risks, patterns, and suggestions
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisSection = ({ 
  title, 
  icon: Icon, 
  variant,
  items 
}: { 
  title: string; 
  icon: React.ComponentType<any>; 
  variant: "warning" | "info" | "primary";
  items: string[] 
}) => {
  const variants = {
    warning: { bg: "bg-warning/10", border: "border-warning/20", text: "text-warning" },
    info: { bg: "bg-info/10", border: "border-info/20", text: "text-info" },
    primary: { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary" },
  };
  
  const v = variants[variant];
  
  return (
    <div className={`p-3 rounded-lg ${v.bg} border ${v.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${v.text}`} strokeWidth={2} />
        <span className={`text-xs font-medium ${v.text}`}>{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs flex items-start gap-2 text-foreground">
            <span className={v.text}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};