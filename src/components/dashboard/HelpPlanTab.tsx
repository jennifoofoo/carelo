import { useState, useEffect } from "react";
import { 
  RefreshCw, Download, ChevronDown, ChevronUp,
  Plus, X, AlertTriangle, Shield, FileText, Highlighter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface Source {
  id: string;
  type: "note" | "document";
  title: string;
  timestamp: string;
  preview: string;
  selected: boolean;
}

interface HelpPlanData {
  period: string;
  
  // Institution Header
  institution_name?: string;
  institution_address?: string;
  institution_contact?: string;
  
  // Structured Life Areas
  privateLife?: string[];
  socialLife?: string[];
  emotionalWellbeing?: string[];
  familyParents?: string[];
  schoolEducation?: string[];
  
  // Classic Fields
  goals: string[];
  actions: string[];
  risks: string[];
  protectiveFactors: string[];
  summary: string;
  highlightedSentences?: string[];  // Sentences from highlights
  
  // Critical Risks (from AI Insights)
  criticalRisks?: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
}

interface HelpPlanTabProps {
  caseId?: string;
}

const HelpPlanTab = ({ caseId }: HelpPlanTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sourcesChanged, setSourcesChanged] = useState(false);
  
  const [helpPlan, setHelpPlan] = useState<HelpPlanData>({
    period: "",
    institution_name: "",
    institution_address: "",
    institution_contact: "",
    privateLife: [],
    socialLife: [],
    emotionalWellbeing: [],
    familyParents: [],
    schoolEducation: [],
    goals: [],
    actions: [],
    risks: [],
    protectiveFactors: [],
    summary: "",
    criticalRisks: []
  });
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  // Use cached data for notes (sources)
  const { data: notesData, refetch: refetchNotes } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.notes.list(caseId);
    },
    {
      cacheKey: `notes_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes
      enabled: !!caseId,
    }
  );

  // Ensure notes is always an array
  const notes = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);

  // Track source selection separately
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());

  // Transform notes to sources with selection state
  const sources: Source[] = notes.map((note: any) => ({
    id: note.id,
    type: note.source === 'pdf' || note.source === 'image' ? 'document' : 'note',
    title: note.source === 'pdf' ? 'PDF Document' : note.source === 'image' ? 'Image' : 'Note',
    timestamp: new Date(note.created_at).toLocaleDateString(),
    preview: note.normalized?.substring(0, 100) || note.raw_content?.substring(0, 100) || 'No preview',
    selected: selectedSourceIds.has(note.id) || selectedSourceIds.size === 0 // Default to all selected
  }));

  // Initialize selectedSourceIds when notes change
  useEffect(() => {
    if (notes && notes.length > 0 && selectedSourceIds.size === 0) {
      setSelectedSourceIds(new Set(notes.map((n: any) => n.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes?.length || 0, selectedSourceIds.size]);

  // Use cached data for highlights
  const { data: highlightsList, refetch: refetchHighlights } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.highlights.list(caseId);
    },
    {
      cacheKey: `highlights_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes
      enabled: !!caseId,
    }
  );

  // Ensure highlights is always an array
  const highlights = Array.isArray(highlightsList) ? highlightsList : (highlightsList ? [highlightsList] : []);

  // Use cached data for critical risks (from AI Insights)
  const { data: insightsData } = useCachedData(
    async () => {
      if (!caseId) return [];
      const allRisks = await api.insights.list(caseId, 'risk');
      // Filter for critical risks on frontend
      return allRisks.filter((risk: any) => risk.severity === 'critical');
    },
    {
      cacheKey: `critical_risks_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes
      enabled: !!caseId,
    }
  );

  // Ensure critical risks is always an array
  const criticalRisks = Array.isArray(insightsData) ? insightsData : (insightsData ? [insightsData] : []);

  useEffect(() => {
    if (caseId) {
      loadHelpPlan();
    } else {
      setIsLoading(false);
    }
  }, [caseId]);

  const loadHighlights = async () => {
    if (!caseId) return;
    try {
      // Refetch highlights using the cached data hook
      await refetchHighlights();
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const loadHelpPlan = async () => {
    if (!caseId) return;
    
    try {
      setIsLoading(true);
      const currentPlan = await api.helpPlans.getCurrent(caseId);
      
      if (currentPlan && currentPlan.content) {
        setCurrentPlanId(currentPlan.id);
        setHelpPlan({
          period: currentPlan.content.period || "",
          institution_name: currentPlan.content.institution_name || "",
          institution_address: currentPlan.content.institution_address || "",
          institution_contact: currentPlan.content.institution_contact || "",
          privateLife: currentPlan.content.privateLife || [],
          socialLife: currentPlan.content.socialLife || [],
          emotionalWellbeing: currentPlan.content.emotionalWellbeing || [],
          familyParents: currentPlan.content.familyParents || [],
          schoolEducation: currentPlan.content.schoolEducation || [],
          goals: currentPlan.content.goals || [],
          actions: currentPlan.content.actions || [],
          risks: currentPlan.content.risks || [],
          protectiveFactors: currentPlan.content.protectiveFactors || [],
          summary: currentPlan.content.summary || "",
          highlightedSentences: currentPlan.content.highlightedSentences || [],
          criticalRisks: currentPlan.content.criticalRisks || []
        });
      }
    } catch (error: any) {
      if (error.message === 'NOT_FOUND' || error.message?.includes('No help plan found')) {
        console.log('No existing help plan');
      } else {
        console.error('Error loading help plan:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!caseId) return;

    setIsSaving(true);
    try {
      const content = {
        period: helpPlan.period,
        institution_name: helpPlan.institution_name,
        institution_address: helpPlan.institution_address,
        institution_contact: helpPlan.institution_contact,
        privateLife: helpPlan.privateLife,
        socialLife: helpPlan.socialLife,
        emotionalWellbeing: helpPlan.emotionalWellbeing,
        familyParents: helpPlan.familyParents,
        schoolEducation: helpPlan.schoolEducation,
        goals: helpPlan.goals,
        actions: helpPlan.actions,
        risks: helpPlan.risks,
        protectiveFactors: helpPlan.protectiveFactors,
        summary: helpPlan.summary
      };

      if (currentPlanId) {
        await api.helpPlans.update(currentPlanId, content);
        toast({ title: "Saved", description: "Help plan updated" });
      } else {
        const result = await api.helpPlans.create(caseId, content);
        setCurrentPlanId(result.id);
        toast({ title: "Saved", description: "Help plan created" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSourcesChanged(true);
  };

  const handleRegenerate = async () => {
    if (!caseId) return;

    setIsGenerating(true);
    setSourcesChanged(false);
    
    try {
      const result = await api.ai.generateHelpPlan(caseId);
      
      if (result && result.content) {
        setHelpPlan({
          period: result.content.period || helpPlan.period,
          institution_name: result.content.institution_name || "",
          institution_address: result.content.institution_address || "",
          institution_contact: result.content.institution_contact || "",
          privateLife: result.content.privateLife || [],
          socialLife: result.content.socialLife || [],
          emotionalWellbeing: result.content.emotionalWellbeing || [],
          familyParents: result.content.familyParents || [],
          schoolEducation: result.content.schoolEducation || [],
          goals: result.content.goals || [],
          actions: result.content.actions || [],
          risks: result.content.risks || [],
          protectiveFactors: result.content.protectiveFactors || [],
          summary: result.content.summary || "",
          criticalRisks: result.content.criticalRisks || []
        });
        
        if (result.id) setCurrentPlanId(result.id);
        toast({ title: "Generated", description: "Help plan created from sources" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  type ArrayField = "goals" | "actions" | "risks" | "protectiveFactors" | "privateLife" | "socialLife" | "emotionalWellbeing" | "familyParents" | "schoolEducation";

  const addItem = (field: ArrayField) => {
    setHelpPlan(prev => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  };

  const updateItem = (field: ArrayField, index: number, value: string) => {
    setHelpPlan(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (field: ArrayField, index: number) => {
    setHelpPlan(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const hasContent = sources.some(s => s.selected);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!hasContent && sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
          <FileText className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-medium text-foreground mb-1">No sources available</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add notes or documents to generate a help plan.
        </p>
        <Button size="sm" variant="outline">Add a note</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-[22px] font-semibold text-foreground mb-1">Help Plan Draft</h1>
        <p className="text-sm text-muted-foreground">
          Generated from {sources.filter(s => s.selected).length} sources
          </p>
        
        {/* Action Row */}
        <div className="flex items-center gap-2 mt-4">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !caseId}
            size="sm"
            className="h-8 px-3 text-[13px]"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button 
            onClick={handleRegenerate}
            disabled={isGenerating || !caseId}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[13px] gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} strokeWidth={1.5} />
            Regenerate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[13px] gap-1.5"
            onClick={async () => {
              if (!currentPlanId) {
                toast({
                  title: "No Help Plan",
                  description: "Please save the help plan first before exporting",
                  variant: "destructive",
                });
                return;
              }
              try {
                await api.helpPlans.exportPDF(currentPlanId);
                toast({
                  title: "PDF Export Started",
                  description: "Your PDF download should begin shortly",
                });
              } catch (error: any) {
                toast({
                  title: "Error Exporting PDF",
                  description: error.message || "Failed to export PDF",
                  variant: "destructive",
                });
              }
            }}
            disabled={!currentPlanId}
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[13px] gap-1.5"
            onClick={async () => {
              if (!currentPlanId) {
                toast({
                  title: "No Help Plan",
                  description: "Please save the help plan first before exporting",
                  variant: "destructive",
                });
                return;
              }
              try {
                await api.helpPlans.exportWord(currentPlanId);
                toast({
                  title: "Word Export Started",
                  description: "Your Word document download should begin shortly",
                });
              } catch (error: any) {
                toast({
                  title: "Error Exporting Word",
                  description: error.message || "Failed to export Word document",
                  variant: "destructive",
                });
              }
            }}
            disabled={!currentPlanId}
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Word
          </Button>
        </div>
      </header>

      {/* Sources - Minimal collapsible */}
      <section className="mb-8">
        <button 
          onClick={() => setSourcesOpen(!sourcesOpen)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          <span>Sources Used</span>
          <span className="text-muted-foreground font-normal">({sources.filter(s => s.selected).length})</span>
          {sourcesOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          )}
        </button>
        
        {sourcesOpen && (
          <div className="mt-3 space-y-1">
            {sourcesChanged && (
              <p className="text-xs text-primary mb-2">Sources changed. Regenerate to apply.</p>
            )}
              {sources.map(source => (
                <label 
                  key={source.id}
                className="flex items-center gap-3 py-2 px-1 rounded hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox 
                    checked={source.selected}
                    onCheckedChange={() => toggleSource(source.id)}
                  className="h-4 w-4"
                  />
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground flex-1 truncate">{source.title}</span>
                      <span className="text-xs text-muted-foreground">{source.timestamp}</span>
                </label>
              ))}
          </div>
        )}
      </section>

      {/* Generating State */}
      {isGenerating && (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-5 h-5 text-primary animate-spin mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">Building help plan…</p>
        </div>
      )}

      {/* Editor */}
      {!isGenerating && (
        <div className="space-y-8">
          {/* Period */}
          <section>
            <label className="text-sm font-medium text-foreground block mb-2">
              Help Plan Period
            </label>
            <Input 
              value={helpPlan.period}
              onChange={(e) => setHelpPlan(prev => ({ ...prev, period: e.target.value }))}
              className="h-9 text-sm max-w-xs rounded-md border-border"
              placeholder="e.g., Jan 2024 – Jun 2024"
            />
          </section>

          <div className="h-px bg-border" />

          {/* Critical Risks - Auto-loaded from AI Insights (Read-only) */}
          {criticalRisks.length > 0 && (
            <>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
                    Critical Risks (from AI Analysis)
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {criticalRisks.length} identified
                  </span>
                </div>
                <div className="space-y-2">
                  {criticalRisks.map((risk: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                    >
                      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{risk.title || risk.content?.title || 'Risk'}</p>
                        {risk.content?.description && (
                          <p className="text-xs text-muted-foreground mt-1">{risk.content.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These risks were automatically identified by AI and are included in help plan generation.
                </p>
              </section>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Structured Life Areas */}
          <section>
            <h2 className="text-sm font-semibold text-foreground mb-4">Lebensbereiche (Life Areas)</h2>
            
            {/* Privates / Persönliche Situation */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Privates / Persönliche Situation</h3>
                <button 
                  onClick={() => addItem("privateLife")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(helpPlan.privateLife || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <Input 
                      value={item}
                      onChange={(e) => updateItem("privateLife", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Personal/living situation..."
                    />
                    <button 
                      onClick={() => removeItem("privateLife", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Soziales Umfeld */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Soziales Umfeld</h3>
                <button 
                  onClick={() => addItem("socialLife")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(helpPlan.socialLife || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <Input 
                      value={item}
                      onChange={(e) => updateItem("socialLife", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Social relationships, friends..."
                    />
                    <button 
                      onClick={() => removeItem("socialLife", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gefühlswelt / Emotionale Lage */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Gefühlswelt / Emotionale Lage</h3>
                <button 
                  onClick={() => addItem("emotionalWellbeing")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(helpPlan.emotionalWellbeing || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <Input 
                      value={item}
                      onChange={(e) => updateItem("emotionalWellbeing", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Emotional state, feelings..."
                    />
                    <button 
                      onClick={() => removeItem("emotionalWellbeing", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Eltern / Familie */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Eltern / Familie</h3>
                <button 
                  onClick={() => addItem("familyParents")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(helpPlan.familyParents || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <Input 
                      value={item}
                      onChange={(e) => updateItem("familyParents", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Family dynamics, parents..."
                    />
                    <button 
                      onClick={() => removeItem("familyParents", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Schule / Ausbildung */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Schule / Ausbildung</h3>
                <button 
                  onClick={() => addItem("schoolEducation")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {(helpPlan.schoolEducation || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <Input 
                      value={item}
                      onChange={(e) => updateItem("schoolEducation", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="School, education, learning..."
                    />
                    <button 
                      onClick={() => removeItem("schoolEducation", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Goals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Goals</h2>
              <button 
                onClick={() => addItem("goals")}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={1.5} />
                Add goal
              </button>
            </div>
            <div className="space-y-2">
              {helpPlan.goals.map((goal, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                  <Input 
                    value={goal}
                    onChange={(e) => updateItem("goals", index, e.target.value)}
                    className="flex-1 h-8 text-sm rounded-md border-border"
                    placeholder="Enter goal..."
                  />
                  <button 
                    onClick={() => removeItem("goals", index)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
              {helpPlan.goals.length === 0 && (
                <p className="text-sm text-muted-foreground">No goals added yet.</p>
              )}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Highlighted Sentences (from user highlights in database) */}
          {highlights.length > 0 && (
            <>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Highlighter className="w-3.5 h-3.5 text-yellow-600" strokeWidth={1.5} />
                    Highlighted Sentences for Help Plan
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {highlights.length} available
                  </span>
                </div>
                <div className="space-y-2">
                  {highlights.map((highlight) => (
                    <div 
                      key={highlight.id} 
                      className="flex items-start gap-2 group p-3 rounded-lg bg-yellow-50/50 border border-yellow-200/50 hover:bg-yellow-50 transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-yellow-600 flex-shrink-0 mt-2" />
                      <p className="flex-1 text-sm text-foreground leading-relaxed">{highlight.text}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={async () => {
                            try {
                              await api.highlights.markUsed(highlight.id);
                              toast({ title: "Highlight marked as used", description: "This highlight will be included in the next help plan generation." });
                              loadHighlights(); // Reload to update list
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message || "Failed to update highlight", variant: "destructive" });
                            }
                          }}
                          className="text-xs text-primary hover:text-primary/80 p-1"
                          title="Mark as Used"
                        >
                          <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.highlights.delete(highlight.id);
                              toast({ title: "Highlight removed", description: "Highlight has been deleted." });
                              loadHighlights(); // Reload to update list
                            } catch (error: any) {
                              toast({ title: "Error", description: error.message || "Failed to delete highlight", variant: "destructive" });
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Remove Highlight"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These sentences will be automatically included when you generate a new help plan.
                </p>
              </section>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Highlighted Sentences (from saved help plan content) */}
          {helpPlan.highlightedSentences && helpPlan.highlightedSentences.length > 0 && (
            <>
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Highlighter className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                    Highlighted Sentences (included in this plan)
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {helpPlan.highlightedSentences.length} included
                  </span>
                </div>
                <div className="space-y-2">
                  {helpPlan.highlightedSentences.map((sentence, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                    >
                      <p className="text-sm text-foreground leading-relaxed">{sentence}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="h-px bg-border" />
            </>
          )}

          {/* Planned Actions */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Planned Actions</h2>
              <button 
                onClick={() => addItem("actions")}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" strokeWidth={1.5} />
                Add action
              </button>
            </div>
            <div className="space-y-2">
              {helpPlan.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                  <Input 
                    value={action}
                    onChange={(e) => updateItem("actions", index, e.target.value)}
                    className="flex-1 h-8 text-sm rounded-md border-border"
                    placeholder="Enter action..."
                  />
                  <button 
                    onClick={() => removeItem("actions", index)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ))}
              {helpPlan.actions.length === 0 && (
                <p className="text-sm text-muted-foreground">No actions added yet.</p>
              )}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* Risks & Protective Factors - Two columns */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Risks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" strokeWidth={1.5} />
                  Risks
                </h2>
                <button 
                  onClick={() => addItem("risks")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {helpPlan.risks.map((risk, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <Input 
                      value={risk}
                      onChange={(e) => updateItem("risks", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Enter risk..."
                    />
                    <button 
                      onClick={() => removeItem("risks", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                {helpPlan.risks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No risks identified.</p>
                )}
              </div>
            </section>

            {/* Protective Factors */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  Protective Factors
                </h2>
                <button 
                  onClick={() => addItem("protectiveFactors")}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {helpPlan.protectiveFactors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-2 group">
                    <Input 
                      value={factor}
                      onChange={(e) => updateItem("protectiveFactors", index, e.target.value)}
                      className="flex-1 h-8 text-sm rounded-md border-border"
                      placeholder="Enter factor..."
                    />
                    <button 
                      onClick={() => removeItem("protectiveFactors", index)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                {helpPlan.protectiveFactors.length === 0 && (
                  <p className="text-sm text-muted-foreground">No factors added.</p>
                )}
              </div>
            </section>
          </div>

          <div className="h-px bg-border" />

          {/* Summary */}
          <section>
            <label className="text-sm font-medium text-foreground block mb-2">
              Summary
            </label>
              <Textarea 
                value={helpPlan.summary}
                onChange={(e) => setHelpPlan(prev => ({ ...prev, summary: e.target.value }))}
              className="min-h-[100px] text-sm leading-relaxed rounded-md border-border resize-none"
                placeholder="Enter summary narrative..."
              />
          </section>

          {/* Footer */}
          <footer className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Generated from {sources.filter(s => s.selected).length} sources
            </p>
          </footer>
        </div>
      )}
    </div>
  );
};

export default HelpPlanTab;