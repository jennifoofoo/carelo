import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingCard = ({ children, className, delay = 0 }: FloatingCardProps) => {
  return (
    <div
      className={cn(
        "backdrop-blur-sm bg-card/95 border border-border rounded-lg p-4 shadow-sm",
        "animate-float",
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
};
