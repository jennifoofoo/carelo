import { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { 
  AlertTriangle, TrendingUp, Lightbulb, Calendar, FileText, 
  ChevronUp, ChevronDown, X, Sparkles 
} from "lucide-react";

interface MobileInsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
}

type DrawerState = "peek" | "half" | "full";

export const MobileInsightsDrawer = ({ isOpen, onClose, caseId }: MobileInsightsDrawerProps) => {
  const [drawerState, setDrawerState] = useState<DrawerState>("half");
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  const heights = {
    peek: "80px",
    half: "50vh",
    full: "90vh",
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 100) {
      // Swiping down
      if (drawerState === "full") setDrawerState("half");
      else if (drawerState === "half") setDrawerState("peek");
      else onClose();
    } else if (velocity < -500 || offset < -100) {
      // Swiping up
      if (drawerState === "peek") setDrawerState("half");
      else if (drawerState === "half") setDrawerState("full");
    }
  };

  const toggleState = () => {
    if (drawerState === "peek") setDrawerState("half");
    else if (drawerState === "half") setDrawerState("full");
    else setDrawerState("half");
  };

  // Mock data
  const risks = [
    { level: "high", title: "School attendance dropping", detail: "3 mentions this week" },
    { level: "medium", title: "Social isolation pattern", detail: "Emerging concern" },
  ];

  const patterns = [
    { icon: TrendingUp, title: "Communication improving", trend: "+15%" },
    { icon: Calendar, title: "Meeting frequency", trend: "Weekly stable" },
  ];

  const suggestions = [
    "Schedule follow-up with school counselor",
    "Review housing support options",
    "Update risk assessment",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: drawerState === "full" ? 0.5 : 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-graphite z-[60]"
            onClick={() => drawerState !== "peek" && setDrawerState("peek")}
          />

          {/* Drawer */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: "100%" }}
            animate={{ height: heights[drawerState] }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-[70] flex flex-col overflow-hidden shadow-elevated"
            style={{ touchAction: "none" }}
          >
            {/* Handle */}
            <div 
              className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleState}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  {drawerState === "full" ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pb-safe">
              {/* Peek preview */}
              {drawerState === "peek" && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/15">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-medium text-foreground">2 risks</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Tap to view insights</span>
                </div>
              )}

              {/* Full content */}
              {drawerState !== "peek" && (
                <div className="space-y-6 pb-6">
                  {/* Emerging Risks */}
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Emerging Risks
                    </h4>
                    <div className="space-y-2">
                      {risks.map((risk, i) => (
                        <div 
                          key={i}
                          className={`p-4 rounded-2xl ${
                            risk.level === "high" 
                              ? "bg-destructive/10 border border-destructive/20" 
                              : "bg-warning/10 border border-warning/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                              risk.level === "high" ? "text-destructive" : "text-warning"
                            }`} />
                            <div>
                              <p className="font-medium text-foreground">{risk.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{risk.detail}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Patterns */}
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Patterns
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {patterns.map((pattern, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-muted">
                          <pattern.icon className="w-5 h-5 text-primary mb-2" />
                          <p className="text-sm font-medium text-foreground">{pattern.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{pattern.trend}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Suggested Actions */}
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Suggested Actions
                    </h4>
                    <div className="space-y-2">
                      {suggestions.map((suggestion, i) => (
                        <button 
                          key={i}
                          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 active:bg-primary/10 transition-colors"
                        >
                          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground text-left">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Weekly Summary */}
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Weekly Summary
                    </h4>
                    <div className="p-4 rounded-2xl bg-muted">
                      <p className="text-sm text-foreground leading-relaxed">
                        This week showed positive engagement with 3 completed sessions. 
                        Key focus areas include school attendance and social connections. 
                        Consider increasing family involvement in upcoming sessions.
                      </p>
                    </div>
                  </section>

                  {/* Help Plan Draft */}
                  <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Help Plan Draft
                    </h4>
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 active:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">View draft help plan</span>
                      </div>
                      <ChevronUp className="w-4 h-4 text-muted-foreground rotate-90" />
                    </button>
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
