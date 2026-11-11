import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface Case {
  id: string;
  name: string;
  lastActivity: string;
  tags: string[];
  priority?: "high" | "medium" | "low";
  initials: string;
}

interface MobileCaseListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (caseId: string) => void;
  selectedCaseId?: string;
  onCreateCase: () => void;
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const getTimeAgo = (dateString: string | null | undefined): string => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export const MobileCaseList = ({
  isOpen,
  onClose,
  onSelectCase,
  selectedCaseId,
  onCreateCase,
}: MobileCaseListProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadCases = async () => {
      try {
        setIsLoading(true);
        const casesData = await api.cases.list();
        
        // Deduplicate by ID before transforming
        const casesMap = new Map<string, Case>();
        casesData.forEach((c: any) => {
          if (!casesMap.has(c.id)) {
            casesMap.set(c.id, {
          id: c.id,
          name: c.client_name || c.title || `Case ${c.id.substring(0, 6)}`,
          lastActivity: getTimeAgo(c.updated_at),
          tags: c.tags || [],
          priority: c.priority || undefined,
          initials: getInitials(c.client_name || c.title || "NA"),
            });
          }
        });
        const transformedCases: Case[] = Array.from(casesMap.values());
        setCases(transformedCases);
      } catch (error) {
        console.error("Error loading cases:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadCases();
    }
  }, [isOpen]);

  const filteredCases = cases.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {/* Full-screen modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-background z-[70] flex flex-col safe-area-top safe-area-bottom"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Caseload</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCreateCase}
                  className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4">
              <div className="flex items-center gap-3 px-4 h-12 bg-muted rounded-xl">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Case list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No cases found" : "No cases yet"}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={onCreateCase}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                    >
                      Create first case
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => {
                        onSelectCase(caseItem.id);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                        selectedCaseId === caseItem.id
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-card border border-border active:bg-muted"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                        selectedCaseId === caseItem.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {caseItem.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {caseItem.name}
                          </p>
                          {caseItem.priority === "high" && (
                            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {caseItem.lastActivity}
                          </span>
                        </div>
                        {caseItem.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {caseItem.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
