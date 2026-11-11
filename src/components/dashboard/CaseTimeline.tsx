import { Paperclip, Play, Pause, Mic, FileText, Home, ClipboardList, Calendar, Sparkles, Upload, Highlighter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AIActionbar } from "./AIActionbar";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface TimelineEntry {
  id: string;
  type: "voice" | "note" | "visit" | "plan" | "task" | "document";
  label: string;
  content: string;
  time: string;
  date: "today" | "yesterday" | "lastWeek";
  duration?: string;
  hasAttachment?: boolean;
  isAiGenerated?: boolean;
  fileName?: string;
}

const typeConfig = {
  voice: { icon: Mic, color: "#264636", bg: "rgba(242, 106, 46, 0.06)" },
  note: { icon: FileText, color: "#6B6B6B", bg: "rgba(107, 107, 107, 0.06)" },
  visit: { icon: Home, color: "#8B6914", bg: "rgba(139, 105, 20, 0.06)" },
  plan: { icon: ClipboardList, color: "#264636", bg: "rgba(242, 106, 46, 0.06)" },
  task: { icon: Calendar, color: "#4A5D8F", bg: "rgba(74, 93, 143, 0.06)" },
  document: { icon: Upload, color: "#6B6B6B", bg: "rgba(107, 107, 107, 0.06)" },
};

const dateLabels = {
  today: "Today",
  yesterday: "Yesterday", 
  lastWeek: "Last Week"
};

interface CaseTimelineProps { 
  caseId: string;
  focusMode?: boolean;
}

