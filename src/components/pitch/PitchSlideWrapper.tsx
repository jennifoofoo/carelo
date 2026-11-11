import { ReactNode } from "react";

// ============ RESPONSIVE PITCH DESIGN SYSTEM ============
// Optimized for all viewports: Mobile, Tablet, Desktop, and Beamer (1920x1080)
// Maximum readability, contrast, and visual stability across all devices

// MAXIMUM CONTRAST COLOR PALETTE - No pale colors, no low opacity
export const PITCH_COLORS = {
  heading: '#000000',      // Pure black for maximum contrast
  body: '#000000',         // Pure black for body text (beamer-critical)
  muted: '#1a1a1a',        // Very dark gray (still readable on beamer)
  accent: '#F26A2E',       // Carelo Orange
  accentDark: '#D4580D',   // Darker orange for emphasis
  background: '#FAFAFA',   // Light background
};

// ============ RESPONSIVE FONT SIZES ============
// Adaptive sizing for all viewports - Mobile (320px+), Tablet, Desktop, and Beamer
// Using clamp() for fluid scaling between minimum and maximum sizes
const FONT_SIZES = {
  h1: 'clamp(32px, 5.5vmin, 100px)',      // Mobile: 32px → Beamer: 100px
  h2: 'clamp(28px, 4.5vmin, 80px)',       // Mobile: 28px → Beamer: 80px
  h3: 'clamp(24px, 3.5vmin, 56px)',       // Mobile: 24px → Beamer: 56px
  subtitle: 'clamp(20px, 3vmin, 48px)',   // Mobile: 20px → Beamer: 48px
  bodyL: 'clamp(18px, 2.6vmin, 42px)',    // Mobile: 18px → Beamer: 42px
  bodyM: 'clamp(16px, 2.2vmin, 36px)',    // Mobile: 16px → Beamer: 36px
  bodyS: 'clamp(14px, 2vmin, 32px)',      // Mobile: 14px → Beamer: 32px
  caption: 'clamp(12px, 1.8vmin, 28px)',  // Mobile: 12px → Beamer: 28px
  badge: 'clamp(11px, 1.4vmin, 24px)',    // Mobile: 11px → Beamer: 24px
};

// ============ RESPONSIVE LAYOUT GRID ============
// Dynamically scales spacing for all screen sizes (Mobile → Tablet → Desktop → Beamer)
export const PITCH_SPACING = {
  headerTopPadding: 'clamp(24px, 8vh, 120px)',      // Mobile: 24px → Beamer: 120px
  badgeToTitle: 'clamp(12px, 2.5vh, 40px)',         // Mobile: 12px → Beamer: 40px
  titleToContent: 'clamp(24px, 6vh, 88px)',         // Mobile: 24px → Beamer: 88px
  titleToSubtitle: 'clamp(16px, 3.5vh, 56px)',      // Mobile: 16px → Beamer: 56px
  subtitleToContent: 'clamp(20px, 5vh, 72px)',      // Mobile: 20px → Beamer: 72px
  contentGap: 'clamp(16px, 3vmin, 48px)',           // Mobile: 16px → Beamer: 48px
  sectionPadding: 'clamp(16px, 8vw, 120px)',        // Mobile: 16px → Beamer: 120px
};

interface PitchSlideWrapperProps {
  children: ReactNode;
}

export const PitchSlideWrapper = ({ children }: PitchSlideWrapperProps) => (
  <div 
    className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden"
    style={{ background: PITCH_COLORS.background }}
  >
    {/* Subtle grain texture */}
    <div 
      className="absolute inset-0 opacity-[0.012] pointer-events-none"
      style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E")' 
      }}
    />
    
    {/* Content container - Responsive for all viewports & non-fullscreen */}
    <div 
      className="relative z-10 w-full min-h-screen flex flex-col items-center mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-7xl flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  </div>
);

// ============ UNIFIED HEADER BLOCK COMPONENT ============
// Capsule + Heading treated as ONE visual block with FIXED positioning
// This ensures identical vertical positioning across ALL slides
export const PitchHeaderBlock = ({ 
  badge, 
  title,
  badgeVariant = "default"
}: { 
  badge: string;
  title: ReactNode;
  badgeVariant?: "default" | "problem" | "solution" | "appendix";
}) => (
  <div 
    className="flex flex-col items-center text-center w-full mb-6 sm:mb-8 lg:mb-12"
  >
    {/* Fixed-size capsule - identical across all slides */}
    <PitchBadge variant={badgeVariant}>{badge}</PitchBadge>
    
    {/* Heading - responsive, maximum readability */}
    <h1 
      className="font-black leading-[1.05] tracking-[-0.025em] text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-full px-4"
      style={{ 
        color: PITCH_COLORS.heading,
        wordBreak: 'keep-all',
        hyphens: 'none',
      }}
    >
      {title}
    </h1>
  </div>
);

// ============ TYPOGRAPHY COMPONENTS ============
// All use BOLD weights, HIGH CONTRAST colors, viewport-scaled sizes

