import { FileText, Image, File, ChevronRight, Sparkles, AlertTriangle, ListTodo } from "lucide-react";
import { useState } from "react";
import { useCachedData } from "@/hooks/useCachedData";
import api from "@/lib/api";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc";
  category: string;
  date: string;
  size: string;
}

interface MobileFilesListProps {
  caseId: string | null;
}

const typeIcons = {
  pdf: FileText,
  image: Image,
  doc: File,
};

const getFileType = (filename: string): "pdf" | "image" | "doc" => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
  return 'doc';
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getTimeAgo = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const MobileFilesList = ({ caseId }: MobileFilesListProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Fetch notes data (same as Desktop DocumentsSection)
  const { data: notesData, isLoading } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.notes.list(caseId);
    },
    {
      cacheKey: `notes_${caseId}`,
      ttl: 3 * 60 * 1000, // 3 minutes (same as desktop)
      enabled: !!caseId,
    }
  );

  const notes = Array.isArray(notesData) ? notesData : (notesData ? [notesData] : []);

  // Transform notes to FileItem format (same logic as Desktop DocumentsSection)
  const files: FileItem[] = notes
    .filter((note: any) => {
      // Parse metadata safely
      const metadata = note.note_metadata 
        ? (typeof note.note_metadata === 'string' ? JSON.parse(note.note_metadata) : note.note_metadata)
        : (note.metadata || {});
      
      // Include: PDF, images, audio files, help plans, and anonymized documents (same as Desktop)
      return note.source === 'pdf' || 
             note.source === 'image' || 
             note.source === 'audio' ||
             (note.source === 'text' && (metadata.is_help_plan === true || metadata.anonymized === true));
    })
    .map((note: any) => {
      // Parse metadata safely
      const metadata = note.note_metadata 
        ? (typeof note.note_metadata === 'string' ? JSON.parse(note.note_metadata) : note.note_metadata)
        : (note.metadata || {});
      
      // Handle help plans
      if (note.source === 'text' && metadata.is_help_plan === true) {
        const period = metadata.help_plan_period || 'N/A';
        const version = metadata.help_plan_version || 1;
        return {
          id: note.id,
          name: `Help Plan v${version} - ${period}`,
          type: 'doc' as const,
          category: metadata.category || 'Help Plans',
          date: getTimeAgo(note.created_at),
          size: '—',
        };
      }
      
      // Handle anonymized documents
      if (note.source === 'text' && metadata.anonymized === true) {
        return {
          id: note.id,
          name: metadata.title || 'Anonymized Report',
          type: 'doc' as const,
          category: 'Anonymized Reports',
          date: getTimeAgo(note.created_at),
          size: '—',
        };
      }
      
      // Handle regular files (pdf, image, audio)
      const filename = metadata.original_filename || note.raw_content?.split('/').pop() || 'Unknown file';
      return {
        id: note.id,
        name: filename,
        type: getFileType(filename),
        category: metadata.category || 'Documents',
        date: getTimeAgo(note.created_at),
        size: formatFileSize(metadata.file_size),
      };
    });

  // Extract unique categories from files
  const categories = ["All", ...Array.from(new Set(files.map(f => f.category)))];

  const filteredFiles = selectedCategory === "All" 
    ? files 
    : files.filter(f => f.category === selectedCategory);

  if (!caseId) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Select a case to view files</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading files...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No files yet</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Category Pills */}
      <div 
        className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 mb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all"
            style={{ 
              background: selectedCategory === cat ? "#F26A2E" : "rgba(242, 106, 46, 0.05)",
              color: selectedCategory === cat ? "#FFFFFF" : "#264636"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {filteredFiles.map((file) => {
          const Icon = typeIcons[file.type];
          return (
            <button
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-98"
              style={{ background: "#FFFFFF" }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(242, 106, 46, 0.06)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#264636" }} strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#264636" }}>{file.name}</p>
                <p className="text-xs" style={{ color: "rgba(107, 107, 107, 0.8)" }}>{file.category} · {file.date}</p>
              </div>
              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(242, 106, 46, 0.3)" }} />
            </button>
          );
        })}
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <div 
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "#FAFAF8" }}
        >
          {/* Header */}
          <div 
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderBottom: "1px solid rgba(242, 106, 46, 0.08)" }}
          >
            <button 
              onClick={() => setSelectedFile(null)}
              className="text-sm font-medium"
              style={{ color: "#5F8B71" }}
            >
              Done
            </button>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold truncate" style={{ color: "#264636" }}>{selectedFile.name}</p>
            </div>
            <div className="w-12" />
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div 
              className="w-full max-w-sm aspect-[3/4] rounded-2xl flex items-center justify-center"
              style={{ background: "#FFFFFF", border: "1px solid rgba(242, 106, 46, 0.08)" }}
            >
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: "rgba(107, 107, 107, 0.3)" }} strokeWidth={1} />
                <p className="text-sm" style={{ color: "rgba(107, 107, 107, 0.6)" }}>Document Preview</p>
              </div>
            </div>
          </div>

          {/* AI Actions */}
          <div 
            className="px-5 py-4"
            style={{ 
              background: "rgba(255, 255, 255, 0.95)",
              borderTop: "1px solid rgba(242, 106, 46, 0.08)",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))"
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "rgba(107, 107, 107, 0.5)" }}>
              AI Options
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Sparkles, label: "Summarize" },
                { icon: AlertTriangle, label: "Risks" },
                { icon: ListTodo, label: "Tasks" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95"
                  style={{ background: "rgba(38, 70, 54, 0.05)" }}
                >
                  <action.icon className="w-5 h-5" style={{ color: "#264636" }} strokeWidth={2} />
                  <span className="text-xs font-medium" style={{ color: "#264636" }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
