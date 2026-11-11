import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ClipboardList, FileText, AlertTriangle, ListTodo, 
  Sparkles, Languages, PenLine, BarChart3, ChevronRight,
  TrendingUp, Calendar
} from "lucide-react";

const aiTools = [
  { 
    id: "help-plan",
    icon: ClipboardList, 
    label: "Help Plan", 
    description: "Generate structured help plans",
    color: "bg-primary/10",
    iconColor: "text-primary"
  },
  { 
    id: "reports",
    icon: FileText, 
    label: "Reports", 
    description: "Create professional reports",
    color: "bg-accent/10",
    iconColor: "text-accent"
  },
  { 
    id: "risk",
    icon: AlertTriangle, 
    label: "Risk Analysis", 
    description: "Detect patterns and risks",
    color: "bg-warning/10",
    iconColor: "text-warning"
  },
  { 
    id: "tasks",
    icon: ListTodo, 
    label: "Tasks", 
    description: "Extract action items",
    color: "bg-info/10",
    iconColor: "text-info"
  },
  { 
    id: "summarize",
    icon: Sparkles, 
    label: "Summarize", 
    description: "Summarize any content",
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
    id: "rewrite",
    icon: PenLine, 
    label: "Rewrite", 
    description: "Professional corrections",
    color: "bg-accent/10",
    iconColor: "text-accent"
  },
  { 
    id: "analytics",
    icon: BarChart3, 
    label: "Analytics", 
    description: "Case statistics",
    color: "bg-muted",
    iconColor: "text-muted-foreground"
  },
];

// Mock AI overview data
const overviewStats = [
  { label: "Notes this week", value: "12", icon: FileText },
  { label: "Tasks pending", value: "5", icon: ListTodo },
  { label: "Risk level", value: "Medium", icon: AlertTriangle },
];

const trends = [
  { title: "Engagement", trend: "+15%", positive: true },
  { title: "Attendance", trend: "-5%", positive: false },
  { title: "Progress", trend: "+8%", positive: true },
];

const recentOutputs = [
  { type: "Summary", content: "Emma showing signs of social isolation. Key concerns: sleep, peer conflicts.", time: "2h ago" },
  { type: "Risk Alert", content: "Pattern detected: Isolation mentioned 3x this week.", time: "1d ago" },
];

interface MobileAIToolsProps {
  onToolClick?: (toolId: string) => void;
}

export const MobileAITools = ({ onToolClick }: MobileAIToolsProps) => {
  const [activeSection, setActiveSection] = useState<"tools" | "overview">("tools");

  return (
    <div className="pb-28">
      {/* Section toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSection("tools")}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeSection === "tools"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          AI Tools
        </button>
        <button
          onClick={() => setActiveSection("overview")}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
            activeSection === "overview"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Overview
        </button>
      </div>

      {activeSection === "tools" && (
        <>
          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {aiTools.map((tool) => (
              <motion.button
                key={tool.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToolClick?.(tool.id)}
                className="flex flex-col items-start p-4 rounded-2xl bg-card border border-border active:bg-muted transition-colors min-h-[120px]"
              >
                <div 
                  className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-3`}
                >
                  <tool.icon className={`w-6 h-6 ${tool.iconColor}`} strokeWidth={1.5} />
                </div>
                <span className="text-sm font-semibold text-foreground text-left">
                  {tool.label}
                </span>
                <span className="text-xs text-muted-foreground text-left mt-1">
                  {tool.description}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Recent AI Outputs */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Recent AI Outputs
            </h3>
            <div className="space-y-3">
              {recentOutputs.map((output, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {output.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{output.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{output.content}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeSection === "overview" && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {overviewStats.map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border text-center">
                <stat.icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Trends */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Trends
            </h3>
            <div className="space-y-2">
              {trends.map((trend, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className={`w-5 h-5 ${trend.positive ? "text-primary" : "text-destructive"}`} />
                    <span className="font-medium text-foreground">{trend.title}</span>
                  </div>
                  <span className={`font-semibold ${trend.positive ? "text-primary" : "text-destructive"}`}>
                    {trend.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Weekly Summary
            </h3>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-sm text-foreground/80 leading-relaxed">
                This week showed positive engagement with 3 completed sessions. 
                Key focus areas include school attendance and social connections. 
                Consider increasing family involvement in upcoming sessions.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                "Generate full report",
                "Update risk assessment",
                "Schedule review meeting"
              ].map((action, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border active:bg-muted transition-colors"
                >
                  <span className="font-medium text-foreground">{action}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
