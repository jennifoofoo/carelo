import { useState } from "react";
import { Mic, FileText, Home, Play, Pause, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface TimelineEntry {
  id: string;
  type: "voice" | "note" | "visit";
  label: string;
  content: string;
  time: string;
  duration?: string;
}

interface MobileTimelineProps {
  caseId: string | null;
}

const typeConfig = {
  voice: { icon: Mic, color: "#264636", bg: "rgba(242, 106, 46, 0.06)" },
  note: { icon: FileText, color: "#6B6B6B", bg: "rgba(107, 107, 107, 0.06)" },
  visit: { icon: Home, color: "#8B6914", bg: "rgba(139, 105, 20, 0.06)" },
  audio: { icon: Mic, color: "#264636", bg: "rgba(242, 106, 46, 0.06)" },
  text: { icon: FileText, color: "#6B6B6B", bg: "rgba(107, 107, 107, 0.06)" },
};

const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const MobileTimeline = ({ caseId }: MobileTimelineProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch real notes data
  const { data: notesData, isLoading, refetch: refetchNotes } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.notes.list(caseId);
    },
    {
      cacheKey: `notes_${caseId}`,
      ttl: 3 * 60 * 1000,
      enabled: !!caseId,
    }
  );

  const notes = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);

  // Delete note handler
  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding/collapsing
    
    if (!confirm("Diese Note löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
      return;
    }

    try {
      await api.notes.delete(noteId);
      
      toast({
        title: "✅ Note gelöscht",
        description: "Die Note wurde dauerhaft entfernt.",
      });

      // Refresh notes
      invalidateCache(`notes_${caseId}`);
      refetchNotes();
    } catch (error: any) {
      console.error("Failed to delete note:", error);
      toast({
        title: "❌ Fehler",
        description: error.message || "Löschen fehlgeschlagen. Bitte erneut versuchen.",
        variant: "destructive",
      });
    }
  };

  // Transform notes to timeline entries
  const entries: TimelineEntry[] = notes.map(note => ({
    id: note.id,
    type: note.source === 'audio' ? 'voice' : 'note',
    label: note.source === 'audio' ? 'Voice Note' : 'Written Note',
    content: note.normalized || note.raw_content || 'No content',
    time: getTimeAgo(note.created_at),
    duration: note.source === 'audio' ? '—' : undefined,
  }));

  if (!caseId) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Select a case to view timeline</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {entries.map((entry) => {
        const config = typeConfig[entry.type];
        const Icon = config.icon;
        const isExpanded = expandedId === entry.id;
        const isPlaying = playingId === entry.id;

        return (
          <article
            key={entry.id}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{ background: "#FFFFFF" }}
          >
            {/* Header - Always visible */}
            <div className="relative">
            <button
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="w-full flex items-center gap-3 p-4"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: config.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={2} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#264636" }}>
                    {entry.label}
                  </span>
                    <span className="text-xs" style={{ color: "rgba(107, 107, 107, 0.6)" }}>{entry.time}</span>
                </div>
                {!isExpanded && (
                    <p className="text-sm truncate mt-0.5" style={{ color: "rgba(107, 107, 107, 0.7)" }}>
                    {entry.content}
                  </p>
                )}
              </div>
              {isExpanded ? (
                  <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(107, 107, 107, 0.4)" }} />
              ) : (
                  <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(107, 107, 107, 0.4)" }} />
              )}
            </button>

            </div>

            {/* Delete Button - Top Right Corner (Always visible for all note types) */}
            <button
              onClick={(e) => handleDeleteNote(entry.id, e)}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-60 hover:opacity-100 active:scale-95 z-10"
              style={{ background: "rgba(107, 107, 107, 0.08)" }}
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: "#6B6B6B" }} strokeWidth={1.5} />
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 animate-fade-in">
                {/* Full content */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(38, 70, 54, 0.8)" }}>
                  {entry.content}
                </p>

                {/* Voice Player */}
                {entry.type === "voice" && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl mb-4"
                    style={{ background: "rgba(242, 106, 46, 0.03)" }}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingId(isPlaying ? null : entry.id);
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-primary"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-white" fill="white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                      )}
                    </button>
                    
                    {/* Waveform */}
                    <div className="flex-1 flex items-center gap-px h-6">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const height = Math.sin(i * 0.2) * 6 + Math.random() * 4 + 4;
                        const isActive = isPlaying && i < 10;
                        return (
                          <div 
                            key={i} 
                            className="w-1 rounded-full"
                            style={{ 
                              height: `${height}px`, 
                              background: isActive ? "hsl(var(--primary))" : "rgba(242, 106, 46, 0.15)"
                            }} 
                          />
                        );
                      })}
                    </div>
                    
                    <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(107, 107, 107, 0.6)" }}>
                      {entry.duration}
                    </span>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
