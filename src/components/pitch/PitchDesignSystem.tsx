import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * PITCH DECK DESIGN SYSTEM
 * ========================
 * All slides must use these components for consistent typography, spacing, and styling.
 * 
 * Typography Scale:
 * - Title (H1): 72-80px, extra-bold, #1A1A1A
 * - Section Label: 16px, semi-bold, uppercase, pill-shaped
 * - H2: 32-36px, bold, #222222
 * - Body: 20-22px, regular, #4A4A4A
 * - Caption: 16px, medium, #707070
 * 
 * Spacing System:
 * - Title top margin: consistent from slide edge
 * - Element spacing: 24px / 32px / 48px increments
 * - Card padding: 32px
 * - Card gap: 32px / 40px
 */

// ============ SLIDE WRAPPER ============
interface SlideWrapperProps {
  children: ReactNode;
  pattern?: boolean;
}

export const PitchSlide = ({ children, pattern = false }: SlideWrapperProps) => (
  <div 
    className="fixed inset-0 overflow-hidden flex items-center justify-center"
    style={{ background: 'linear-gradient(180deg, hsl(30 25% 98%) 0%, hsl(30 20% 96%) 100%)' }}
  >
    {/* Subtle grain texture */}
    <div 
      className="absolute inset-0 opacity-[0.012] pointer-events-none"
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E")' }}
    />
    
    {/* Subtle grid pattern */}
    {pattern && (
      <div className="absolute inset-0 opacity-[0.015]"
        style={{ 
          backgroundImage: 'linear-gradient(hsl(0 0% 10% / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 10% / 0.08) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />
    )}
    
    {/* Content container - fixed grid width */}
    <div className="relative z-10 w-[90vw] max-w-[1400px] h-[calc(100vh-100px)] flex flex-col justify-center px-6 md:px-10 lg:px-14">
      {/* Standard top margin for title block */}
      <div className="pt-pitch-top">
        {children}
      </div>
    </div>
  </div>
);

// ============ SECTION LABEL (Badge) ============
interface SectionLabelProps {
  children: ReactNode;
  variant?: "default" | "primary" | "problem" | "solution";
}

export const SectionLabel = ({ children, variant = "default" }: SectionLabelProps) => {
  const styles = {
    default: "bg-pitch-text/6 border-pitch-text/10 text-pitch-muted",
    primary: "bg-primary/8 border-primary/15 text-primary",
    problem: "bg-pitch-problem/8 border-pitch-problem/15 text-pitch-problem",
    solution: "bg-pitch-solution/8 border-pitch-solution/15 text-pitch-solution",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-pitch-label-gap"
    >
      <span className={`inline-block px-4 py-2 rounded-full border text-pitch-label font-semibold tracking-widest uppercase ${styles[variant]}`}>
        {children}
      </span>
    </motion.div>
  );
};

// ============ TITLE (H1) ============
interface TitleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const Title = ({ children, className = "", delay = 0.1 }: TitleProps) => (
  <motion.h1
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`text-pitch-h1 font-extrabold text-pitch-heading leading-[1.05] tracking-tight mb-pitch-title-gap ${className}`}
  >
    {children}
  </motion.h1>
);

// ============ SUBTITLE (H2) ============
interface SubtitleProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const Subtitle = ({ children, className = "", delay = 0.15 }: SubtitleProps) => (
  <motion.h2
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`text-pitch-h2 font-bold text-pitch-heading leading-[1.1] mb-pitch-section-gap ${className}`}
  >
    {children}
  </motion.h2>
);

// ============ H3 ============
interface H3Props {
  children: ReactNode;
  className?: string;
}

export const H3 = ({ children, className = "" }: H3Props) => (
  <h3 className={`text-pitch-h3 font-semibold text-pitch-heading leading-[1.2] ${className}`}>
    {children}
  </h3>
);

// ============ BODY TEXT ============
interface BodyProps {
  children: ReactNode;
  className?: string;
  size?: "lg" | "md" | "sm";
}

export const Body = ({ children, className = "", size = "md" }: BodyProps) => {
  const sizes = {
    lg: "text-pitch-body-lg",
    md: "text-pitch-body",
    sm: "text-pitch-body-sm",
  };
  
  return (
    <p className={`${sizes[size]} font-normal text-pitch-body-color leading-[1.5] ${className}`}>
      {children}
    </p>
  );
};

// ============ MUTED TEXT ============
interface MutedProps {
  children: ReactNode;
  className?: string;
}

