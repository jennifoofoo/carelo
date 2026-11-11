import { useState, useEffect } from "react";
import { 
  FileText, Image, File, Upload, Search, Download, Trash2, 
  Sparkles, Eye, ChevronDown, ChevronRight, Folder, Clock,
  FileSpreadsheet, FileImage, FilePlus, Shield
} from "lucide-react";
import { FilePreviewModal } from "./FilePreviewModal";
import api from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc" | "audio" | "other";
  category: string;
  size: string;
  date: string;
  versions?: { label: string; date: string }[];
  aiSummary?: string;
  isAnonymized?: boolean;
  originalNoteId?: string;
  anonymizedText?: string;
}

const CATEGORIES = [
  { name: "Reports", icon: FileText },
  { name: "Forms & Permissions", icon: File },
  { name: "Medical Docs", icon: FileText },
  { name: "Photos / Images", icon: FileImage },
  { name: "Letters", icon: FileText },
  { name: "Help Plans", icon: FileText },
  { name: "Anonymized Reports", icon: Shield },
  { name: "AI Drafts", icon: Sparkles },
];

const getFileIcon = (type: FileItem["type"]) => {
  switch (type) {
    case "pdf": return FileText;
    case "image": return Image;
    case "audio": return FileText;
    default: return File;
  }
};

interface DocumentsSectionProps {
  caseId?: string;
}

