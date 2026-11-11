import { useState, useEffect } from "react";
import { CaseListPanel } from "@/components/dashboard/CaseListPanel";
import { CaseTimeline } from "@/components/dashboard/CaseTimeline";
import { UniversalDrawer } from "@/components/dashboard/UniversalDrawer";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { AIInsightPanel } from "@/components/dashboard/AIInsightPanel";
import { AIOverviewTab } from "@/components/dashboard/AIOverviewTab";
import HelpPlanTab from "@/components/dashboard/HelpPlanTab";
import { TasksTab } from "@/components/dashboard/TasksTab";
import { ReportsTab } from "@/components/dashboard/ReportsTab";
import { OnboardingFlow } from "@/components/dashboard/OnboardingFlow";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { VoiceCaptureModal } from "@/components/dashboard/VoiceCaptureModal";
import { MobileTimeline } from "@/components/dashboard/MobileTimeline";
import { MobileAIInsights } from "@/components/dashboard/MobileAIInsights";
import { MobileFilesList } from "@/components/dashboard/MobileFilesList";
import { MobileCaseList } from "@/components/dashboard/MobileCaseList";
import { useIsMobile } from "@/hooks/use-mobile";
import api from "@/lib/api";
import { useCachedData } from "@/hooks/useCachedData";
import { 
  ChevronLeft, ChevronRight, Home, Bell, 
  Mic, Upload, PenLine, Clock, Folder, Sparkles,
  Plus, ArrowLeft, Focus, FileText, ListChecks
} from "lucide-react";

