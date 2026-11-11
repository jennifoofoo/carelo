import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Calendar, Tag } from "lucide-react";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (caseData: {
    name: string;
    age: number;
    tag: "priority" | "stable" | "school" | "family";
  }) => void;
}

const tagOptions = [
  { value: "priority" as const, label: "Priority", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.1)" },
  { value: "stable" as const, label: "Stable", color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.1)" },
  { value: "school" as const, label: "School", color: "hsl(var(--info))", bg: "hsl(var(--info) / 0.1)" },
  { value: "family" as const, label: "Family", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
];

export const CreateCaseModal = ({ isOpen, onClose, onCreateCase }: CreateCaseModalProps) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedTag, setSelectedTag] = useState<"priority" | "stable" | "school" | "family">("stable");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && age) {
      onCreateCase({
        name: name.trim(),
        age: parseInt(age),
        tag: selectedTag,
      });
      setName("");
      setAge("");
      setSelectedTag("stable");
      onClose();
    }
  };

  const handleClose = () => {
    setName("");
    setAge("");
    setSelectedTag("stable");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border border-border rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create New Case
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <User className="w-4 h-4 text-muted-foreground" />
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client's full name"
              className="h-11 bg-secondary border-border rounded-xl text-foreground"
              required
            />
          </div>

          {/* Age Field */}
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Age
            </Label>
            <Input
              id="age"
              type="number"
              min="0"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              className="h-11 bg-secondary border-border rounded-xl text-foreground"
              required
            />
          </div>

          {/* Tag Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Status Tag
            </Label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setSelectedTag(tag.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedTag === tag.value 
                      ? "border-2" 
                      : "bg-secondary text-muted-foreground border-2 border-transparent"
                  }`}
                  style={{
                    background: selectedTag === tag.value ? tag.bg : undefined,
                    color: selectedTag === tag.value ? tag.color : undefined,
                    borderColor: selectedTag === tag.value ? tag.color : undefined,
                  }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 rounded-xl"
              disabled={!name.trim() || !age}
            >
              Create Case
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};