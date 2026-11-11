import { useState, useEffect } from "react";
import {
  FileText, Loader2, Download, Eye, Trash2,
  Sparkles, XCircle, AlertCircle, Printer, X
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ReportsTabProps {
  caseId: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  is_system_template: boolean;
  structure: any;
  required_fields: string[];
}

interface Report {
  id: string;
  case_id: string;
  template_id: string;
  title: string;
  report_type: string;
  content: any;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  youth_office: "Jugendamt",
  court: "Gericht",
  quarterly: "Quartalsbericht",
  handover: "Übergabe",
  help_plan: "Help Plan",
  custom: "Benutzerdefiniert",
};

export const ReportsTab = ({ caseId }: ReportsTabProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;
    loadTemplates();
    loadReports();
  }, [caseId]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      setTemplatesError(null);
      const data = await api.reports.listTemplates();
      setTemplates(data);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      setTemplatesError("Could not load report templates");
      toast({
        title: "Error",
        description: "Could not load report templates",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadReports = async () => {
    if (!caseId) return;
    try {
      setIsLoadingReports(true);
      setReportsError(null);
      const data = await api.reports.list(caseId);
      setReports(data);
    } catch (error: any) {
      console.error("Error loading reports:", error);
      setReportsError("Could not load reports");
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleGenerate = async (template: ReportTemplate) => {
    if (!caseId) {
      toast({
        title: "No Case Selected",
        description: "Please select a case first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(template.id);
      setShowGenerateModal(false);
      await api.reports.generate(caseId, template.id);

      toast({
        title: "Report Generated",
        description: `Successfully generated ${template.name}`,
      });

      await loadReports();
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      await api.reports.delete(reportId);
      toast({
        title: "Report Deleted",
        description: "The report has been deleted",
      });
      await loadReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const handlePrintReport = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = report.content;
    const sections: [string, any][] =
      typeof content === 'object' && content !== null
        ? Object.entries(content)
        : [['Content', String(content ?? '')]];

    const html = `<!DOCTYPE html>
<html><head>
  <title>${report.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 32px; }
    h2 { font-size: 15px; font-weight: bold; margin-top: 24px; margin-bottom: 8px; text-transform: capitalize; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    p { font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0; }
  </style>
</head><body>
  <h1>${report.title}</h1>
  <div class="meta">${CATEGORY_LABELS[report.report_type] || report.report_type} &bull; Version ${report.version} &bull; ${new Date(report.created_at).toLocaleDateString()}</div>
  ${sections.map(([key, value]) => `<h2>${String(key).replace(/_/g, ' ')}</h2>
  <p>${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</p>`).join('\n')}
</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const categories = Array.from(new Set(templates.map(t => t.category)));

  if (!caseId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Please select a case to generate reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Report Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate professional reports using AI-powered templates
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Error Banners */}
      {templatesError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error Loading Templates</AlertTitle>
          <AlertDescription>{templatesError}</AlertDescription>
        </Alert>
      )}
      {reportsError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Error Loading Reports</AlertTitle>
          <AlertDescription>{reportsError}</AlertDescription>
        </Alert>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-secondary text-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-muted"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select Template</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleGenerate(template)}
                    disabled={isGenerating === template.id}
                    className="p-4 rounded-lg border border-border hover:border-primary transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          {template.is_system_template && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description || "No description"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{CATEGORY_LABELS[template.category] || template.category}</span>
                          {template.required_fields.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{template.required_fields.length} required fields</span>
                            </>
                          )}
                        </div>
                      </div>
                      {isGenerating === template.id && (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Reports */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Generated Reports</h2>
        {isLoadingReports ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No reports generated yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Generate Report" to create your first report
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div
                key={report.id}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">{report.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        report.status === "final"
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {CATEGORY_LABELS[report.report_type] || report.report_type} • Version {report.version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewReport(report)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReport(report)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{previewReport.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[previewReport.report_type] || previewReport.report_type} &bull; Version {previewReport.version}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintReport(previewReport)}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </Button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-5 flex-1 space-y-5">
              {previewReport.content && typeof previewReport.content === 'object'
                ? Object.entries(previewReport.content).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <div className="text-sm text-muted-foreground bg-secondary/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  ))
                : (
                  <p className="text-sm text-muted-foreground">
                    {String(previewReport.content ?? 'No content available')}
                  </p>
                )
              }
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end flex-shrink-0">
              <Button variant="outline" onClick={() => setPreviewReport(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