export const Muted = ({ children, className = "" }: MutedProps) => (
  <p className={`text-pitch-body font-normal text-pitch-muted leading-[1.5] ${className}`}>
    {children}
  </p>
);

// ============ CAPTION ============
interface CaptionProps {
  children: ReactNode;
  className?: string;
}

export const Caption = ({ children, className = "" }: CaptionProps) => (
  <span className={`text-pitch-caption font-medium text-pitch-caption-color leading-[1.4] ${className}`}>
    {children}
  </span>
);

// ============ CARD ============
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "problem" | "solution" | "primary";
}

export const Card = ({ children, className = "", variant = "default" }: CardProps) => {
  const styles = {
    default: "bg-white border-pitch-border",
    problem: "bg-pitch-problem/[0.03] border-pitch-problem/12",
    solution: "bg-pitch-solution/[0.03] border-pitch-solution/12",
    primary: "bg-primary/[0.03] border-primary/12",
  };

  return (
    <div className={`rounded-xl p-pitch-card border ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
};

// ============ CONTENT GRID ============
interface ContentGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const ContentGrid = ({ children, columns = 2, className = "" }: ContentGridProps) => {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-pitch-grid ${className}`}>
      {children}
    </div>
  );
};

// ============ ICON BOX ============
interface IconBoxProps {
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "primary" | "problem" | "solution";
  size?: "sm" | "md" | "lg";
}

export const IconBox = ({ icon: Icon, variant = "primary", size = "md" }: IconBoxProps) => {
  const bgStyles = {
    default: "bg-pitch-text/8",
    primary: "bg-primary/10",
    problem: "bg-pitch-problem/10",
    solution: "bg-pitch-solution/10",
  };

  const iconStyles = {
    default: "text-pitch-text",
    primary: "text-primary",
    problem: "text-pitch-problem-dark",
    solution: "text-pitch-solution-dark",
  };

  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={`${sizes[size]} rounded-lg ${bgStyles[variant]} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`${iconSizes[size]} ${iconStyles[variant]}`} />
    </div>
  );
};

// ============ ACCENT LINE ============
interface AccentLineProps {
  variant?: "primary" | "problem" | "solution";
  position?: "left" | "top" | "bottom";
}

export const AccentLine = ({ variant = "primary", position = "left" }: AccentLineProps) => {
  const colors = {
    primary: "bg-primary",
    problem: "bg-pitch-problem",
    solution: "bg-pitch-solution",
  };

  const positions = {
    left: "absolute left-0 top-0 bottom-0 w-1",
    top: "absolute left-0 right-0 top-0 h-1",
    bottom: "absolute left-0 right-0 bottom-0 h-1",
  };

  return <div className={`${positions[position]} ${colors[variant]} rounded-full`} />;
};

// ============ HIGHLIGHT TEXT ============
interface HighlightProps {
  children: ReactNode;
  variant?: "primary" | "problem" | "solution";
}

export const Highlight = ({ children, variant = "primary" }: HighlightProps) => {
  const colors = {
    primary: "text-primary",
    problem: "text-pitch-problem",
    solution: "text-pitch-solution",
  };

  return <span className={colors[variant]}>{children}</span>;
};

// ============ DIVIDER ============
export const Divider = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-pitch-border ${className}`} />
);

// ============ FOOTER BADGE ============
interface FooterBadgeProps {
  children: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}

export const FooterBadge = ({ children, icon: Icon }: FooterBadgeProps) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-pitch-text/4 border border-pitch-text/8">
    {Icon && <Icon className="w-4 h-4 text-pitch-muted" />}
    <span className="text-pitch-caption font-medium text-pitch-muted">{children}</span>
  </div>
);

// ============ STAT NUMBER ============
interface StatProps {
  value: string;
  label: string;
  description?: string;
  highlight?: boolean;
}

export const Stat = ({ value, label, description, highlight = false }: StatProps) => (
  <div className={`rounded-xl p-pitch-card border ${highlight ? 'bg-gradient-to-br from-primary to-primary/85 border-primary' : 'bg-white border-pitch-border'}`}>
    <div className={`text-pitch-stat font-bold mb-1 ${highlight ? 'text-white' : 'text-pitch-heading'}`}>
      {value}
    </div>
    <div className={`text-pitch-label font-semibold uppercase tracking-wider mb-1 ${highlight ? 'text-white/80' : 'text-primary'}`}>
      {label}
    </div>
    {description && (
      <p className={`text-pitch-body-sm font-medium leading-snug ${highlight ? 'text-white/80' : 'text-pitch-muted'}`}>
        {description}
      </p>
    )}
  </div>
);
