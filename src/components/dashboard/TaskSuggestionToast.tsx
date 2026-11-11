import { Check, X, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { invalidateCache } from "@/hooks/useCachedData";

interface TaskSuggestion {
  title: string;
  description?: string;
  priority?: string;
}

interface TaskSuggestionToastProps {
  caseId: string;
  suggestions: TaskSuggestion[];
  onTasksCreated?: () => void;
}

export const showTaskSuggestionToast = ({ caseId, suggestions, onTasksCreated }: TaskSuggestionToastProps) => {
  if (!suggestions || suggestions.length === 0) return;

  const handleCreateTasks = async () => {
    try {
      const result = await api.tasks.batchCreate(caseId, suggestions);
      console.log('✅ Tasks created:', result);
      
      // Invalidate tasks cache immediately for all components
      invalidateCache(`tasks_${caseId}`);
      console.log('🔄 Cache invalidated for tasks:', caseId);
      
      // Dispatch event for other listeners
      window.dispatchEvent(new CustomEvent('taskCreated', { 
        detail: { caseId } 
      }));
      console.log('📢 taskCreated event dispatched');
      
      toast({
        title: "✅ Tasks created",
        description: `${suggestions.length} tasks added to your task list`,
      });

      onTasksCreated?.();
    } catch (error: any) {
      console.error('Error creating tasks:', error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to create tasks",
        variant: "destructive",
      });
    }
  };

  // Show rich toast with task preview and action buttons
  toast({
    title: (
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span>💡 {suggestions.length} Tasks vorgeschlagen</span>
      </div>
    ) as any,
    description: (
      <div className="space-y-3 mt-2">
        <div className="space-y-1.5">
          {suggestions.slice(0, 3).map((task, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary font-semibold">•</span>
              <span className="text-foreground">{task.title}</span>
            </div>
          ))}
          {suggestions.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{suggestions.length - 3} more...
            </p>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCreateTasks}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Quick Create</span>
          </button>
          <button
            onClick={() => {}}
            className="px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-sm text-muted-foreground"
          >
            Later
          </button>
        </div>
      </div>
    ) as any,
    duration: 10000, // 10 seconds
  });
};