// Badge/Capsule - Fixed dimensions for consistency across slides
export const PitchBadge = ({ 
  children, 
  variant = "default" 
}: { 
  children: ReactNode; 
  variant?: "default" | "problem" | "solution" | "appendix";
}) => (
  <span 
    className="inline-block rounded-full border-2 font-black tracking-[0.14em] uppercase whitespace-nowrap text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5 lg:px-7 lg:py-3 mb-3 sm:mb-4 lg:mb-6"
    style={{ 
      textAlign: 'center',
      lineHeight: '1',
      backgroundColor: 'rgba(242, 106, 46, 0.08)', 
      borderColor: 'rgba(242, 106, 46, 0.20)',
      color: PITCH_COLORS.accent,
    }}
  >
    {children}
  </span>
);

// H1 Title - BEAMER-OPTIMIZED: Never wraps, maximum contrast
export const PitchH1 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h1 
    className={`font-black leading-[1.05] tracking-[-0.025em] text-center flex-shrink-0 ${className}`}
    style={{ 
      fontSize: FONT_SIZES.h1,
      color: PITCH_COLORS.heading,
      marginBottom: PITCH_SPACING.titleToSubtitle,
      maxWidth: '95%',
      wordBreak: 'keep-all',
      hyphens: 'none',
      fontWeight: 900
    }}
  >
    {children}
  </h1>
);

// H2 - BEAMER-OPTIMIZED: Bold, high contrast
export const PitchH2 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h2 
    className={`font-black leading-[1.1] tracking-[-0.02em] text-center flex-shrink-0 ${className}`}
    style={{ 
      fontSize: FONT_SIZES.h2,
      color: PITCH_COLORS.heading,
      marginBottom: PITCH_SPACING.subtitleToContent,
      maxWidth: '90%',
      fontWeight: 800
    }}
  >
    {children}
  </h2>
);

// H3 Section heading - BEAMER-OPTIMIZED: Minimum 32px
export const PitchH3 = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h3 
    className={`font-bold leading-[1.2] text-center ${className}`}
    style={{ 
      fontSize: FONT_SIZES.h3,
      color: PITCH_COLORS.heading,
      fontWeight: 700
    }}
  >
    {children}
  </h3>
);

// Subtitle/Lead text - BEAMER-OPTIMIZED: Minimum 30px, bold
export const PitchSubtitle = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p 
    className={`font-bold leading-[1.3] text-center flex-shrink-0 ${className}`}
    style={{ 
      fontSize: FONT_SIZES.subtitle,
      color: PITCH_COLORS.body,
      marginBottom: PITCH_SPACING.subtitleToContent,
      maxWidth: '90%',
      fontWeight: 700
    }}
  >
    {children}
  </p>
);

// Body Large - BEAMER-OPTIMIZED: Minimum 28px, bold
export const PitchBodyL = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p 
    className={`font-bold leading-[1.5] ${className}`}
    style={{ 
      fontSize: FONT_SIZES.bodyL,
      color: PITCH_COLORS.body,
      fontWeight: 700
    }}
  >
    {children}
  </p>
);

// Body Medium - BEAMER-OPTIMIZED: Minimum 26px, semibold
export const PitchBodyM = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p 
    className={`font-semibold leading-[1.5] ${className}`}
    style={{ 
      fontSize: FONT_SIZES.bodyM,
      color: PITCH_COLORS.body,
      fontWeight: 600
    }}
  >
    {children}
  </p>
);

// Body Small - BEAMER-OPTIMIZED: Minimum 24px, semibold
export const PitchBodyS = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p 
    className={`font-semibold leading-[1.5] ${className}`}
    style={{ 
      fontSize: FONT_SIZES.bodyS,
      color: PITCH_COLORS.body,
      fontWeight: 600
    }}
  >
    {children}
  </p>
);

// Caption/Footer text - BEAMER-OPTIMIZED: Minimum 22px, semibold
export const PitchCaption = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span 
    className={`font-semibold leading-[1.5] ${className}`}
    style={{ 
      fontSize: FONT_SIZES.caption,
      color: PITCH_COLORS.muted,
      fontWeight: 600
    }}
  >
    {children}
  </span>
);

// ============ CARD COMPONENT ============
export const PitchCard = ({ 
  children, 
  variant = "default",
  className = "" 
}: { 
  children: ReactNode; 
  variant?: "default" | "problem" | "solution" | "highlight";
  className?: string;
}) => {
  const styles = {
    default: { bg: '#FFFFFF', border: '#CCCCCC' },
    problem: { bg: '#FFFFFF', border: `${PITCH_COLORS.accent}40` },
    solution: { bg: '#FFFFFF', border: `${PITCH_COLORS.accent}40` },
    highlight: { bg: `${PITCH_COLORS.accent}08`, border: `${PITCH_COLORS.accent}50` },
  };

  return (
    <div 
      className={`shadow-md ${className}`}
      style={{ 
        backgroundColor: styles[variant].bg,
        border: `2px solid ${styles[variant].border}`,
        borderRadius: 'clamp(12px, 1.5vmin, 24px)',
        padding: 'clamp(16px, 2.5vmin, 40px) clamp(20px, 3vmin, 48px)',
      }}
    >
      {children}
    </div>
  );
};

// ============ HIGHLIGHT COMPONENT ============
export const PitchHighlight = ({ children }: { children: ReactNode }) => (
  <span className="font-black" style={{ color: PITCH_COLORS.accent }}>
    {children}
  </span>
);

// Export font sizes for use in custom components
export { FONT_SIZES };