export const DocumentsSection = ({ caseId }: DocumentsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Reports", "Photos / Images", "Anonymized Reports"]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Use cached data for notes (which contain file info)
  const { data: notesData, isLoading, refetch } = useCachedData(
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
  const notes = notesData ?? [];

  // Listen for file upload events
  useEffect(() => {
    const handleNoteCreated = () => {
      if (caseId) {
        invalidateCache(`notes_${caseId}`);
        refetch();
      }
    };

    window.addEventListener('noteCreated', handleNoteCreated);
    return () => window.removeEventListener('noteCreated', handleNoteCreated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]); // Only depend on caseId - refetch is stable

  // Transform notes to files
  const files: FileItem[] = (() => {
    if (!caseId || !notes || notes.length === 0) return [];
    
    try {
      // Filter and transform files
      const fileNotes = notes
        .filter((note: any) => {
          const metadata = note.note_metadata ? JSON.parse(note.note_metadata) : {};
          // Include PDF, image, audio files AND help plans AND anonymized documents
          return note.source === 'pdf' || note.source === 'image' || note.source === 'audio' || 
                 (note.source === 'text' && (metadata.is_help_plan === true || metadata.anonymized === true));
        })
        .map((note: any) => {
          const metadata = note.note_metadata ? JSON.parse(note.note_metadata) : {};
          
          // Handle help plans differently
          if (note.source === 'text' && metadata.is_help_plan === true) {
            const period = metadata.help_plan_period || 'N/A';
            const version = metadata.help_plan_version || 1;
            return {
              id: note.id,
              name: `Help Plan v${version} - ${period}`,
              type: 'doc' as const,
              category: metadata.category || 'Help Plans',
              size: `${Math.round((note.normalized?.length || 0) / 1024)} KB`,
              date: new Date(note.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }),
              isAnonymized: false,
            };
          }
          
          // Handle anonymized documents
          if (note.source === 'text' && metadata.anonymized === true) {
            const originalNoteId = metadata.original_note_id || 'unknown';
            return {
              id: note.id,
              name: `Anonymized Document (from ${originalNoteId.substring(0, 8)})`,
              type: 'doc' as const,
              category: metadata.category || 'Anonymized Reports',
              size: `${Math.round((note.normalized?.length || 0) / 1024)} KB`,
              date: new Date(note.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }),
              isAnonymized: true,
              originalNoteId: originalNoteId,
              anonymizedText: note.normalized || note.raw_content,
            };
          }
          
          // Handle regular files
          const fileType = note.source === 'pdf' ? 'pdf' : note.source === 'audio' ? 'audio' : 'image';
          
          return {
            id: note.id,
            name: metadata.original_filename || metadata.filename || `${note.source}_${note.id.slice(0, 8)}.${fileType === 'pdf' ? 'pdf' : fileType === 'audio' ? 'mp3' : 'jpg'}`,
            type: fileType,
            category: metadata.category || (fileType === 'image' ? 'Photos / Images' : 'Reports'),
            size: metadata.size ? `${Math.round(metadata.size / 1024)} KB` : '0 KB',
            date: new Date(note.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
          };
        });
      
      return fileNotes;
    } catch (error) {
      console.error('Error transforming files:', error);
      return [];
    }
  })();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilesForCategory = (categoryName: string) => 
    filteredFiles.filter(f => f.category === categoryName);

  const handleDownload = async (file: FileItem, format: 'txt' | 'pdf' | 'word' = 'txt') => {
    try {
      if (file.isAnonymized) {
        if (format === 'pdf') {
          // Use backend PDF export
          const blob = await api.notesExport.exportPDF(file.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${file.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else if (format === 'word') {
          // Use backend Word export
          const blob = await api.notesExport.exportWord(file.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${file.name.replace(/[^a-z0-9]/gi, '_')}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          // Fallback: Download as .txt file
          if (file.anonymizedText) {
            const blob = new Blob([file.anonymizedText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      } else {
        // For regular files, use backend export if available
        console.log('Download regular file:', file.id);
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: error.message || "Could not download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5" style={{ color: "#264636" }} strokeWidth={2} />
          <h2 className="text-base font-semibold" style={{ color: "#264636" }}>
            Documents & Files
          </h2>
          <span 
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#FFF4ED", color: "#264636" }}
          >
            {files.length} files
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B6B6B" }} />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-4 text-sm rounded-lg transition-all"
          style={{ 
            background: "#F6F6F4", 
            border: "1px solid #D8D8D8",
            color: "#264636"
          }}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm" style={{ color: "#9B9B9B" }}>Loading files...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg" style={{ background: "#FAFAFA" }}>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: "#FFF4ED" }}
          >
            <Upload className="w-6 h-6" style={{ color: "#264636" }} strokeWidth={2} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#264636" }}>No documents yet</p>
          <p className="text-xs" style={{ color: "#6B6B6B" }}>
            Click "New Note" → "Upload Files" to add documents
          </p>
        </div>
      )}

      {/* Categories */}
      {!isLoading && files.length > 0 && (
        <div className="space-y-2">
          {CATEGORIES.map(category => {
            const categoryFiles = getFilesForCategory(category.name);
            const isExpanded = expandedCategories.includes(category.name);
            const Icon = category.icon;
            
            // Always show "Anonymized Reports" category if it has files, even if empty in search
            if (categoryFiles.length === 0 && !searchQuery && category.name !== "Anonymized Reports") return null;
            
            return (
              <div 
                key={category.name}
                className="rounded-lg overflow-hidden"
                style={{ background: "#FFFFFF", border: "1px solid #E3E3E0" }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-[#F6F6F4] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" style={{ color: "#6B6B6B" }} strokeWidth={2} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: "#6B6B6B" }} strokeWidth={2} />
                    )}
                    <Icon className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
                    <span className="text-sm font-medium" style={{ color: "#264636" }}>
                      {category.name}
                    </span>
                  </div>
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "#F6F6F4", color: "#6B6B6B" }}
                  >
                    {categoryFiles.length}
                  </span>
                </button>

                {/* Files List */}
                {isExpanded && categoryFiles.length > 0 && (
                  <div className="px-3 pb-2 space-y-1">
                    {categoryFiles.map(file => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div
                          key={file.id}
                          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-[#F6F6F4] transition-colors cursor-pointer"
                          onClick={() => setSelectedFile(file)}
                        >
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: "#F6F6F4" }}
                          >
                            <FileIcon className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate" style={{ color: "#264636" }}>
                                {file.name}
                              </p>
                              {file.isAnonymized && (
                                <span 
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: "#FFF4ED", color: "#264636" }}
                                >
                                  Anonymized
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs" style={{ color: "#6B6B6B" }}>
                              <span>{file.size}</span>
                              <span>•</span>
                              <span>{file.date}</span>
                            </div>
                          </div>
                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1.5 rounded hover:bg-[#FFF4ED] transition-colors"
                              onClick={(e) => { e.stopPropagation(); setSelectedFile(file); }}
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" style={{ color: "#264636" }} strokeWidth={2} />
                            </button>
                            {file.isAnonymized ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  className="p-1.5 rounded hover:bg-[#FFF4ED] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file, 'pdf');
                                  }}
                                  title="Download as PDF"
                                >
                                  <Download className="w-3.5 h-3.5" style={{ color: "#264636" }} strokeWidth={2} />
                                </button>
                                <button 
                                  className="p-1.5 rounded hover:bg-[#FFF4ED] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file, 'word');
                                  }}
                                  title="Download as Word"
                                >
                                  <FileText className="w-3.5 h-3.5" style={{ color: "#264636" }} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="p-1.5 rounded hover:bg-[#FFF4ED] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" style={{ color: "#264636" }} strokeWidth={2} />
                              </button>
                            )}
                            <button 
                              className="p-1.5 rounded hover:bg-red-50 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: "#B8860B" }} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty Search State */}
      {filteredFiles.length === 0 && searchQuery && !isLoading && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: "#6B6B6B" }}>
            No files found for "{searchQuery}"
          </p>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal 
        file={selectedFile} 
        onClose={() => setSelectedFile(null)} 
      />
    </div>
  );
};
