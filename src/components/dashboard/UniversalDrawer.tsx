import { X, FileText, BarChart3, AlertTriangle, ListChecks, Mic, PenLine, Upload, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { invalidateCache } from "@/hooks/useCachedData";

type DrawerType = "note" | "voice" | "upload" | "help-plan" | "reports" | "risk" | "tasks" | null;

interface UniversalDrawerProps {
  type: DrawerType;
  onClose: () => void;
  caseId?: string;
  onOpenVoiceModal?: () => void;
  onSelectCase?: (caseId: string) => void;
}

const drawerConfig = {
  note: { title: "Add Note", icon: PenLine, description: "Write a case note or observation" },
  voice: { title: "Voice Note", icon: Mic, description: "Record a voice memo" },
  upload: { title: "Upload Files", icon: Upload, description: "Add documents, photos, or reports" },
  "help-plan": { title: "Help Plan", icon: FileText, description: "Generate or edit care plans" },
  reports: { title: "Reports", icon: BarChart3, description: "Generate weekly summaries" },
  risk: { title: "Risk Analysis", icon: AlertTriangle, description: "Review detected patterns" },
  tasks: { title: "Tasks", icon: ListChecks, description: "Extract and manage actions" },
};

export const UniversalDrawer = ({ type, onClose, caseId, onOpenVoiceModal, onSelectCase }: UniversalDrawerProps) => {
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("General Observation");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState("Reports");

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast({
        title: "⚠️ Leere Notiz",
        description: "Bitte schreibe etwas in die Notiz",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fullContent = `[${noteType}]\n\n${noteContent}`;
      const result = await api.notes.createText(caseId || null, fullContent);
      
      // If case was auto-detected, use it
      const detectedCaseId = result.case_id || caseId;
      
      if (result.case_id && !caseId) {
        toast({
          title: "✅ Note gespeichert!",
          description: `Automatisch zu Case zugeordnet: ${result.case_id.substring(0, 8)}...`,
        });
        // Trigger case selection if we have a callback
        if (onSelectCase) {
          onSelectCase(result.case_id);
        }
      } else {
        toast({
          title: "✅ Note gespeichert!",
          description: `Note ID: ${result.note_id}`,
        });
      }

      // Clear form and close
      setNoteContent("");
      setNoteType("General Observation");
      
      // Invalidate cache and trigger refresh event
      if (detectedCaseId) {
        invalidateCache(`notes_${detectedCaseId}`);
        invalidateCache(`insights_${detectedCaseId}`); // Insights may change with new notes
        invalidateCache('cases_list'); // Refresh case list in case new case was created
      }
      window.dispatchEvent(new CustomEvent('noteCreated'));
      
      onClose();

    } catch (error: any) {
      toast({
        title: "❌ Error Saving",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!caseId) {
      toast({
        title: "⚠️ No Case Selected",
        description: "Bitte wähle erst einen Case aus",
        variant: "destructive",
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "⚠️ No Files",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;
    const uploadedFileNames: string[] = [];

    for (const file of uploadedFiles) {
      try {
        const fileType = file.type;
        let result;

        if (fileType === "application/pdf") {
          result = await api.notes.uploadPDF(caseId, file, uploadCategory);
          toast({
            title: "✅ PDF Uploaded!",
            description: `${file.name} → ${uploadCategory}`,
          });
        } else if (fileType.startsWith("image/")) {
          result = await api.notes.uploadImage(caseId, file, uploadCategory);
          toast({
            title: "✅ Image Uploaded!",
            description: `${file.name} → ${uploadCategory}`,
          });
        } else if (fileType.startsWith("audio/")) {
          result = await api.notes.uploadAudio(caseId, file, uploadCategory);
          toast({
            title: "✅ Audio Uploaded!",
            description: `${file.name} → ${uploadCategory}`,
          });
        } else if (fileType === "text/plain" || file.name.toLowerCase().endsWith('.txt')) {
          result = await api.notes.uploadTextFile(caseId, file, uploadCategory);
          toast({
            title: "✅ Text File Uploaded!",
            description: `${file.name} → ${uploadCategory}`,
          });
        } else {
          errorCount++;
          toast({
            title: "⚠️ File Type Not Supported",
            description: `${file.name}: ${fileType || 'Unbekannt'}`,
            variant: "destructive",
          });
          continue;
        }

        successCount++;
        uploadedFileNames.push(file.name);
        console.log(`Uploaded ${file.name}:`, result);

      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        toast({
          title: "❌ Upload fehlgeschlagen",
          description: `${file.name}: ${error.message}`,
          variant: "destructive",
        });
        errorCount++;
      }
    }

    setIsSaving(false);

    if (successCount > 0) {
      // Show final summary
      toast({
        title: "🎉 Upload abgeschlossen!",
        description: `${successCount} file(s) uploaded successfully`,
      });
      
      // Trigger timeline refresh
      window.dispatchEvent(new CustomEvent('noteCreated'));
      
      // Clear and close
      setUploadedFiles([]);
      onClose();
    } else if (errorCount > 0) {
      toast({
        title: "❌ Alle Uploads fehlgeschlagen",
        description: "Bitte versuche es erneut",
        variant: "destructive",
      });
    }
  };

  if (!type) return null;

  const config = drawerConfig[type];
  const Icon = config.icon;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ background: "rgba(242, 106, 46, 0.1)" }}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <aside 
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col animate-slide-in-right"
        style={{ 
          width: "min(450px, 100vw - 48px)",
          background: "#FFFFFF",
          borderLeft: "1px solid #D8D8D8",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.08)"
        }}
      >
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between flex-shrink-0 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
              <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{config.title}</h2>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-secondary text-muted-foreground"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {type === "note" && <NoteContent noteContent={noteContent} setNoteContent={setNoteContent} noteType={noteType} setNoteType={setNoteType} />}
          {type === "voice" && <VoiceContent onOpenModal={onOpenVoiceModal} />}
          {type === "upload" && (
            <UploadContent 
              uploadedFiles={uploadedFiles} 
              setUploadedFiles={setUploadedFiles} 
              uploadCategory={uploadCategory} 
              setUploadCategory={setUploadCategory} 
            />
          )}
          {type === "help-plan" && <HelpPlanContent />}
          {type === "reports" && <ReportsContent />}
          {type === "risk" && <RiskContent />}
          {type === "tasks" && <TasksContent />}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-end gap-2 flex-shrink-0 border-t border-border">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium rounded-xl transition-colors hover:bg-secondary text-muted-foreground border border-border"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={
              type === "note" ? handleSaveNote : 
              type === "upload" ? handleFileUpload : 
              undefined
            }
            disabled={
              isSaving || 
              (type === "note" && !noteContent.trim()) ||
              (type === "upload" && uploadedFiles.length === 0)
            }
            className="h-9 px-4 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white"
          >
            {isSaving ? "Speichert..." : type === "upload" ? "Upload" : "Save"}
          </button>
        </div>
      </aside>
    </>
  );
};

// Content components for each drawer type
interface NoteContentProps {
  noteContent: string;
  setNoteContent: (content: string) => void;
  noteType: string;
  setNoteType: (type: string) => void;
}

const NoteContent = ({ noteContent, setNoteContent, noteType, setNoteType }: NoteContentProps) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium mb-2 text-muted-foreground">Note Type</label>
      <select 
        value={noteType}
        onChange={(e) => setNoteType(e.target.value)}
        className="w-full h-9 px-3 text-sm rounded-xl outline-none bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <option>General Observation</option>
        <option>Home Visit</option>
        <option>Phone Call</option>
        <option>Meeting Notes</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium mb-2 text-muted-foreground">Content</label>
      <textarea 
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Write your note here..."
        className="w-full h-48 p-3 text-sm rounded-xl outline-none resize-none bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
    <div className="flex items-center gap-2">
      <input type="checkbox" id="flag" className="rounded" />
      <label htmlFor="flag" className="text-sm text-muted-foreground">Flag for follow-up</label>
    </div>
  </div>
);

interface VoiceContentProps {
  onOpenModal?: () => void;
}

const VoiceContent = ({ onOpenModal }: VoiceContentProps) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-6">
    <button
      onClick={onOpenModal}
      className="w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 bg-primary"
    >
      <Mic className="w-8 h-8 text-white" strokeWidth={2} />
    </button>
    <p className="text-sm text-center text-muted-foreground">
      Click to start recording
    </p>
    <div className="w-full p-4 rounded-xl bg-secondary border border-border">
      <p className="text-xs mb-2 text-muted-foreground">Recording will be transcribed automatically</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="w-1 rounded-sm bg-border"
            style={{ height: `${Math.random() * 16 + 4}px` }}
          />
        ))}
      </div>
    </div>
  </div>
);

