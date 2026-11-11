import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateCaseModal } from "./CreateCaseModal";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface Case {
  id: string;
  name: string;
  age: number;
  tags: { label: string; type: "priority" | "stable" | "school" | "family" }[];
  lastActivity: string;
  initials: string;
}

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
};

const tagColors = {
  priority: "text-destructive",
  stable: "text-primary",
  school: "text-muted-foreground",
  family: "text-primary",
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

interface CaseListPanelProps {
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  collapsed?: boolean;
}

export const CaseListPanel = ({ selectedCaseId, onSelectCase, collapsed = false }: CaseListPanelProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Use cached data hook
  const { data: backendCases, isLoading, refetch } = useCachedData(
    async () => {
      console.log('📡 Loading cases from API...');
      const cases = await api.cases.list();
      console.log('✅ Received cases:', cases?.length || 0);
      return cases || [];
    },
    {
      cacheKey: 'cases_list',
      ttl: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform backend cases to UI format and deduplicate by ID
  const casesMap = new Map<string, Case>();
  (backendCases || []).forEach((c: any) => {
    if (!casesMap.has(c.id)) {
      casesMap.set(c.id, {
    id: c.id,
    name: c.client_name || c.title || 'Unnamed',
    age: c.client_id ? parseInt(c.client_id) || 0 : 0,
    tags: [{ 
      label: c.priority === 'high' ? 'Priority' : 'Stable', 
      type: c.priority === 'high' ? 'priority' : 'stable' 
    }],
    lastActivity: getTimeAgo(c.updated_at),
    initials: getInitials(c.client_name || c.title || 'UN'),
      });
    }
  });
  const cases: Case[] = Array.from(casesMap.values());

  // Auto-select first case if none selected OR if selected case doesn't exist
  useEffect(() => {
    if (cases.length > 0) {
      // Check if selected case still exists
      const selectedCaseExists = selectedCaseId && cases.some(c => c.id === selectedCaseId);
      
      if (!selectedCaseId || !selectedCaseExists) {
        // Auto-select first case if none selected or selected case doesn't exist
        console.log(selectedCaseId && !selectedCaseExists 
          ? '⚠️ Selected case no longer exists, switching to first available case'
          : '✅ Auto-selecting first case:', cases[0].id
        );
      onSelectCase(cases[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cases.length, selectedCaseId]); // Only depend on length and selectedCaseId to avoid infinite loops

  // Listen for cache invalidation events
  useEffect(() => {
    const handleInvalidate = (event: CustomEvent) => {
      // Only refetch if this is NOT a cases_list invalidation (to avoid infinite loop)
      if (event.detail?.cacheKey !== 'cases_list') {
      refetch();
      }
    };
    
    window.addEventListener('carelo:cache-invalidate', handleInvalidate as EventListener);
    return () => window.removeEventListener('carelo:cache-invalidate', handleInvalidate as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only set up listener once - refetch is stable

  const handleCreateCase = async (caseData: { name: string; age: number; tag: "priority" | "stable" | "school" | "family" }) => {
    try {
      const newBackendCase = await api.cases.create({
        title: `Case - ${caseData.name}`,
        client_name: caseData.name,
        client_id: caseData.age.toString(),
        description: `New case for ${caseData.name}`,
        priority: caseData.tag === 'priority' ? 'high' : 'medium',
      });

      // Invalidate cache and refetch
      invalidateCache('cases_list');
      await refetch();

      // Select the newly created case
      onSelectCase(newBackendCase.id);

      toast({
        title: "Case Created",
        description: `${caseData.name} has been successfully created`,
      });
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create case",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Search & Add */}
        {!collapsed && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 h-8 px-2.5 flex-1 bg-muted/50 rounded-md">
              <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <input 
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-8 h-8 rounded-md flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">New Case</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {collapsed && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">Search</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="w-9 h-9 rounded-md flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">New Case</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Section Label */}
        {!collapsed && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-section-label">Cases</span>
            <span className="text-xs text-muted-foreground">{cases.length}</span>
          </div>
        )}

        <CreateCaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateCase={handleCreateCase}
        />

        {/* Case List - Clean rows */}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">No cases yet</p>
              <p className="text-xs text-muted-foreground">Click + to create your first case</p>
            </div>
          ) : (
            cases.map((caseItem) => {
              const isSelected = selectedCaseId === caseItem.id;
              const primaryTag = caseItem.tags[0];
              
              if (collapsed) {
                return (
                  <Tooltip key={caseItem.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectCase(caseItem.id)}
                        className="w-full flex justify-center"
                      >
                        <div 
                          className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-150 ${isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                          style={{ 
                            border: isSelected ? "none" : "1px solid #D8D8D8"
                          }}
                        >
                          <div 
                            className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                              isSelected 
                                ? "bg-primary/10 text-primary" 
                                : "bg-muted/50 text-foreground hover:bg-muted"
                            }`}
                          >
                            {caseItem.initials}
                          </div>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium text-xs">{caseItem.name}</p>
                      <p className="text-xs opacity-70">{caseItem.lastActivity}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }
              
              return (
                <button
                  key={caseItem.id}
                  onClick={() => onSelectCase(caseItem.id)}
                  className={`w-full text-left px-2 py-2 rounded-md transition-colors ${
                    isSelected 
                      ? "bg-primary/8" 
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div 
                      className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        isSelected 
                          ? "bg-primary text-white" 
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {caseItem.initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {caseItem.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {caseItem.lastActivity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {primaryTag && (
                          <span className={`text-xs ${tagColors[primaryTag.type]}`}>
                            {primaryTag.label}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {caseItem.age}y
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};