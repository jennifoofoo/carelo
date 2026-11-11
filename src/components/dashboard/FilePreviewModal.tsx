import { X, Download, Clock, ChevronRight, FileText, Image, Mic, File, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AIActionPanel } from "./AIActionPanel";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "doc" | "audio" | "spreadsheet" | "other";
  category: string;
  size: string;
  date: string;
  versions?: { label: string; date: string }[];
  aiSummary?: string;
}

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

export const FilePreviewModal = ({ file, onClose }: FilePreviewModalProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "text">("preview");

  useEffect(() => {
    if (file) {
      setSelectedVersion(file.versions?.[file.versions.length - 1]?.label || null);
      setSavedOutputs([]);
      setActiveTab("preview");
      
      // Simulate text extraction
      setIsExtracting(true);
      const timer = setTimeout(() => {
        setExtractedText(
          `This document contains important case-related information regarding the ongoing support for Emma Schmidt. Key points include:\n\n` +
          `• Contact with school counselor completed on March 12, 2024\n` +
          `• Teacher reports improved engagement in class activities\n` +
          `• Concerns noted about social isolation during lunch breaks\n` +
          `• Mother expressed worries about sleep patterns\n` +
          `• Recommended follow-up meeting scheduled for next week\n\n` +
          `Overall assessment indicates moderate progress with areas requiring continued attention.`
        );
        setIsExtracting(false);
      }, 1200);
      
      return () => clearTimeout(timer);
    }
  }, [file]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!file) return null;

  const handleActionComplete = (actionId: string, result: any) => {
    setSavedOutputs(prev => [...prev, result.savedTo]);
  };

  const getFileIcon = () => {
    switch (file.type) {
      case "image": return Image;
      case "pdf": return FileText;
      default: return File;
    }
  };

  const FileIcon = getFileIcon();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal - Wider to accommodate AI panel */}
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] mx-4 rounded-xl overflow-hidden flex"
        style={{ background: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Preview Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "#F6F6F4" }}>
          {/* Header */}
          <div 
            className="h-14 px-4 flex items-center justify-between flex-shrink-0"
            style={{ borderBottom: "1px solid #D8D8D8", background: "#FFFFFF" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div 
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "#F6F6F4" }}
              >
                <FileIcon className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate" style={{ color: "#264636" }}>
                  {file.name}
                </h3>
                <p className="text-xs" style={{ color: "#6B6B6B" }}>
                  {file.size} · {file.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Tab Switcher */}
              <div 
                className="flex items-center p-0.5 rounded-lg"
                style={{ background: "#F6F6F4" }}
              >
                <button
                  onClick={() => setActiveTab("preview")}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style={{ 
                    background: activeTab === "preview" ? "#FFFFFF" : "transparent",
                    color: activeTab === "preview" ? "#264636" : "#6B6B6B",
                    boxShadow: activeTab === "preview" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style={{ 
                    background: activeTab === "text" ? "#FFFFFF" : "transparent",
                    color: activeTab === "text" ? "#264636" : "#6B6B6B",
                    boxShadow: activeTab === "text" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                  }}
                >
                  Extracted Text
                </button>
              </div>
              
              <div style={{ borderLeft: "1px solid #D8D8D8", height: "24px" }} />
              
              <button 
                className="h-8 px-3 flex items-center gap-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#F6F6F4]"
                style={{ color: "#264636", border: "1px solid #D8D8D8" }}
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F6F6F4] transition-colors"
                style={{ color: "#6B6B6B" }}
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "preview" ? (
              <div className="flex-1 flex items-center justify-center p-8">
                {file.type === "image" ? (
                  <img 
                    src="/placeholder.svg" 
                    alt={file.name}
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                    style={{ background: "#FFFFFF" }}
                  />
                ) : (
                  <div 
                    className="w-full max-w-lg aspect-[3/4] rounded-lg flex items-center justify-center"
                    style={{ background: "#FFFFFF", border: "1px solid #E3E3E0" }}
                  >
                    <div className="text-center p-8">
                      <FileIcon className="w-16 h-16 mx-auto mb-4" style={{ color: "#D8D8D8" }} strokeWidth={1.5} />
                      <p className="text-sm font-medium mb-1" style={{ color: "#264636" }}>
                        {file.name}
                      </p>
                      <p className="text-xs" style={{ color: "#9B9B9B" }}>
                        Document preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div 
                  className="max-w-2xl mx-auto p-6 rounded-lg"
                  style={{ background: "#FFFFFF", border: "1px solid #E3E3E0" }}
                >
                  {isExtracting ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[#F26A2E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm" style={{ color: "#6B6B6B" }}>Extracting text...</p>
                      </div>
                    </div>
                  ) : extractedText ? (
                    <pre 
                      className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                      style={{ color: "#4A4A4A" }}
                    >
                      {extractedText}
                    </pre>
                  ) : (
                    <p className="text-sm text-center py-12" style={{ color: "#9B9B9B" }}>
                      No text could be extracted from this file.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Saved Outputs Banner */}
            {savedOutputs.length > 0 && (
              <div 
                className="px-6 py-3 flex items-center justify-between flex-shrink-0"
                style={{ background: "#FFF4ED", borderTop: "1px solid rgba(242, 106, 46, 0.3)" }}
              >
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
                  <span className="text-sm font-medium" style={{ color: "#264636" }}>
                    {savedOutputs.length} output{savedOutputs.length > 1 ? "s" : ""} saved to case
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[...new Set(savedOutputs)].map((output, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: "rgba(242, 106, 46, 0.3)", color: "#264636" }}
                    >
                      {output}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Action Panel */}
        <div 
          className="w-80 flex-shrink-0 flex flex-col"
          style={{ borderLeft: "1px solid #D8D8D8", background: "#FFFFFF" }}
        >
          {/* Panel Header */}
          <div 
            className="h-14 px-4 flex items-center gap-2 flex-shrink-0"
            style={{ borderBottom: "1px solid #E3E3E0" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
            <h3 className="text-sm font-semibold" style={{ color: "#264636" }}>
              AI Actions
            </h3>
          </div>

          {/* AI Action Panel Content */}
          <AIActionPanel 
            extractedText={extractedText}
            fileType={file.type}
            onActionComplete={handleActionComplete}
          />

          {/* Version History (if available) */}
          {file.versions && file.versions.length > 0 && (
            <div 
              className="p-4 flex-shrink-0"
              style={{ borderTop: "1px solid #E3E3E0" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: "#264636" }} strokeWidth={2} />
                <h4 className="text-xs font-semibold" style={{ color: "#6B6B6B" }}>
                  VERSIONS
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {file.versions.map((version) => (
                  <button
                    key={version.label}
                    onClick={() => setSelectedVersion(version.label)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-xs"
                    style={{ 
                      background: selectedVersion === version.label ? "#FFF4ED" : "#F6F6F4",
                      border: selectedVersion === version.label ? "1px solid rgba(242, 106, 46, 0.3)" : "1px solid #E3E3E0",
                      color: "#264636"
                    }}
                  >
                    {version.label === "AI Draft" && (
                      <Sparkles className="w-3 h-3" strokeWidth={2} />
                    )}
                    {version.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Details */}
          <div 
            className="p-4 flex-shrink-0"
            style={{ borderTop: "1px solid #E3E3E0" }}
          >
            <h4 className="text-xs font-semibold mb-2" style={{ color: "#6B6B6B" }}>
              DETAILS
            </h4>
            <div className="space-y-1.5 text-xs" style={{ color: "#4A4A4A" }}>
              <div className="flex justify-between">
                <span style={{ color: "#6B6B6B" }}>Category</span>
                <span 
                  className="px-2 py-0.5 rounded"
                  style={{ background: "#F6F6F4" }}
                >
                  {file.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B6B6B" }}>Size</span>
                <span>{file.size}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B6B6B" }}>Added</span>
                <span>{file.date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