interface UploadContentProps {
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  uploadCategory: string;
  setUploadCategory: (category: string) => void;
}

const UploadContent = ({ uploadedFiles, setUploadedFiles, uploadCategory, setUploadCategory }: UploadContentProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      console.log('✅ Adding files:', newFiles.map(f => f.name));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    console.log('📦 Files dropped:', e.dataTransfer.files);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      console.log('✅ Adding dropped files:', newFiles.map(f => f.name));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleClick = (e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Click detected, triggering file input...');
      if (fileInputRef.current) {
        console.log('✅ File input found, clicking...');
        fileInputRef.current.click();
      } else {
        console.error('❌ File input not found!');
        // Fallback: try to find by ID
        const fallbackInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fallbackInput) {
          console.log('✅ Found file input via fallback, clicking...');
          fallbackInput.click();
        }
      }
    } catch (error) {
      console.error('❌ Error in handleClick:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{ 
          borderColor: isDragging ? "hsl(16 100% 60%)" : "hsl(40 4% 16% / 0.2)",
          background: isDragging ? "hsl(16 100% 60% / 0.1)" : "transparent"
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm font-medium mb-1 text-foreground">
          {isDragging ? "Drop files here" : "Drop files here or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground">PDF, TXT, images, audio up to 25MB</p>
      </div>
      
      <input
        ref={fileInputRef}
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.txt,.text,.png,.jpg,.jpeg,.gif,.webp,.mp3,.wav,.m4a"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Selected Files ({uploadedFiles.length})
          </label>
          {uploadedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-xs px-2 py-1 rounded hover:bg-destructive/10 text-destructive"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-2 text-muted-foreground">Category</label>
        <select 
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value)}
          className="w-full h-9 px-3 text-sm rounded-xl outline-none bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option>Reports</option>
          <option>Forms & Permissions</option>
          <option>Medical Docs</option>
          <option>Photos / Images</option>
          <option>Letters</option>
          <option>AI Drafts</option>
        </select>
      </div>
    </div>
  );
};

