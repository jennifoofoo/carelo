import { Home, Mic, Folder, Sparkles, Users } from "lucide-react";
import { motion } from "framer-motion";

type ViewTab = "timeline" | "documents" | "ai-tools" | "caseload";

interface MobileBottomNavProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onVoiceCapture: () => void;
}

export const MobileBottomNav = ({ activeTab, onTabChange, onVoiceCapture }: MobileBottomNavProps) => {
  const navItems = [
    { id: "caseload" as const, icon: Users, label: "Cases" },
    { id: "timeline" as const, icon: Home, label: "Notes" },
    { id: "documents" as const, icon: Folder, label: "Documents" },
    { id: "ai-tools" as const, icon: Sparkles, label: "AI" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Left nav items */}
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-full transition-colors ${
              activeTab === item.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        {/* Floating Voice Button - Hero Feature */}
        <div className="relative -mt-6">
          <motion.button
            onClick={onVoiceCapture}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-primary shadow-xl shadow-primary/30"
          >
            <Mic className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
          </motion.button>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold whitespace-nowrap text-primary">
            Record
          </span>
        </div>

        {/* Right nav items */}
        {navItems.slice(2).map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[56px] h-full transition-colors ${
              activeTab === item.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
