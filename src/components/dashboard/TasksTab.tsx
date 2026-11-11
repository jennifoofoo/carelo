import { useState, useEffect } from "react";
import { 
  Plus, Calendar, AlertCircle, 
  MoreVertical, Edit2, Trash2,
  ChevronDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import api from "@/lib/api";
import { useCachedData, invalidateCache } from "@/hooks/useCachedData";

interface Task {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

interface TasksTabProps {
  caseId?: string;
}

type TaskGroup = "overdue" | "today" | "this_week" | "later" | "completed";

export const TasksTab = ({ caseId }: TasksTabProps) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<TaskGroup>>(new Set(["completed"]));

  // Use cached data for tasks
  const { data, isLoading, refetch } = useCachedData(
    async () => {
      if (!caseId) return [];
      return await api.tasks.list(caseId);
    },
    {
      cacheKey: `tasks_${caseId}`,
      ttl: 2 * 60 * 1000, // 2 minutes
      enabled: !!caseId,
    }
  );
  
  // Ensure tasks is always an array (handle null case)
  const tasks = data ?? [];

  // Listen for task changes
  useEffect(() => {
    const handleTaskChange = (event: CustomEvent) => {
      if (event.detail?.caseId === caseId) {
        invalidateCache(`tasks_${caseId}`);
        refetch();
      }
    };

    window.addEventListener('taskCreated', handleTaskChange as EventListener);
    window.addEventListener('taskUpdated', handleTaskChange as EventListener);
    window.addEventListener('taskDeleted', handleTaskChange as EventListener);
    
    return () => {
      window.removeEventListener('taskCreated', handleTaskChange as EventListener);
      window.removeEventListener('taskUpdated', handleTaskChange as EventListener);
      window.removeEventListener('taskDeleted', handleTaskChange as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]); // Only depend on caseId - refetch is stable

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) => {
    if (!caseId) {
      toast({
        title: "No Case Selected",
        description: "Please select a case first",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.tasks.create({
        case_id: caseId,
        ...taskData,
      });
      
      toast({
        title: "Task Created",
        description: "Task has been successfully added",
      });
      
      invalidateCache(`tasks_${caseId}`);
      refetch();
      setShowCreateModal(false);
      window.dispatchEvent(new CustomEvent('taskCreated', { detail: { caseId } }));
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error Creating Task",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: {
    status?: string;
    title?: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) => {
    try {
      await api.tasks.update(taskId, updates);
      
      toast({
        title: "Task Updated",
        description: "Changes have been saved",
      });
      
      invalidateCache(`tasks_${caseId}`);
      refetch();
      setEditingTask(null);
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: { caseId } }));
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error Updating Task",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.tasks.delete(taskId);
      
      toast({
        title: "Task Deleted",
        description: "Task has been removed",
      });
      
      invalidateCache(`tasks_${caseId}`);
      refetch();
      window.dispatchEvent(new CustomEvent('taskDeleted', { detail: { caseId } }));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error Deleting Task",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === "completed" ? "open" : "completed";
    await handleUpdateTask(task.id, { status: newStatus });
  };

  const toggleGroup = (group: TaskGroup) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== "all") {
      if (filterStatus === "active" && task.status === "completed") return false;
      if (filterStatus === "completed" && task.status !== "completed") return false;
    }
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  // Group tasks by due date
  const groupTasks = (tasks: Task[]): Record<TaskGroup, Task[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const groups: Record<TaskGroup, Task[]> = {
      overdue: [],
      today: [],
      this_week: [],
      later: [],
      completed: [],
    };

    tasks.forEach(task => {
      if (task.status === "completed") {
        groups.completed.push(task);
        return;
      }

      if (!task.due_date) {
        groups.later.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        groups.overdue.push(task);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(task);
      } else if (dueDate <= endOfWeek) {
        groups.this_week.push(task);
      } else {
        groups.later.push(task);
      }
    });

    // Sort each group by priority then due date
    const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
    Object.keys(groups).forEach(key => {
      groups[key as TaskGroup].sort((a, b) => {
        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
        if (pB !== pA) return pB - pA;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    });

    return groups;
  };

  const groupedTasks = groupTasks(filteredTasks);

  const groupConfig: Record<TaskGroup, { label: string; color: string; bgColor: string }> = {
    overdue: { label: "Overdue", color: "text-destructive", bgColor: "bg-destructive/5" },
    today: { label: "Due Today", color: "text-primary", bgColor: "bg-primary/5" },
    this_week: { label: "This Week", color: "text-warning", bgColor: "bg-warning/5" },
    later: { label: "Later", color: "text-muted-foreground", bgColor: "bg-muted/30" },
    completed: { label: "Completed", color: "text-muted-foreground", bgColor: "bg-muted/30" },
  };

  const openTasks = filteredTasks.filter(t => t.status !== "completed").length;
  const completedTasks = filteredTasks.filter(t => t.status === "completed").length;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!caseId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Select a case to view tasks</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[400px] pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Tasks</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {openTasks} open · {completedTasks} completed
          </p>
        </div>
        
        {/* Compact Filters */}
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[100px] h-8 text-xs bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[100px] h-8 text-xs bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Groups */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No tasks found</p>
          <p className="text-xs text-muted-foreground mb-4">
            {tasks.length === 0 ? "Create your first task" : "Try different filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["overdue", "today", "this_week", "later", "completed"] as TaskGroup[]).map(group => {
            const groupTasks = groupedTasks[group];
            if (groupTasks.length === 0) return null;
            
            const config = groupConfig[group];
            const isCollapsed = collapsedGroups.has(group);

            return (
              <Collapsible key={group} open={!isCollapsed} onOpenChange={() => toggleGroup(group)}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full group mb-3">
                  <div className={`flex items-center gap-2 ${config.color}`}>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({groupTasks.length})
                  </span>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="space-y-2">
                    {groupTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        group={group}
                        isExpanded={expandedTaskId === task.id}
                        onToggleExpand={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                        onToggleComplete={() => handleToggleComplete(task)}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
        aria-label="New Task"
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          caseId={caseId}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(updates) => handleUpdateTask(editingTask.id, updates)}
        />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  group: TaskGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard = ({
  task,
  group,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityDot = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-destructive";
      case "medium": return "bg-primary";
      case "low": return "bg-primary/50";
      default: return "bg-muted-foreground/30";
    }
  };

  const getDueBadge = () => {
    if (!task.due_date) return null;
    
    const isOverdue = group === "overdue";
    const isToday = group === "today";
    const isThisWeek = group === "this_week";
    
    const date = new Date(task.due_date);
    const formatted = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-destructive/10 text-destructive">
          <AlertCircle className="w-3 h-3" />
          {formatted}
        </span>
      );
    }
    
    if (isToday) {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary">
          Today
        </span>
      );
    }
    
    if (isThisWeek) {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-warning/10 text-warning">
          {formatted}
        </span>
      );
    }
    
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
        {formatted}
      </span>
    );
  };

  const isCompleted = task.status === "completed";

  return (
    <div className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
      isCompleted 
        ? "bg-muted/30 border-transparent opacity-60" 
        : "bg-background border-border/50 hover:border-border"
    }`}>
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggleComplete}
        className="mt-0.5 flex-shrink-0"
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {task.priority && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityDot(task.priority)}`} />
              )}
              <span 
                className={`text-sm font-medium truncate ${
                  isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}
                onClick={task.description ? onToggleExpand : undefined}
                style={{ cursor: task.description ? 'pointer' : 'default' }}
              >
                {task.title}
              </span>
            </div>
            
            {/* Expandable description */}
            {task.description && isExpanded && (
              <p className="text-xs text-muted-foreground mt-1.5 pl-3.5 whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </div>
          
          {/* Right: Meta + Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {getDueBadge()}
            
            {/* Context Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-7 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[100px]">
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted flex items-center gap-2 text-foreground"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Task Modal
interface CreateTaskModalProps {
  caseId: string;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; priority?: string; due_date?: string }) => void;
}

const CreateTaskModal = ({ caseId, onClose, onSave }: CreateTaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority || undefined,
      due_date: dueDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-border p-5 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-base font-semibold text-foreground mb-4">New Task</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="h-9"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-9">
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Task Modal
interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updates: { title?: string; description?: string; priority?: string; due_date?: string; status?: string }) => void;
}

const EditTaskModal = ({ task, onClose, onSave }: EditTaskModalProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">(task.priority || "");
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : "");
  const [status, setStatus] = useState(task.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority || undefined,
      due_date: dueDate || undefined,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-border p-5 w-full max-w-md mx-4 shadow-xl">
        <h3 className="text-base font-semibold text-foreground mb-4">Edit Task</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="h-9"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-9">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TasksTab;