export const CaseTimeline = ({ caseId, focusMode = false }: CaseTimelineProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<{ text: string; noteId: string; startIndex: number; endIndex: number } | null>(null);
  const [audioDurations, setAudioDurations] = useState<Map<string, string>>(new Map());
  const contentRefs = useRef<Map<string, HTMLParagraphElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Use cached data for notes
  const { data: notesData, isLoading: isLoadingNotes, refetch: refetchNotes } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.notes.list(caseId);
    },
    {
      cacheKey: `notes_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes
      enabled: !!caseId,
    }
  );

  // Ensure notes is always an array
  const notes = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);

  // Use cached data for highlights
  const { data: highlightsList, refetch: refetchHighlights } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.highlights.list(caseId);
    },
    {
      cacheKey: `highlights_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes
      enabled: !!caseId,
    }
  );

  // Transform highlights list to Map - ensure it's always an array
  const highlights = new Map<string, any[]>();
  const safeHighlightsList = Array.isArray(highlightsList) ? highlightsList : (highlightsList ? [highlightsList] : []);
  safeHighlightsList.forEach((h: any) => {
    if (h && h.note_id) {
      if (!highlights.has(h.note_id)) {
        highlights.set(h.note_id, []);
      }
      highlights.get(h.note_id)!.push(h);
    }
  });

  // Handle text selection
  const handleTextSelection = (noteId: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const selectedText = selection.toString().trim();
    if (selectedText.length < 10) {
      // Too short, ignore
      return;
    }

    const range = selection.getRangeAt(0);
    const contentElement = contentRefs.current.get(noteId);
    if (!contentElement) return;

    // Calculate start and end indices relative to the content
    const contentText = contentElement.textContent || '';
    const startIndex = contentText.indexOf(selectedText);
    const endIndex = startIndex + selectedText.length;

    if (startIndex >= 0) {
      setSelectedText({
        text: selectedText,
        noteId,
        startIndex,
        endIndex,
      });
    }
  };

  // Create highlight
  const handleCreateHighlight = async (category: 'general' = 'general') => {
    if (!selectedText || !caseId) return;

    try {
      await api.highlights.create(
        selectedText.noteId,
        caseId,
        selectedText.text,
        selectedText.startIndex,
        selectedText.endIndex,
        category
      );

      toast({
        title: "✅ Highlight created",
        description: "This sentence will be included in help plans and reports",
      });

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelectedText(null);
      
      // Invalidate cache and refetch
      invalidateCache(`highlights_${caseId}`);
      await refetchHighlights();
    } catch (error: any) {
      console.error('Error creating highlight:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create highlight",
        variant: "destructive",
      });
    }
  };

  // Audio playback handlers
  const handleAudioLoadedMetadata = (noteId: string, audio: HTMLAudioElement) => {
    const duration = audio.duration;
    
    // Check if duration is valid (not NaN or Infinity)
    if (!isFinite(duration) || duration <= 0) {
      setAudioDurations(prev => new Map(prev).set(noteId, '—'));
      return;
    }
    
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    setAudioDurations(prev => new Map(prev).set(noteId, formatted));
  };

  const handlePlayAudio = (noteId: string) => {
    const audio = audioRefs.current.get(noteId);
    if (!audio) return;

    // Pause any other playing audio
    if (playingId && playingId !== noteId) {
      const otherAudio = audioRefs.current.get(playingId);
      if (otherAudio) {
        otherAudio.pause();
      }
    }

    if (playingId === noteId) {
      // Toggle: pause current audio
      audio.pause();
      setPlayingId(null);
    } else {
      // Play audio
      audio.play().catch((error) => {
        console.error('Audio playback failed:', error);
        toast({
          title: "❌ Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      });
      setPlayingId(noteId);
    }
  };

  const handleAudioEnded = (noteId: string) => {
    setPlayingId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note? This action cannot be undone.")) {
      return;
    }

    try {
      await api.notes.delete(noteId);
      
      toast({
        title: "✅ Note deleted",
        description: "The note has been permanently deleted.",
      });

      // Refresh notes
      invalidateCache(`notes_${caseId}`);
      refetchNotes();
    } catch (error: any) {
      console.error("Failed to delete note:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Listen for note creation events
  useEffect(() => {
    const handleNoteCreated = () => {
      if (caseId) {
        invalidateCache(`notes_${caseId}`);
        refetchNotes();
      }
    };

    window.addEventListener('noteCreated', handleNoteCreated);
    return () => window.removeEventListener('noteCreated', handleNoteCreated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]); // Only depend on caseId - refetchNotes is stable

  // Poll for processing notes (audio transcriptions, etc.)
  useEffect(() => {
    if (!caseId || !notes || notes.length === 0) return;

    // Find notes that are still processing
    const processingNoteIds = notes
      .filter(
        (note: any) => 
          note.processing_status === 'processing' || 
          note.processing_status === 'pending' ||
          (note.source === 'audio' && (!note.normalized || note.normalized === ''))
      )
      .map((note: any) => note.id);

    if (processingNoteIds.length === 0) return;

    // Poll every 2 seconds for processing notes
    const pollInterval = setInterval(async () => {
      let hasUpdates = false;
      
      for (const noteId of processingNoteIds) {
        try {
          const status = await api.notes.getStatus(noteId);
          
          // If status changed to ready or failed, reload notes
          if (status.status === 'ready' || status.status === 'failed') {
            hasUpdates = true;
            break; // Only need one update to trigger reload
          }
        } catch (error) {
          console.error(`Error checking status for note ${noteId}:`, error);
        }
      }

      if (hasUpdates) {
        invalidateCache(`notes_${caseId}`);
        refetchNotes();
      }
    }, 2000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, notes?.length || 0]); // Only depend on length to avoid infinite loops


  // Helper functions
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    // Format time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getDayCategory = (dateString: string): 'today' | 'yesterday' | 'lastWeek' => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    return 'lastWeek';
  };

  const getTypeForSource = (source: string): TimelineEntry['type'] => {
    switch (source) {
      case 'audio': return 'voice';
      case 'pdf': return 'document';
      case 'image': return 'document';
      default: return 'note';
    }
  };

  const getLabelForSource = (source: string) => {
    switch (source) {
      case 'audio': return 'Voice Note';
      case 'pdf': return 'PDF Document';
      case 'image': return 'Image Upload';
      default: return 'Written Note';
    }
  };

  // Transform backend notes to timeline format
  const timelineData: TimelineEntry[] = notes.map(note => {
    // Show appropriate content based on processing status
    let content = 'Processing...';
    if (note.processing_status === 'ready' || note.processing_status === 'completed') {
      content = note.normalized || note.raw_content || '';
    } else if (note.processing_status === 'failed') {
      content = 'Transcription failed. Please try again.';
    } else if (note.normalized) {
      content = note.normalized;
    } else if (note.raw_content && note.source !== 'audio') {
      content = note.raw_content;
    }

    return {
    id: note.id,
    type: getTypeForSource(note.source),
    label: getLabelForSource(note.source),
      content: content,
    time: getTimeAgo(note.created_at),
    date: getDayCategory(note.created_at),
    duration: note.source === 'audio' ? (audioDurations.get(note.id) || '—') : undefined,
    };
  });

  const groupedEntries = timelineData.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  const dateOrder: ("today" | "yesterday" | "lastWeek")[] = ["today", "yesterday", "lastWeek"];

  if (isLoadingNotes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm" style={{ color: "#9B9B9B" }}>Loading notes...</div>
      </div>
    );
  }

  if (timelineData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <FileText className="w-12 h-12 mb-3" style={{ color: "#D8D8D8" }} strokeWidth={1.5} />
        <p className="text-sm font-medium mb-1" style={{ color: "#264636" }}>No notes yet</p>
        <p className="text-xs" style={{ color: "#9B9B9B" }}>Click "New Note" to create your first note</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {dateOrder.map((dateKey) => {
        const entries = groupedEntries[dateKey];
        if (!entries) return null;

        return (
          <div key={dateKey}>
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(107, 107, 107, 0.6)" }}>
                {dateLabels[dateKey]}
              </h3>
              <div className="flex-1 h-px" style={{ background: "rgba(242, 106, 46, 0.06)" }} />
            </div>

            {/* Entries */}
            <div className="space-y-4">
              {entries.map((entry) => {
                const config = typeConfig[entry.type];
                const Icon = config.icon;
                const isPlaying = playingId === entry.id;
                
                return (
                  <article
                    key={entry.id}
                    className="group relative p-5 transition-all duration-200 rounded-2xl hover:shadow-sm"
                    style={{ 
                      background: "#FFFFFF",
                    }}
                  >
                    {/* Delete Button - Top Right */}
                    <button
                      onClick={() => handleDeleteNote(entry.id)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-30 hover:opacity-100 hover:bg-red-50 z-10"
                      title="Delete note"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: config.bg }}
                        >
                          <Icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={2} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: "#264636" }}>
                              {entry.label}
                            </span>
                            {entry.isAiGenerated && (
                              <span 
                                className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full"
                                style={{ background: "rgba(242, 106, 46, 0.08)", color: "#264636" }}
                              >
                                <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                                AI Generated
                              </span>
                            )}
                          </div>
                          <span className="text-xs" style={{ color: "rgba(107, 107, 107, 0.6)" }}>{entry.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content with Highlight Support */}
                    <div className="relative">
                      <p 
                        ref={(el) => {
                          if (el) contentRefs.current.set(entry.id, el);
                        }}
                        className="text-sm leading-relaxed select-text cursor-text" 
                        style={{ color: "rgba(38, 70, 54, 0.8)" }}
                        onMouseUp={() => handleTextSelection(entry.id)}
                      >
                        {(() => {
                          const noteHighlights = highlights.get(entry.id) || [];
                          if (noteHighlights.length === 0) {
                            return entry.content;
                          }

                          // Render content with highlights
                          const content = entry.content;
                          const parts: Array<{ text: string; isHighlight: boolean }> = [];
                          let lastIndex = 0;

                          // Sort highlights by start_index
                          const sortedHighlights = [...noteHighlights].sort((a, b) => 
                            (a.start_index || 0) - (b.start_index || 0)
                          );

                          sortedHighlights.forEach((highlight) => {
                            const start = highlight.start_index || 0;
                            const end = highlight.end_index || start + highlight.text.length;

                            // Add text before highlight
                            if (start > lastIndex) {
                              parts.push({
                                text: content.substring(lastIndex, start),
                                isHighlight: false,
                              });
                            }

                            // Add highlighted text
                            parts.push({
                              text: content.substring(start, end),
                              isHighlight: true,
                            });

                            lastIndex = end;
                          });

                          // Add remaining text
                          if (lastIndex < content.length) {
                            parts.push({
                              text: content.substring(lastIndex),
                              isHighlight: false,
                            });
                          }

                          return parts.map((part, i) => (
                            <span
                              key={i}
                              className={part.isHighlight ? "bg-yellow-200/60 px-0.5 rounded" : ""}
                              style={part.isHighlight ? { backgroundColor: "rgba(255, 235, 59, 0.3)" } : {}}
                            >
                              {part.text}
                            </span>
                          ));
                        })()}
                      </p>

                      {/* Highlight Action Popup */}
                      {selectedText && selectedText.noteId === entry.id && (
                        <div 
                          className="absolute z-10 mt-2 p-2 rounded-lg shadow-lg flex items-center gap-2"
                          style={{ 
                            background: "#FFFFFF",
                            border: "1px solid #D8D8D8",
                            top: "100%",
                            left: 0,
                          }}
                        >
                          <button
                            onClick={() => handleCreateHighlight('general')}
                            className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-primary/10 flex items-center gap-1.5"
                            style={{ 
                              background: "rgba(242, 106, 46, 0.08)",
                              color: "#264636"
                            }}
                          >
                            <Highlighter className="w-3 h-3" strokeWidth={2} />
                            Add to Highlights
                          </button>
                          <button
                            onClick={() => setSelectedText(null)}
                            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Voice Player */}
                    {entry.type === "voice" && (
                      <div className="mt-4 space-y-2">
                        {/* Hidden Audio Element */}
                        <audio
                          ref={(el) => {
                            if (el) audioRefs.current.set(entry.id, el);
                          }}
                          src={api.notes.getAudioUrl(entry.id)}
                          onLoadedMetadata={(e) => handleAudioLoadedMetadata(entry.id, e.currentTarget)}
                          onEnded={() => handleAudioEnded(entry.id)}
                          onPlay={() => setPlayingId(entry.id)}
                          onPause={() => setPlayingId(null)}
                          className="hidden"
                        />
                        
                        <div 
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: "rgba(242, 106, 46, 0.03)" }}
                      >
                        <button 
                            onClick={() => handlePlayAudio(entry.id)}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: "#F26A2E" }}
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-white" fill="white" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                          )}
                        </button>
                        
                        {/* Waveform */}
                        <div className="flex-1 flex items-center gap-px h-6">
                          {Array.from({ length: 50 }).map((_, i) => {
                            const height = Math.sin(i * 0.2) * 8 + Math.random() * 6 + 6;
                            const isActive = isPlaying && i < 15;
                            return (
                              <div 
                                key={i} 
                                className="w-1 rounded-full transition-colors"
                                style={{ 
                                  height: `${height}px`, 
                                    background: isActive ? "#F26A2E" : "rgba(242, 106, 46, 0.15)"
                                }} 
                              />
                            );
                          })}
                        </div>
                        
                          <span className="text-xs font-medium tabular-nums" style={{ color: "rgba(107, 107, 107, 0.6)" }}>
                          {entry.duration}
                        </span>
                        </div>
                      </div>
                    )}

                    {/* Document Preview */}
                    {entry.type === "document" && entry.fileName && (
                      <div 
                        className="flex items-center gap-3 p-3 mt-4 rounded-xl cursor-pointer transition-colors hover:bg-[rgba(38,70,54,0.05)]"
                        style={{ background: "rgba(242, 106, 46, 0.03)" }}
                      >
                        <div 
                          className="w-10 h-12 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(242, 106, 46, 0.08)" }}
                        >
                          <FileText className="w-5 h-5" style={{ color: "#264636" }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: "#264636" }}>{entry.fileName}</p>
                          <p className="text-xs" style={{ color: "rgba(107, 107, 107, 0.6)" }}>PDF • Click to preview</p>
                        </div>
                      </div>
                    )}

                    {/* Attachment */}
                    {entry.hasAttachment && entry.type !== "document" && (
                      <button 
                        className="flex items-center gap-2 px-3 py-1.5 mt-4 rounded-full transition-colors hover:bg-[rgba(38,70,54,0.05)]"
                        style={{ background: "rgba(242, 106, 46, 0.03)" }}
                      >
                        <Paperclip className="w-3.5 h-3.5" style={{ color: "rgba(107, 107, 107, 0.5)" }} strokeWidth={2} />
                        <span className="text-xs font-medium" style={{ color: "rgba(107, 107, 107, 0.7)" }}>1 attachment</span>
                      </button>
                    )}

                    {/* AI Actionbar */}
                    <AIActionbar 
                      contentType={entry.type === "document" ? "document" : entry.type} 
                      contentId={entry.id}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
