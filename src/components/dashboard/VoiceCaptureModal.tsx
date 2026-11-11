import { useState, useRef, useEffect } from "react";
import { X, Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { invalidateCache } from "@/hooks/useCachedData";

interface VoiceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  onSelectCase?: (caseId: string) => void;
}

export const VoiceCaptureModal = ({ isOpen, onClose, caseId, onSelectCase }: VoiceCaptureModalProps) => {
  const {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    recordingTime,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Play/Pause audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle save
  const handleStartRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      await startRecording();
      console.log('✅ Recording started');
    } catch (err: any) {
      console.error('❌ Recording error:', err);
      toast({
        title: "❌ Microphone Error",
        description: err.message || "Access denied",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!audioBlob) {
      toast({
        title: "⚠️ No Recording",
        description: "Please record something first",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert blob to File
      const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      console.log('📤 Uploading voice note...', { caseId: caseId || 'auto-detect', fileSize: file.size, fileType: file.type });

      // Upload to backend (caseId can be null for auto-detection)
      const result = await api.notes.uploadAudio(caseId || null, file, 'Reports');
      
      console.log('✅ Upload successful:', result);

      // If case was auto-detected, use it
      const detectedCaseId = result.case_id || caseId;
      
      if (result.case_id && !caseId) {
        toast({
          title: "✅ Voice Note Saved!",
          description: `Automatisch zu Case zugeordnet. Audio wird verarbeitet...`,
        });
        // Trigger case selection if we have a callback
        if (onSelectCase) {
          onSelectCase(result.case_id);
        }
      } else {
        toast({
          title: "✅ Voice Note Saved!",
          description: "Audio has been uploaded and is being processed",
        });
      }

      // Trigger refresh
      // Invalidate cache and trigger refresh event
      if (detectedCaseId) {
        invalidateCache(`notes_${detectedCaseId}`);
        invalidateCache(`insights_${detectedCaseId}`); // Insights may change with new notes
        invalidateCache('cases_list'); // Refresh case list in case new case was created
      }
      window.dispatchEvent(new CustomEvent('noteCreated'));

      resetRecording();
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving audio:', error);
      const errorMessage = error?.message || error?.toString() || "Please try again";
      toast({
        title: "❌ Error Saving",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-md rounded-2xl p-4 sm:p-6 bg-card"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-primary">
            Voice Note
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F6F6F4] transition-colors"
          >
            <X className="w-5 h-5" style={{ color: "#6B6B6B" }} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: "#FEE", color: "#C00" }}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Waveform Visualization */}
        <div
          className="relative h-24 mb-6 rounded-xl flex items-center justify-center overflow-hidden bg-primary/5"
        >
          {isRecording && !isPaused ? (
            <div className="flex items-center gap-1 h-full">
              {Array.from({ length: 40 }).map((_, i) => {
                const height = Math.sin(Date.now() / 100 + i * 0.5) * 30 + 40;
                return (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all bg-primary"
                    style={{
                      height: `${height}%`,
                      animation: `wave 0.8s ease-in-out infinite`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <Mic className="w-12 h-12" style={{ color: "#D8D8D8" }} strokeWidth={1.5} />
          )}
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div
            className={`text-4xl font-mono font-semibold ${isRecording ? "text-primary" : "text-muted-foreground"}`}
          >
            {formatTime(recordingTime)}
          </div>
          {isRecording && (
            <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
              {isPaused ? "Paused" : "Recording..."}
            </div>
          )}
        </div>

        {/* Hidden Audio Element for Playback */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!audioBlob ? (
            <>
              {/* Start/Stop Recording */}
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-primary"
                  type="button"
                >
                  <Mic className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                </button>
              ) : (
                <>
                  {/* Pause/Resume */}
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{ background: "#F6F6F4", border: "1px solid #D8D8D8" }}
                  >
                    {isPaused ? (
                      <Play className="w-5 h-5 text-primary" strokeWidth={2} />
                    ) : (
                      <Pause className="w-5 h-5 text-primary" strokeWidth={2} />
                    )}
                  </button>

                  {/* Stop */}
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 bg-warning"
                  >
                    <Square className="w-6 h-6 text-warning-foreground" fill="currentColor" strokeWidth={0} />
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Playback Controls */}
              <button
                onClick={togglePlayback}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: "#F6F6F4", border: "1px solid #D8D8D8" }}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" style={{ color: "#F26A2E" }} strokeWidth={2} />
                ) : (
                  <Play className="w-5 h-5 ml-1" style={{ color: "#F26A2E" }} strokeWidth={2} />
                )}
              </button>

              {/* Delete */}
              <button
                onClick={resetRecording}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{ background: "#FEE", border: "1px solid #FCC" }}
                disabled={isSaving}
              >
                <Trash2 className="w-5 h-5" style={{ color: "#C00" }} strokeWidth={2} />
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={isSaving || !caseId}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-primary"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                )}
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: "#6B6B6B" }}>
            {!audioBlob ? (
              isRecording ? (
                "Click pause to pause, or stop to finish recording"
              ) : (
                "Click the microphone to start recording"
              )
            ) : (
              "Play to listen, delete to re-record, or save to upload"
            )}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
};
