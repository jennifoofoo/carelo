import { useState } from "react";
import { 
  Sparkles, ArrowRight, X, Upload, FileText, 
  Lightbulb, CheckCircle2, ChevronRight, AlertTriangle,
  Heart, ListChecks, Check, Clock
} from "lucide-react";

type OnboardingStep = "intro" | "actionbar" | "upload" | "insights" | "complete" | null;

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow = ({ onComplete, onSkip }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>("intro");
  const [showSampleOutput, setShowSampleOutput] = useState(false);
  const [uploadDemo, setUploadDemo] = useState(false);

  const handleNext = () => {
    switch (step) {
      case "intro":
        setStep("actionbar");
        break;
      case "actionbar":
        setStep("upload");
        break;
      case "upload":
        setStep("insights");
        break;
      case "insights":
        setStep("complete");
        break;
      case "complete":
        onComplete();
        break;
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Intro Modal
  if (step === "intro") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div 
          className="absolute inset-0 transition-opacity bg-foreground/30 backdrop-blur-sm"
          onClick={handleSkip}
        />
        <div 
          className="relative w-full max-w-md mx-4 p-8 rounded-lg animate-fade-in bg-card border border-border"
        >
          {/* Decorative Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary/10">
            <Sparkles className="w-8 h-8 text-primary" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-semibold text-center mb-3 text-foreground">
            Carelo thinks with you.
          </h1>
          <p className="text-center text-base leading-relaxed mb-8 text-muted-foreground">
            Whether it is voice, text, or PDF — Carelo processes everything automatically.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {["Voice Notes", "Documents", "Auto-Summaries", "Risk Detection"].map((feature) => (
              <span 
                key={feature}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-base font-medium transition-all hover:scale-[1.02] bg-primary text-white shadow-primary"
            >
              <span>Show me</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={handleSkip}
              className="w-full h-10 text-sm font-medium transition-colors hover:bg-secondary rounded-lg text-muted-foreground"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: AI Actionbar with Auto-Analysis
  if (step === "actionbar") {
    return (
      <div className="fixed inset-0 z-[100]">
        {/* Overlay with cutout effect */}
        <div className="absolute inset-0 transition-opacity bg-foreground/60 backdrop-blur-sm" />
        
        {/* Highlighted Area Indicator */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-16 sm:top-[180px] w-[95vw] sm:w-[700px] max-w-[95vw] p-1 rounded-2xl sm:rounded-3xl animate-fade-in"
          style={{ 
            background: "rgba(255,255,255,0.15)",
            boxShadow: "0 0 0 9999px rgba(26, 26, 26, 0.6)"
          }}
        >
          {/* Sample Card */}
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-card">
            <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center bg-primary/10">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-foreground">Voice Note</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground">2:30 PM</p>
              </div>
              {/* Analyzed Badge */}
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-full bg-primary/10 flex-shrink-0">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                <span className="text-[9px] sm:text-[10px] font-semibold text-primary">Analyzed</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm mb-2 sm:mb-3 text-muted-foreground line-clamp-2">
              Emma shared concerns about feeling isolated at school. Mentioned conflict with classmates during lunch break.
            </p>
            
            {/* AI Actionbar with Result Count Badges */}
            <div className="flex items-center gap-1 pt-2 sm:pt-3 relative border-t border-border flex-wrap">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 text-muted-foreground" />
              
              <button
                onClick={() => setShowSampleOutput(true)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                  showSampleOutput 
                    ? "bg-primary/10 text-primary" 
                    : "bg-primary text-white animate-pulse"
                }`}
              >
                {showSampleOutput && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Summarize
              </button>
              
              {/* Actions with Result Count Badges */}
              <button className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-secondary text-muted-foreground">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Risks</span>
                <span className="px-1 sm:px-1.5 py-0.5 rounded-full bg-warning/20 text-warning text-[9px] sm:text-[10px] font-semibold">2</span>
              </button>
              
              <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground">
                <Heart className="w-3 h-3" />
                <span>Help Plan</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold">3</span>
              </button>
              
              <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground">
                <ListChecks className="w-3 h-3" />
                <span>Tasks</span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold">2</span>
              </button>
            </div>

            {/* Sample AI Output */}
            {showSampleOutput && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl animate-fade-in bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" strokeWidth={2} />
                  <span className="text-[10px] sm:text-xs font-semibold text-primary">AI Summary</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                  Emma is experiencing social difficulties at school, specifically feeling isolated and having conflicts with classmates during lunch.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-[180px] w-[90vw] sm:w-[400px] max-w-[90vw] p-4 sm:p-5 rounded-lg animate-fade-in bg-card border border-border">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
              <span className="text-xs sm:text-sm font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-semibold mb-1 text-foreground">
                Every note has built-in AI
              </h3>
              <p className="text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-3 text-muted-foreground">
                {showSampleOutput 
                  ? "Great! AI instantly processes your content after saving."
                  : "Click any action to see instant AI insights."}
              </p>
              {showSampleOutput && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  Continue <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Upload Demonstration - Simplified for mobile
  if (step === "upload") {
    return (
      <div className="fixed inset-0 z-[100]">
        <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

        {/* Centered Upload Demo */}
        <div className="absolute inset-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-[90vw] sm:max-w-[600px] flex flex-col justify-center">
          {/* Upload Button Demo */}
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border animate-fade-in mb-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setUploadDemo(true)}
                className={`h-12 w-12 flex items-center justify-center rounded-xl transition-all ${
                  uploadDemo 
                    ? "bg-primary/10 text-primary" 
                    : "bg-primary text-white animate-pulse"
                }`}
              >
                <Upload className="w-5 h-5" strokeWidth={2} />
              </button>
              <div>
                <p className="font-semibold text-foreground">Upload Files</p>
                <p className="text-xs text-muted-foreground">PDFs, images, documents</p>
              </div>
            </div>

            {/* Sample Upload Result */}
            {uploadDemo && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary mb-3">
                  <FileText className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">School_Report.pdf</p>
                    <p className="text-xs text-muted-foreground">2 pages</p>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                    <span className="text-xs font-semibold text-primary">AI Analysis</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground mb-2">
                    Q3 school report shows improved math scores. Teacher notes Emma is more engaged but still struggles with group work.
                  </p>
                  <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-[10px] sm:text-xs font-medium text-warning">⚠ Risk: Social difficulties in group settings</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tooltip */}
          <div className="p-4 sm:p-5 rounded-lg bg-card border border-border">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                <span className="text-xs sm:text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-semibold mb-1 text-foreground">
                  Upload any file
                </h3>
                <p className="text-[10px] sm:text-xs leading-relaxed mb-2 sm:mb-3 text-muted-foreground">
                  {uploadDemo 
                    ? "Carelo instantly extracts summaries and risks from any document."
                    : "Tap the upload button to see how Carelo processes documents."}
                </p>
                {uploadDemo && (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary"
                  >
                    Continue <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: AI Intelligence Panel - Simplified for mobile
  if (step === "insights") {
    return (
      <div className="fixed inset-0 z-[100]">
        <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

        {/* Mobile-friendly scrollable panel */}
        <div 
          className="absolute inset-4 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-80 flex flex-col animate-fade-in bg-card sm:rounded-none rounded-xl overflow-hidden"
          style={{ 
            boxShadow: "-8px 0 32px rgba(0,0,0,0.08)"
          }}
        >
          <div className="h-12 sm:h-14 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold text-foreground">AI Intelligence</span>
            </div>
            <span className="text-xs text-muted-foreground">Real-time</span>
          </div>
          
          <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto">
            {/* Critical Risks Section */}
            <div>
              <div className="flex items-center gap-2 mb-2 p-2 sm:p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-semibold text-red-600">Critical Risks</span>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-card border border-border">
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  <span className="text-xs sm:text-sm font-medium text-foreground">Social isolation pattern</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium bg-red-600/10 text-red-600 border border-red-600/30">
                    Critical
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Mentioned twice this week
                </p>
              </div>
            </div>

            {/* Help Plan Suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-2 p-2 sm:p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-semibold text-foreground">Help Plan</span>
              </div>
              <div className="p-2 sm:p-3 rounded-md bg-card border border-border">
                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Schedule school counselor meeting</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Discuss social integration strategies</p>
              </div>
            </div>

            {/* Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-2 p-2 sm:p-3 bg-secondary rounded-lg">
                <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" strokeWidth={2} />
                <span className="text-xs sm:text-sm font-semibold text-foreground">Tasks</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium text-white bg-foreground">3</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-md bg-card border border-border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-[1.5px] border-primary flex items-center justify-center" />
                  <span className="text-xs sm:text-sm text-foreground">Schedule family meeting</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tooltip at bottom */}
          <div className="p-3 sm:p-4 border-t border-border bg-secondary/50">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                <span className="text-[10px] sm:text-xs font-bold text-primary">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xs sm:text-sm font-semibold mb-1 text-foreground">
                  AI monitors everything
                </h3>
                <p className="text-[10px] sm:text-xs leading-relaxed mb-2 text-muted-foreground">
                  Patterns, risks, and tasks surface automatically.
                </p>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  Continue <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Complete
  if (step === "complete") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 transition-opacity bg-foreground/30 backdrop-blur-sm"
          onClick={onComplete}
        />
        <div className="relative w-full max-w-md p-6 sm:p-8 rounded-lg animate-fade-in bg-card border border-border">
          {/* Success Icon */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-primary/10">
            <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" strokeWidth={1.5} />
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-center mb-2 sm:mb-3 text-foreground">
            You are all set!
          </h1>
          <p className="text-center text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 text-muted-foreground">
            Carelo is ready to help you save time and focus on what matters most.
          </p>

          <button
            onClick={onComplete}
            className="w-full h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl text-sm sm:text-base font-medium transition-all hover:scale-[1.02] bg-primary text-white shadow-primary"
          >
            <span>Start Working</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
