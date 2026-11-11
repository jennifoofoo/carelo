import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ClipboardList, FileText, AlertTriangle, ListTodo, 
  Sparkles, Languages, PenLine, BarChart3 
} from "lucide-react";

interface MobileAIActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
}

const aiActions = [
  { 
    id: "help-plan",
    icon: ClipboardList, 
    label: "Draft Help Plan", 
    description: "Generate structured support plan",
    color: "bg-primary/10",
    iconColor: "text-primary"
  },
  { 
    id: "summary",
    icon: Sparkles, 
    label: "Weekly Summary", 
    description: "Summarize this week's notes",
    color: "bg-primary/10",
    iconColor: "text-primary"
  },
  { 
    id: "risk",
    icon: AlertTriangle, 
    label: "Risk Analysis", 
    description: "Detect patterns and concerns",
    color: "bg-warning/10",
    iconColor: "text-warning"
  },
  { 
    id: "report",
    icon: FileText, 
    label: "Report Builder", 
    description: "Create professional reports",
    color: "bg-primary/10",
    iconColor: "text-primary"
  },
  { 
    id: "translate",
    icon: Languages, 
    label: "Translate", 
    description: "Multi-language support",
    color: "bg-muted",
    iconColor: "text-muted-foreground"
  },
  { 
    id: "grammar",
    icon: PenLine, 
    label: "Grammar Fix", 
    description: "Professional corrections",
    color: "bg-muted",
    iconColor: "text-muted-foreground"
  },
  { 
    id: "tasks",
    icon: ListTodo, 
    label: "Task Generator", 
    description: "Extract action items",
    color: "bg-info/10",
    iconColor: "text-info"
  },
  { 
    id: "analytics",
    icon: BarChart3, 
    label: "Case Analytics", 
    description: "View case statistics",
    color: "bg-muted",
    iconColor: "text-muted-foreground"
  },
];

export const MobileAIActionSheet = ({ isOpen, onClose, onSelectAction }: MobileAIActionSheetProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-graphite/50 z-[60]"
            onClick={onClose}
          />

          {/* Action sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-[70] max-h-[85vh] flex flex-col safe-area-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">AI Tools</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Grid of actions */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="grid grid-cols-2 gap-3">
                {aiActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      onSelectAction(action.id);
                      onClose();
                    }}
                    className="flex flex-col items-start p-4 rounded-2xl bg-card border border-border active:bg-muted transition-colors min-h-[120px]"
                  >
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-semibold text-foreground text-left">
                      {action.label}
                    </span>
                    <span className="text-xs text-muted-foreground text-left mt-1">
                      {action.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