type DrawerType = "note" | "voice" | "upload" | "help-plan" | "reports" | "risk" | "tasks" | null;
type ViewTab = "timeline" | "documents" | "ai-overview" | "help-plan" | "tasks" | "reports" | "ai-tools";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [drawerType, setDrawerType] = useState<DrawerType>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("timeline");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [caseListOpen, setCaseListOpen] = useState(false);

  // TEMPORARY: Clear cache on mount to fix duplicates (FORCE CLEAR)
  useEffect(() => {
    const cacheVersion = localStorage.getItem("carelo-cache-version");
    const CURRENT_VERSION = "v2"; // Increment to force cache clear
    
    if (cacheVersion !== CURRENT_VERSION) {
      console.log('🧹 Clearing Carelo cache (version mismatch)...');
      Object.keys(localStorage).filter(k => k.startsWith('carelo_cache_')).forEach(k => {
        localStorage.removeItem(k);
        console.log('Removed cache:', k);
      });
      localStorage.setItem("carelo-cache-version", CURRENT_VERSION);
      sessionStorage.removeItem("carelo-cache-cleared"); // Also clear this
      console.log('✅ Cache cleared! Reloading...');
      window.location.reload();
    }
  }, []);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("carelo-onboarding-complete");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("carelo-onboarding-complete", "true");
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem("carelo-onboarding-complete", "true");
    setShowOnboarding(false);
  };

  const openDrawer = (type: DrawerType) => {
    setDrawerType(type);
  };

  // Load selected case data with caching
  const { data: selectedCaseData, error: selectedCaseError } = useCachedData(
    async () => {
      if (!selectedCaseId) return null;
      try {
        return await api.cases.get(selectedCaseId);
      } catch (error: any) {
        // If case not found (404), clear selection
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          console.warn('⚠️ Selected case not found, clearing selection');
          setSelectedCaseId("");
          return null;
        }
        throw error;
      }
    },
    {
      cacheKey: `case_${selectedCaseId}`,
      ttl: 5 * 60 * 1000, // 5 minutes
      enabled: !!selectedCaseId,
    }
  );

  const selectedCase = selectedCaseData || null;

  // Helper function to format time ago
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-md h-14 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-sm">
            {/* Back button - goes to AI hub if on tool page, otherwise home */}
            {(activeTab === "help-plan" || activeTab === "reports" || activeTab === "tasks") ? (
              <button 
                onClick={() => setActiveTab("ai-overview")}
                className="p-xs -ml-xs rounded-xl text-primary"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </button>
            ) : (
              <a href="/" className="p-xs -ml-xs rounded-xl text-primary">
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              </a>
            )}
            <div>
              <h1 className="text-base font-semibold text-primary">
                {selectedCase?.client_name || selectedCase?.title || "No case selected"}
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {selectedCase?.client_id ? `Case #${selectedCase.client_id}` : selectedCase?.id ? `Case ${selectedCase.id.substring(0, 8)}` : "No case"}
              </p>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="pt-14 px-md">
          <div className="py-md">
            {activeTab === "timeline" && <MobileTimeline caseId={selectedCaseId} />}
            {activeTab === "documents" && <MobileFilesList caseId={selectedCaseId} />}
            {activeTab === "help-plan" && <HelpPlanTab caseId={selectedCaseId} />}
            {activeTab === "reports" && <ReportsTab caseId={selectedCaseId} />}
            {activeTab === "tasks" && <TasksTab caseId={selectedCaseId} />}
            {(activeTab === "ai-tools" || activeTab === "ai-overview") && (
              <MobileAIInsights 
                caseId={selectedCaseId}
                onNavigateToHelpPlan={() => setActiveTab("help-plan")}
                onNavigateToReports={() => setActiveTab("reports")}
                onNavigateToTasks={() => setActiveTab("tasks")}
              />
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          activeTab={activeTab === "ai-overview" || activeTab === "help-plan" || activeTab === "tasks" || activeTab === "reports" ? "ai-tools" : activeTab as "timeline" | "documents" | "ai-tools" | "caseload"}
          onTabChange={(tab) => {
            if (tab === "caseload") {
              setCaseListOpen(true);
            } else if (tab === "ai-tools") {
              setActiveTab("ai-overview");
            } else if (tab === "timeline") {
              setActiveTab("timeline");
            } else if (tab === "documents") {
              setActiveTab("documents");
            }
          }}
          onVoiceCapture={() => setVoiceModalOpen(true)}
        />

        {/* Mobile Case List Modal */}
        <MobileCaseList
          isOpen={caseListOpen}
          onClose={() => setCaseListOpen(false)}
          onSelectCase={(caseId) => {
            setSelectedCaseId(caseId);
            setCaseListOpen(false);
            setActiveTab("timeline");
          }}
          selectedCaseId={selectedCaseId}
          onCreateCase={() => {
            setCaseListOpen(false);
            // TODO: Open create case modal
            alert("Create Case feature coming soon!");
          }}
        />

        {/* Voice Capture Modal */}
        <VoiceCaptureModal 
          isOpen={voiceModalOpen} 
          onClose={() => setVoiceModalOpen(false)}
          caseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
        />

        {/* Onboarding */}
        {showOnboarding && (
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Sidebar - 240px, calm neutral */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 flex flex-col transition-all duration-200 ease-out z-20 bg-card border-r border-border ${
          leftCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center flex-shrink-0">
          <a 
            href="/" 
            className={`flex items-center gap-2 font-medium text-sm hover:opacity-80 transition-opacity ${
              leftCollapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-primary rounded-md">
              C
            </div>
            {!leftCollapsed && <span className="text-foreground">Carelo</span>}
          </a>
        </div>
        
        {/* Collapse toggle - positioned below the search/add row */}
        <button 
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="absolute -right-3 top-28 w-6 h-6 rounded-full flex items-center justify-center transition-colors z-30 bg-card border border-border hover:bg-muted"
        >
          {leftCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} /> : <ChevronLeft className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />}
        </button>

        <div className="flex-1 overflow-hidden px-2 pb-4">
          <CaseListPanel 
            selectedCaseId={selectedCaseId} 
            onSelectCase={setSelectedCaseId}
            collapsed={leftCollapsed}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className="flex-1 flex flex-col transition-all duration-200 ease-out"
        style={{ 
          marginLeft: leftCollapsed ? "64px" : "240px",
          marginRight: rightCollapsed ? "48px" : "300px"
        }}
      >
        {/* Header - Clean, minimal */}
        <header className="sticky top-0 h-14 flex items-center justify-between px-6 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3">
            <a href="/" className="p-1.5 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
              <Home className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <div>
              <h1 className="text-[15px] font-medium text-foreground">
                {selectedCase?.client_name || selectedCase?.title || "No case selected"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedCase?.client_id ? `Case #${selectedCase.client_id}` : selectedCase?.id ? `Case ${selectedCase.id.substring(0, 8)}` : "No case"}
                {selectedCase?.updated_at && ` · ${getTimeAgo(selectedCase.updated_at)}`}
              </p>
            </div>
              </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setVoiceModalOpen(true);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Voice Note"
              type="button"
            >
              <Mic className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => openDrawer("note")}
              className="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>New Note</span>
            </button>
            <button
              onClick={() => openDrawer("upload")}
              className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Upload"
            >
              <Upload className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <div className="w-px h-5 mx-1.5 bg-border" />

            <button className="h-8 w-8 flex items-center justify-center rounded-md transition-colors hover:bg-muted text-muted-foreground">
              <Bell className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Tab Navigation - Clean, minimal */}
        <div className="px-6 pt-4">
          <nav className="flex items-center gap-1 border-b border-border">
            {[
              { id: "timeline" as const, label: "Notes", icon: Clock },
              { id: "documents" as const, label: "Documents", icon: Folder },
              { id: "tasks" as const, label: "Tasks", icon: ListChecks },
              { id: "help-plan" as const, label: "Help Plan", icon: FileText },
              { id: "reports" as const, label: "Reports", icon: FileText },
              { id: "ai-overview" as const, label: "AI Overview", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors relative ${
                  activeTab === tab.id 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-6 py-4">
          {activeTab === "timeline" && (
            <CaseTimeline caseId={selectedCaseId} />
          )}
          {activeTab === "documents" && (
            <div className="p-4 rounded-lg bg-card border border-border">
              <DocumentsSection caseId={selectedCaseId} />
            </div>
          )}
          {activeTab === "tasks" && (
            <TasksTab caseId={selectedCaseId} />
          )}
          {activeTab === "help-plan" && (
            <HelpPlanTab caseId={selectedCaseId} />
          )}
          {activeTab === "reports" && (
            <ReportsTab caseId={selectedCaseId} />
          )}
          {activeTab === "ai-overview" && (
            <AIOverviewTab caseId={selectedCaseId} />
          )}
        </div>
      </div>

      {/* Right Sidebar - AI Insight Panel */}
      <AIInsightPanel 
        collapsed={rightCollapsed} 
        onToggle={() => setRightCollapsed(!rightCollapsed)} 
        caseId={selectedCaseId}
        onNavigateToTasks={() => setActiveTab("tasks")}
        onNavigateToOverview={() => setActiveTab("ai-overview")}
      />

      {/* Universal Action Drawer */}
      <UniversalDrawer 
        type={drawerType} 
        onClose={() => setDrawerType(null)} 
        caseId={selectedCaseId}
        onSelectCase={setSelectedCaseId}
        onOpenVoiceModal={() => {
          setDrawerType(null);
          setVoiceModalOpen(true);
        }}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => openDrawer("note")}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105 z-30 bg-primary shadow-lg"
        style={{ marginRight: rightCollapsed ? "0" : "252px" }}
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={1.5} />
      </button>

      {/* Voice Capture Modal */}
      <VoiceCaptureModal 
        isOpen={voiceModalOpen} 
        onClose={() => setVoiceModalOpen(false)}
        caseId={selectedCaseId}
        onSelectCase={setSelectedCaseId}
      />

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
};

export default Dashboard;