const HelpPlanContent = () => (
  <div className="space-y-4">
    <div className="p-4 rounded-xl flex items-start gap-3 bg-primary/10 border border-primary/20">
      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" strokeWidth={2} />
      <div>
        <p className="text-sm font-medium mb-1 text-foreground">AI-Assisted Generation</p>
        <p className="text-xs text-muted-foreground">
          Based on recent notes, a draft help plan has been prepared. Review and edit as needed.
        </p>
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium mb-2 text-muted-foreground">Goals</label>
      <textarea 
        defaultValue="1. Improve social integration at school&#10;2. Weekly family check-ins&#10;3. Monitor sleep patterns"
        className="w-full h-32 p-3 text-sm rounded-xl outline-none resize-none bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
    <div>
      <label className="block text-xs font-medium mb-2 text-muted-foreground">Actions</label>
      <textarea 
        defaultValue="- Schedule meeting with school counselor&#10;- Contact mother re: evening routines&#10;- Follow-up in 2 weeks"
        className="w-full h-24 p-3 text-sm rounded-xl outline-none resize-none bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  </div>
);

const ReportsContent = () => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: "#6B6B6B" }}>Report Type</label>
      <select 
        className="w-full h-9 px-3 text-sm rounded-lg outline-none"
        style={{ background: "#F6F6F4", border: "1px solid #D8D8D8", color: "#264636" }}
      >
        <option>Weekly Summary</option>
        <option>Monthly Report</option>
        <option>Progress Report</option>
        <option>Incident Report</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: "#6B6B6B" }}>Period</label>
      <div className="flex gap-2">
        <input 
          type="date" 
          className="flex-1 h-9 px-3 text-sm rounded-lg outline-none"
          style={{ background: "#F6F6F4", border: "1px solid #D8D8D8", color: "#264636" }}
        />
        <span className="flex items-center text-sm" style={{ color: "#9B9B9B" }}>to</span>
        <input 
          type="date" 
          className="flex-1 h-9 px-3 text-sm rounded-lg outline-none"
          style={{ background: "#F6F6F4", border: "1px solid #D8D8D8", color: "#264636" }}
        />
      </div>
    </div>
    <button 
      className="w-full h-10 text-sm font-medium rounded-lg flex items-center justify-center gap-2"
      style={{ background: "#FFF4ED", color: "#264636", border: "1px solid rgba(242, 106, 46, 0.3)" }}
    >
      <Sparkles className="w-4 h-4" strokeWidth={2} />
      Generate Report
    </button>
  </div>
);

