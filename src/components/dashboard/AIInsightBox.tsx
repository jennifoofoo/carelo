import { Sparkles, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface AIInsightBoxProps {
  onAction?: () => void;
}

export const AIInsightBox = ({ onAction }: AIInsightBoxProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="mb-6 p-4 flex items-start gap-4 bg-primary/10 rounded-xl border border-primary/20">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary">
        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Insight
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">
          Emma mentioned feeling <strong>isolated twice this week</strong>. Consider scheduling a family check-in to discuss school integration support.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onAction}
          className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium transition-colors rounded-lg bg-primary text-white"
        >
          <span>Apply</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-primary/20 text-primary"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};