const RiskContent = () => (
  <div className="space-y-4">
    <div 
      className="p-4 rounded-lg"
      style={{ background: "#FEF3E7", border: "1px solid #E9C48B" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4" style={{ color: "#B8860B" }} strokeWidth={2} />
        <span className="text-sm font-medium" style={{ color: "#8B6914" }}>Pattern Detected</span>
      </div>
      <p className="text-sm" style={{ color: "#4A4A4A" }}>
        Emma mentioned feeling isolated <strong>twice this week</strong>. This pattern may indicate social withdrawal.
      </p>
    </div>
    <div>
      <h4 className="text-xs font-medium mb-3" style={{ color: "#6B6B6B" }}>Risk Indicators</h4>
      <div className="space-y-2">
        {[
          { label: "Social isolation", level: "medium" },
          { label: "Sleep disruption", level: "low" },
          { label: "Family tension", level: "low" },
        ].map((item, i) => (
          <div 
            key={i} 
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "#F6F6F4", border: "1px solid #E3E3E0" }}
          >
            <span className="text-sm" style={{ color: "#264636" }}>{item.label}</span>
            <span 
              className="text-xs px-2 py-0.5 rounded"
              style={{ 
                background: item.level === "medium" ? "#FEF3E7" : "#FFF4ED",
                color: item.level === "medium" ? "#8B6914" : "#C44F15"
              }}
            >
              {item.level}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TasksContent = () => (
  <div className="space-y-4">
    <div className="p-4 rounded-xl flex items-start gap-3 bg-primary/10 border border-primary/20">
      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" strokeWidth={2} />
      <p className="text-sm text-foreground">
        3 tasks extracted from recent notes
      </p>
    </div>
    <div className="space-y-2">
      {[
        { task: "Schedule meeting with school counselor", due: "Dec 5" },
        { task: "Call mother about evening routines", due: "Dec 3" },
        { task: "Follow-up home visit", due: "Dec 10" },
      ].map((item, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border"
        >
          <input type="checkbox" className="rounded" />
          <div className="flex-1">
            <p className="text-sm text-foreground">{item.task}</p>
            <p className="text-xs text-muted-foreground">Due: {item.due}</p>
          </div>
        </div>
      ))}
    </div>
    <button className="w-full h-9 text-sm font-medium rounded-xl text-foreground border border-border hover:bg-secondary transition-colors">
      + Add Task
    </button>
  </div>
);
