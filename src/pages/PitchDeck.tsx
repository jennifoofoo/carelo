import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Play, 
  Users, 
  TrendingUp, 
  Shield, 
  MessageCircle, 
  Mail, 
  Mic, 
  FileText, 
  Sparkles, 
  Check, 
  CheckCircle,
  ClipboardCheck,
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  Heart,
  UserX,
  Timer,
  Target,
  Zap,
  Lock,
  Workflow,
  Layers,
  UserCheck,
  Copy,
  Database,
  Monitor,
  FileCheck,
  Inbox,
  Wand2,
  Server,
  Globe,
  Key,
  ShieldCheck,
  FileCode,
  RefreshCw,
  Webhook,
  CloudCog,
  DollarSign
} from "lucide-react";
import { WhyNowSlide } from "@/components/pitch/WhyNowSlide";
import BusinessModelCanvasSlide from "@/components/pitch/BusinessModelCanvasSlide";
import BusinessModelSlide from "@/components/pitch/BusinessModelSlide";
import { EmotionalOpeningSlide } from "@/components/pitch/EmotionalOpeningSlide";
import { CompetitorHeatmapSlide } from "@/components/pitch/CompetitorHeatmapSlide";
import MarketExpansionSlide from "@/components/pitch/MarketExpansionSlide";
import { ProblemSlideClean } from "@/components/pitch/ProblemSlideClean";
import { DayWithoutCareloSlide, DayWithCareloSlide } from "@/components/pitch/DayInLifeSlides";
import GTMStrategySlideClean from "@/components/pitch/GTMStrategySlideClean";
import { 
  PitchSlideWrapper, 
  PitchHeaderBlock, 
  PitchBadge,
  PITCH_COLORS, 
  PITCH_SPACING,
  FONT_SIZES 
} from "@/components/pitch/PitchSlideWrapper";
import danielPhoto from "@/assets/daniel-team.jpg";
import zanaPhoto from "@/assets/zana-team.jpg";
import jenniferTeamPhoto from "@/assets/jennifer-team.jpg";
import evaPhoto from "@/assets/eva-team.jpg";
import logoIbm from "@/assets/logo-ibm.png";
import logoTum from "@/assets/logo-tum.png";
import logoLmu from "@/assets/logo-lmu.png";
import logoHec from "@/assets/logo-hec.png";
import logoPwc from "@/assets/logo-pwc.png";
import logoSimonKucher from "@/assets/logo-simon-kucher.png";
import logoHm from "@/assets/logo-hm.png";
import qrCode from "@/assets/qr-code.svg";
import personaSocialWorker from "@/assets/persona-social-worker.png";
import personaOwner from "@/assets/persona-owner.png";

// ============ UNIFIED DESIGN SYSTEM ============
// All PITCH_COLORS, PITCH_SPACING, and FONT_SIZES imported from PitchSlideWrapper
// No local overrides - ensures consistency across all slides

// Highlight: Orange accent for emphasis
const Highlight = ({ 
  children, 
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  variant?: "primary" | "problem" | "solution";
}) => {
  const colors = {
    primary: PITCH_COLORS.accent,
    problem: PITCH_COLORS.accent,
    solution: "#F26A2E",
  };
  return <span className="font-bold" style={{ color: colors[variant] }}>{children}</span>;
};

// ContentGrid: Unified grid with 48px gaps
const ContentGrid = ({ 
  children, 
  columns = 3,
  className = ""
}: { 
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) => {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
  };
  return (
    <div className={`grid ${colClasses[columns]} ${className}`} style={{ gap: PITCH_SPACING.contentGap }}>
      {children}
    </div>
  );
};

const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [validationQuoteIndex, setValidationQuoteIndex] = useState(0);
  const [emotionalPhase, setEmotionalPhase] = useState(0); // 0-2 for 3 phases
  const emotionalSlideIndex = 0;
  const demoSlideIndex = 6; // Demo slide with video modal

  // Define slides array first to get accurate count
  const slides = [
    <EmotionalOpeningSlide key="emotional-opening" phase={emotionalPhase} />,
    <DayWithoutCareloSlide key="day-without-carelo" />,
    <ProblemSlideClean key="problem" />,
    <DayWithCareloSlide key="day-with-carelo" />,
    <SolutionSlide key="solution" />,
    <ValidationSlide key="validation" visibleQuotes={validationQuoteIndex} />,
    <DemoSlide key="demo" onPlayClick={() => setShowDemoModal(true)} />,
    <MarketSlideSplit key="market-split" />,
    <BusinessModelSlide key="business-model" />,
    <CompetitorMatrixSlide key="competitor" />,
    <TeamSlide key="team" />,
    <AskSlide key="ask" />,
    // Appendix
    <AppendixSlide key="appendix" />,
    <WhyNowSlide key="why-now" />,
    <GTMStrategySlideClean key="gtm-strategy" />,
    <MarketModelAssumptionsSlide key="market-assumptions" />,
    <BusinessModelCanvasSlide key="business-canvas" />,
    <CompetitorHeatmapSlide key="competitor-heatmap" />,
    <MarketExpansionSlide key="market-expansion" />,
    <IntegrationArchitectureSlide key="integration-architecture" />,
    <SecurityComplianceSlide key="security-compliance" />,
    <MarketHomesSlide key="market-homes" />,
    <GTMDetailSlide key="gtm-detail" />,
    <BuyerCustomerPersonaSlide key="buyer-customer-persona" />,
  ];

  const totalSlides = slides.length + 2; // +2 for EmotionalOpeningSlide's 3 phases (counted as 3 slides)

  // Calculate display slide number (accounts for emotional slide phases)
  const getDisplaySlideNumber = () => {
    if (currentSlide === emotionalSlideIndex) {
      return emotionalPhase + 1; // Phases 0, 1, 2 display as slides 1, 2, 3
    }
    if (currentSlide > emotionalSlideIndex) {
      return currentSlide + 3; // All slides after emotional slide are shifted by +2
    }
    return currentSlide + 1; // Normal slides before emotional slide
  };

  const nextSlide = () => {
    // Handle substeps for EmotionalOpeningSlide (3 phases)
    if (currentSlide === emotionalSlideIndex && emotionalPhase < 2) {
      setEmotionalPhase(prev => prev + 1);
      return;
    }
    // Reset emotional phase when leaving slide 0
    if (currentSlide === emotionalSlideIndex) {
      setEmotionalPhase(0);
    }
    // Move to next slide
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };
  
  const prevSlide = () => {
    // Handle substeps for EmotionalOpeningSlide (reverse)
    if (currentSlide === emotionalSlideIndex && emotionalPhase > 0) {
      setEmotionalPhase(prev => prev - 1);
      return;
    }
    // Move to previous slide
    if (currentSlide > 0) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);
      // If going back to emotional slide, set to last phase
      if (newSlide === emotionalSlideIndex) {
        setEmotionalPhase(2);
      }
    }
  };
  
  // Reset substeps when navigating away from emotional slide
  useEffect(() => {
    if (currentSlide !== emotionalSlideIndex) {
      setEmotionalPhase(0);
    }
  }, [currentSlide]);

  // Close demo modal when navigating away from demo slide
  useEffect(() => {
    if (currentSlide !== demoSlideIndex) {
      setShowDemoModal(false);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Demo modal opens only when user clicks play button (not auto-open)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If demo modal is open, handle modal-specific keys
      if (showDemoModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDemoModal(false);
        }
        // Allow navigation even with modal open (for clicker)
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
          e.preventDefault();
          setShowDemoModal(false);
          nextSlide();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          setShowDemoModal(false);
          prevSlide();
        }
        return;
      }

      // Normal navigation when modal is closed
      // Arrow keys
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      }
      // Space and Enter for next (common pointer/clicker behavior)
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextSlide();
      }
      // Page Up/Down for presentation remotes
      if (e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      }
      // Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
      // F key for fullscreen toggle
      if (e.key === 'f' || e.key === 'F') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, emotionalPhase, validationQuoteIndex, isFullscreen, showDemoModal]);

  const enterFullscreen = () => document.documentElement.requestFullscreen();
  const exitFullscreen = () => document.exitFullscreen();

  return (
    <div 
      className="h-screen w-screen bg-background overflow-hidden cursor-pointer select-none" 
      onClick={() => {
        if (showDemoModal) {
          setShowDemoModal(false);
        } else {
          nextSlide();
        }
      }}
    >
      {/* Slide Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="min-h-screen w-full"
          id="pitch-slide-container"
        >
          {slides[currentSlide]}
        </motion.div>
      </AnimatePresence>
      
      {/* Slide counter */}
      <div 
        className="fixed bottom-6 right-6 z-[60] text-[14px] font-medium text-[#9A9A9A] tracking-wide"
        onClick={(e) => e.stopPropagation()}
      >
        {getDisplaySlideNumber()}/{totalSlides}
      </div>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-card rounded-2xl overflow-hidden border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
              
              <video
                className="w-full h-full object-contain bg-background"
                controls
                autoPlay
                src="/demo-video-2.mp4"
                onLoadedMetadata={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.playbackRate = 2.0;
                }}
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============ SLIDES ============

// Slide 1 - Founder Story (Centered, minimal)
const FounderStorySlide = ({ showWelfareText, showSecondPart }: { showWelfareText: boolean; showSecondPart: boolean }) => (
  <PitchSlideWrapper>
    <div className="flex flex-col items-center text-center">
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-[24px] md:text-[30px] lg:text-[36px] xl:text-[42px] 2xl:text-[48px] font-medium text-[#2A2A2A] leading-[1.4]"
      >
        I grew up in the youth welfare system
      </motion.p>
      
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: showWelfareText ? 1 : 0, y: showWelfareText ? 0 : 12 }}
        transition={{ duration: 0.4 }}
        className="text-[24px] md:text-[30px] lg:text-[36px] xl:text-[42px] 2xl:text-[48px] font-bold text-primary mt-4"
      >
        — now we're building what I never had.
      </motion.p>
      
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: showSecondPart ? 1 : 0, y: showSecondPart ? 0 : 12 }}
        transition={{ duration: 0.4 }}
        className="text-[20px] md:text-[24px] lg:text-[28px] xl:text-[32px] 2xl:text-[36px] font-medium text-[#444444] mt-8"
      >
        Rebuilding the workflows that failed me.
      </motion.p>
    </div>
  </PitchSlideWrapper>
  );

// Slide 4 - Solution (CareLo Introduction - Unified Design)
const SolutionSlide = () => {
  const steps = [
    { icon: Inbox, label: "Capture", subtitle: "Voice, text, and photos instantly captured", highlight: false },
    { icon: Sparkles, label: "Understand", subtitle: "AI turns raw inputs into case-ready intelligence", highlight: false },
    { icon: Wand2, label: "Generate", subtitle: "Summaries, chronologies, early warnings, draft reports", highlight: false },
    { icon: UserCheck, label: "Human-in-the-loop", subtitle: "You verify critical signals and add nuance", highlight: true },
    { icon: Layers, label: "Manage", subtitle: "One unified timeline for every note and event", highlight: false },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ marginBottom: 'clamp(32px, 5vh, 64px)' }}
        >
          <PitchHeaderBlock 
            badge="Carelo" 
            title={<><span style={{ color: PITCH_COLORS.accent }}>Carelo</span> makes this possible.</>}
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center flex-shrink-0"
            style={{ 
            fontSize: FONT_SIZES.subtitle,
            color: PITCH_COLORS.body,
            marginBottom: PITCH_SPACING.contentGap,
            }}
          >
            AI Case Intelligence that captures everything.
        </motion.p>
        
        {/* Feature Blocks with Arrows - 5 Steps - centered */}
        <div className="flex-1 flex flex-col items-center justify-center w-full" style={{ maxWidth: '95%' }}>
          <div 
            className="grid grid-cols-5 items-stretch w-full"
            style={{ gap: 'clamp(8px, 1vw, 16px)' }}
          >
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center"
            >
              <div 
                className="flex-1 h-full flex flex-col items-center justify-start bg-white border-2 shadow-md"
                style={{ 
                  borderRadius: 'clamp(12px, 1.2vw, 20px)', 
                  padding: 'clamp(20px, 2.5vh, 36px) clamp(16px, 1.5vw, 28px)', 
                  minHeight: 'clamp(140px, 18vh, 220px)',
                  borderColor: step.highlight ? PITCH_COLORS.accent : '#CCCCCC',
                  backgroundColor: step.highlight ? `${PITCH_COLORS.accent}08` : 'white',
                  boxShadow: step.highlight ? `0 8px 24px ${PITCH_COLORS.accent}25` : undefined
                }}
              >
                <div 
                  className="rounded-xl flex items-center justify-center"
                  style={{ 
                    width: 'clamp(48px, 4.5vw, 72px)',
                    height: 'clamp(48px, 4.5vw, 72px)',
                    backgroundColor: step.highlight ? `${PITCH_COLORS.accent}20` : '#F5F5F5',
                    marginBottom: 'clamp(14px, 1.6vh, 24px)',
                  }}
                >
                  <step.icon 
                    style={{ 
                      width: 'clamp(24px, 2.2vw, 36px)', 
                      height: 'clamp(24px, 2.2vw, 36px)',
                      color: step.highlight ? PITCH_COLORS.accent : PITCH_COLORS.muted,
                    }}
                    strokeWidth={1.8} 
                  />
                </div>
                <h3 
                  className="font-bold text-center leading-tight"
                  style={{ 
                    fontSize: FONT_SIZES.bodyM,
                    color: step.highlight ? PITCH_COLORS.accent : PITCH_COLORS.heading,
                  }}
                >
                  {step.label}
                </h3>
                <p 
                  className="font-semibold text-center leading-snug"
                  style={{ 
                    fontSize: FONT_SIZES.bodyS,
                    marginTop: 'clamp(8px, 1vh, 14px)',
                    color: step.highlight ? PITCH_COLORS.body : PITCH_COLORS.muted,
                  }}
                >
                  {step.subtitle}
                </p>
              </div>

              {/* Arrow between cards - BEAMER-OPTIMIZED for visibility */}
              {i < steps.length - 1 && (
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 'clamp(20px, 2vw, 36px)' }}
                >
                  <ArrowRight 
                    style={{ 
                      width: 'clamp(24px, 2.2vw, 36px)', 
                      height: 'clamp(24px, 2.2vw, 36px)',
                      color: i === 2 ? `${PITCH_COLORS.accent}90` : '#B8B8B8',
                      strokeWidth: '2.5px'
                    }}
                  />
                </div>
              )}
            </motion.div>
          ))}
          </div>

          {/* USP Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center flex-shrink-0"
            style={{ gap: 'clamp(20px, 2.5vw, 40px)', marginTop: PITCH_SPACING.contentGap }}
          >
            {["Human-first", "No information loss", "GDPR compliant · EU-hosted"].map((badge, i) => (
              <span 
                key={i}
                className="font-semibold flex items-center"
                style={{ 
                  fontSize: FONT_SIZES.bodyS,
                  gap: 'clamp(8px, 1vw, 14px)',
                  color: i === 2 ? PITCH_COLORS.accent : PITCH_COLORS.muted,
                  backgroundColor: i === 2 ? `${PITCH_COLORS.accent}10` : 'transparent',
                  padding: i === 2 ? 'clamp(8px, 0.8vh, 14px) clamp(16px, 1.5vw, 28px)' : '0',
                  borderRadius: i === 2 ? '9999px' : '0',
                  border: i === 2 ? `2px solid ${PITCH_COLORS.accent}30` : 'none',
                }}
              >
                {i > 0 && i < 2 && (
                  <span 
                    className="rounded-full" 
                    style={{ width: 'clamp(6px, 0.5vw, 10px)', height: 'clamp(6px, 0.5vw, 10px)', backgroundColor: PITCH_COLORS.accent }} 
                  />
                )}
                {badge}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </PitchSlideWrapper>
  );
};

// Slide 5 - Validation (Unified Design System)
const ValidationSlide = ({ visibleQuotes }: { visibleQuotes: number }) => {
  const proofPoints = [
    { number: "10+", label: "Social workers interviewed", icon: Users },
    { number: "2", label: "MVP tests / live demos", icon: Monitor },
    { number: "2", label: "Pilot LOIs signed", icon: FileCheck },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: 'clamp(48px, 7vh, 96px)' }}
        >
          <PitchHeaderBlock 
            badge="Validation" 
            title={<>Built with practitioners, <span style={{ color: PITCH_COLORS.accent }}>not for them.</span></>}
          />
        </motion.div>

        {/* Metrics block - centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center items-start"
            style={{ gap: 'clamp(48px, 6vw, 100px)' }}
          >
            {proofPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
                className="flex flex-col items-center"
                style={{ width: 'clamp(180px, 18vw, 280px)' }}
              >
                <point.icon 
                  style={{ 
                    width: 'clamp(32px, 3vw, 48px)', 
                    height: 'clamp(32px, 3vw, 48px)',
                    marginBottom: 'clamp(12px, 1.5vh, 20px)',
                    color: `${PITCH_COLORS.accent}80`,
                  }} 
                  strokeWidth={1.5} 
                />
                <span 
                  className="font-bold leading-none tracking-tight"
                  style={{ 
                    fontSize: 'clamp(72px, 8vw, 120px)',
                    color: PITCH_COLORS.heading,
                  }}
                >
                  {point.number}
                </span>
                <span 
                  className="font-semibold leading-snug text-center"
                  style={{ 
                    fontSize: FONT_SIZES.bodyS,
                    marginTop: 'clamp(8px, 1vh, 16px)',
                    color: PITCH_COLORS.muted,
                  }}
                >
                  {point.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Next step */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="font-semibold text-center"
            style={{ 
              fontSize: FONT_SIZES.bodyS,
              color: PITCH_COLORS.muted, 
              marginTop: 'clamp(48px, 7vh, 112px)',
            }}
          >
            Continuing validation and MVP tests.
          </motion.p>
        </div>
      </div>
    </PitchSlideWrapper>
  );
};
// Slide 6 - Demo (Unified Design)
const DemoSlide = ({ onPlayClick }: { onPlayClick: () => void }) => (
  <PitchSlideWrapper>
    <div className="flex flex-col items-center w-full flex-1">
      {/* Unified Header Block */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PitchHeaderBlock 
          badge="Live Demo" 
          title="See how it actually works."
        />
      </motion.div>
      
      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-bold text-center"
        style={{ 
          fontSize: FONT_SIZES.subtitle,
          color: PITCH_COLORS.body,
          marginBottom: PITCH_SPACING.contentGap,
          fontWeight: 700,
        }}
      >
          From a voice note to a ready-to-use help plan, in seconds.
      </motion.p>
      
      {/* Centered PC mockup */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative cursor-pointer group"
          onClick={onPlayClick}
        >
          <div 
            className="absolute inset-0 blur-2xl scale-90 group-hover:opacity-80 transition-opacity" 
            style={{ borderRadius: '16px', backgroundColor: `${PITCH_COLORS.accent}15` }} 
          />
          
          <div className="relative" style={{ width: 'clamp(400px, 45vw, 700px)' }}>
            <div className="bg-[#1A1A1A] rounded-t-lg p-2 border border-[#333]">
              <div className="bg-card rounded-md overflow-hidden">
                <div className="h-6 bg-muted flex items-center px-2 gap-1 border-b border-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="bg-background rounded h-5 flex items-center justify-center">
                      <span className="font-bold" style={{ fontSize: 'clamp(16px, 1.4vw, 22px)', color: PITCH_COLORS.body, fontWeight: 700 }}>carelo.org/dashboard</span>
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[16/10] bg-gradient-to-br from-muted to-card relative overflow-hidden group">
                  <img 
                    src="/dashboard-preview.png" 
                    alt="Carelo Dashboard"
                    className="w-full h-full object-cover object-top"
                  />
                  
                  {/* Hover overlay with play button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <motion.div
                      className="rounded-full flex items-center justify-center border"
                      style={{ 
                        width: 'clamp(56px, 5vw, 80px)',
                        height: 'clamp(56px, 5vw, 80px)',
                        backgroundColor: `${PITCH_COLORS.accent}15`,
                        borderColor: `${PITCH_COLORS.accent}25`
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Play style={{ width: 'clamp(24px, 2.5vw, 36px)', height: 'clamp(24px, 2.5vw, 36px)', color: PITCH_COLORS.accent, marginLeft: '2px' }} fill="currentColor" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2A2A2A] h-4 rounded-b-md mx-6" />
            <div className="bg-[#3A3A3A] h-2 rounded-b-md mx-12" />
          </div>
          
          <p 
            className="font-semibold text-center" 
            style={{ marginTop: 'clamp(16px, 2vh, 28px)', fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.muted }}
          >
            Click to play demo
          </p>
        </motion.div>
      </div>
    </div>
  </PitchSlideWrapper>
);


// Slide 8 - Market (Horizontal Bar Visualization)
const MarketSlide = () => {
  const barData = [
    { value: "€26.8B", label: "Total Burden", width: "100%", color: "hsl(24 85% 50%)" },
    { value: "€2.9B", label: "Target Sectors", width: "11%", color: "hsl(24 75% 58%)" },
    { value: "€580M", label: "SAM", suffix: "(20% efficiency capture)", width: "2.2%", color: "hsl(145 55% 42%)" },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-black leading-[1.05] tracking-[-0.025em] text-center"
          style={{ 
            fontSize: FONT_SIZES.h1,
            color: PITCH_COLORS.heading,
            marginBottom: PITCH_SPACING.titleToContent,
            maxWidth: '95%',
            fontWeight: 900,
          }}
        >
          A €26.8B documentation burden, a{" "}
          <span className="bg-gradient-to-r from-primary to-pitch-solution bg-clip-text text-transparent">€580M opportunity</span>.
        </motion.h1>
        
        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-pitch-body-color text-[18px] xl:text-[20px] 2xl:text-[22px] font-medium mb-16 xl:mb-20"
        >
          Youth welfare is our entry point — the same burden exists across all of social care.
        </motion.p>
        
        {/* Horizontal Bars */}
        <div className="space-y-8 xl:space-y-10">
          {barData.map((bar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
              className="flex items-center gap-6 xl:gap-8"
            >
              {/* Value and Label */}
              <div className="w-48 xl:w-56 flex-shrink-0">
                <span className="text-[36px] xl:text-[44px] 2xl:text-[52px] font-extrabold text-pitch-heading leading-none">
                  {bar.value}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-pitch-body-color text-[15px] xl:text-[16px] font-semibold">
                    {bar.label}
                  </span>
                  {bar.suffix && (
                    <span className="text-pitch-muted text-[13px] xl:text-[14px] font-medium">
                      {bar.suffix}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Bar */}
              <div className="flex-1 h-10 xl:h-12 bg-pitch-border/30 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: bar.width }}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-lg"
                  style={{ 
                    background: bar.color,
                    minWidth: i === 2 ? "48px" : i === 1 ? "80px" : undefined
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-pitch-muted text-[13px] xl:text-[14px] font-medium mt-16 xl:mt-20"
        >
          Estimates based on German sector wage data and documentation workload studies.
        </motion.p>
      </div>
    </PitchSlideWrapper>
  );
};

// Market Slide - Version 1: Reverse Flow (Growth Framing) with Sequential Reveals
const MarketSlideReverseFlow = ({ revealStep }: { revealStep: number }) => {
  const levels = [
    { value: "€580M", label: "SAM — Our starting point", color: "hsl(145 55% 42%)", size: "small" },
    { value: "€2.9B", label: "Target Sectors", color: "hsl(24 75% 55%)", size: "medium" },
    { value: "€26.8B", label: "Total System Inefficiency", color: "hsl(24 85% 50%)", size: "large" },
  ];

  return (
    <PitchSlideWrapper>
      <div>
        {/* Headline - always visible */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-black leading-[1.05] tracking-[-0.025em] text-center"
          style={{ 
            fontSize: FONT_SIZES.h1,
            color: PITCH_COLORS.heading,
            marginBottom: PITCH_SPACING.titleToContent,
            maxWidth: '95%',
            fontWeight: 900,
          }}
        >
          We start in a{" "}
          <span className="text-pitch-solution">€580M market</span>
          {" "}— expanding into a{" "}
          <span className="text-primary">€26.8B</span> system inefficiency.
        </motion.h1>
        
        {/* Subheadline - always visible */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="text-pitch-body-color text-[18px] xl:text-[20px] font-medium mb-14 xl:mb-18"
        >
          Youth welfare is our entry point. The same documentation burden spans all of social care.
        </motion.p>
        
        {/* Reverse Flow Visualization - Sequential Reveals */}
        <div className="flex flex-col-reverse gap-4 xl:gap-5 max-w-4xl">
          {levels.map((level, i) => {
            // Determine visibility: i=0 (€580M) always, i=1 (€2.9B) at step>=1, i=2 (€26.8B) at step>=2
            const isVisible = i <= revealStep;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0, 
                  y: isVisible ? 0 : 16 
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex items-center gap-6"
              >
                {/* Growing bar visualization */}
                <div 
                  className="h-14 xl:h-16 rounded-lg flex items-center px-6 xl:px-8"
                  style={{ 
                    background: level.color,
                    width: level.size === "small" ? "30%" : level.size === "medium" ? "60%" : "100%"
                  }}
                >
                  <span className="text-[28px] xl:text-[36px] 2xl:text-[42px] font-extrabold text-white">
                    {level.value}
                  </span>
                </div>
                <span className="text-pitch-body-color text-[16px] xl:text-[18px] font-medium">
                  {level.label}
                </span>
              </motion.div>
            );
          })}
        </div>
        
        {/* Expansion arrow indicator - reveals with final step */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ 
            opacity: revealStep >= 2 ? 1 : 0,
            y: revealStep >= 2 ? 0 : 12
          }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="flex items-center gap-3 mt-8"
        >
          <ArrowRight className="w-5 h-5 text-primary rotate-[-90deg]" />
          <span className="text-pitch-muted text-[14px] font-medium uppercase tracking-wider">Expansion Path</span>
        </motion.div>
        
        {/* Footer - always visible */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-pitch-muted text-[13px] xl:text-[14px] font-medium mt-12"
        >
          Estimates based on German wage data and workload studies.
        </motion.p>
      </div>
    </PitchSlideWrapper>
  );
};

// Market Slide - Version 2: Split Layout (Pain vs. Payoff) - Solid Color Boxes
const MarketSlideSplit = () => {
  const roadmapSteps = [
    { label: "Youth Welfare", icon: Shield, isStart: true },
    { label: "Eingliederungshilfe", icon: Users },
    { label: "Elderly Care", icon: Heart },
    { label: "Psychiatric", icon: Sparkles },
    { label: "Full Market", icon: TrendingUp },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="EU Market Opportunity" 
            title={<>Quantifying both the pain and the <span style={{ color: PITCH_COLORS.accent }}>payoff</span>.</>}
          />
        </motion.div>
        
        {/* Split Layout - Solid Color Boxes - Centered */}
        <div 
          className="grid lg:grid-cols-2 w-full flex-1"
          style={{ 
            gap: 'clamp(4px, 0.5vw, 8px)',
            maxWidth: '95%',
          }}
        >
          {/* Left - Pain (Orange) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-center text-left"
            style={{
              background: `linear-gradient(135deg, ${PITCH_COLORS.accent}, ${PITCH_COLORS.accent}E6)`,
              borderRadius: 'clamp(16px, 1.5vw, 24px) 0 0 clamp(16px, 1.5vw, 24px)',
              padding: 'clamp(32px, 4vh, 56px) clamp(32px, 4vw, 56px)',
              minHeight: 'clamp(180px, 22vh, 280px)',
            }}
          >
            <span 
              className="font-black leading-none tracking-tight text-white"
              style={{ fontSize: 'clamp(56px, 6vw, 96px)' }}
            >
              150+ BN
            </span>
            <p 
              className="font-bold text-white"
              style={{ fontSize: FONT_SIZES.bodyM, marginTop: 'clamp(16px, 2vh, 28px)' }}
            >
              lost annually to documentation (EU)
            </p>
            <p 
              className="font-bold text-white"
              style={{ fontSize: FONT_SIZES.bodyS, marginTop: 'clamp(8px, 1vh, 14px)', fontWeight: 700 }}
            >
              ~12% of social care budget wasted on admin.
            </p>
          </motion.div>
          
          {/* Right - Market (Green) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col justify-center text-left"
            style={{
              background: 'linear-gradient(135deg, hsl(145 55% 42%), hsl(145 55% 38%))',
              borderRadius: '0 clamp(16px, 1.5vw, 24px) clamp(16px, 1.5vw, 24px) 0',
              padding: 'clamp(32px, 4vh, 56px) clamp(32px, 4vw, 56px)',
              minHeight: 'clamp(180px, 22vh, 280px)',
            }}
          >
            <span 
              className="font-black leading-none tracking-tight text-white"
              style={{ fontSize: 'clamp(56px, 6vw, 96px)' }}
            >
              €300M
            </span>
            <p 
              className="font-bold text-white"
              style={{ fontSize: FONT_SIZES.bodyM, marginTop: 'clamp(16px, 2vh, 28px)' }}
            >
              addressable EU market
            </p>
            <p 
              className="font-bold text-white"
              style={{ fontSize: FONT_SIZES.bodyS, marginTop: 'clamp(8px, 1vh, 14px)', fontWeight: 700 }}
            >
              Youth welfare, disability care, adjacent sectors.
            </p>
          </motion.div>
        </div>
        
        {/* Expansion Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="relative w-full flex-shrink-0"
          style={{ 
            maxWidth: '95%',
            marginTop: PITCH_SPACING.contentGap,
          }}
        >
          {/* Gradient Timeline Line */}
          <div 
            className="absolute left-0 right-0 h-1 rounded-full"
            style={{ 
              top: 'clamp(28px, 3.2vh, 44px)',
              background: `linear-gradient(90deg, ${PITCH_COLORS.accent}80, ${PITCH_COLORS.accent}50, hsl(145 55% 42% / 0.6))`,
            }}
          />
          
          {/* Timeline Steps */}
          <div className="flex justify-between items-start relative">
            {roadmapSteps.map((step, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 + i * 0.08 }} 
                className="flex flex-col items-center flex-1"
              >
                {/* Icon Circle */}
                <div 
                  className="rounded-full flex items-center justify-center relative z-10"
                  style={{
                    width: 'clamp(44px, 4.5vw, 68px)',
                    height: 'clamp(44px, 4.5vw, 68px)',
                    backgroundColor: step.isStart ? PITCH_COLORS.accent : '#E8E8E8',
                    border: step.isStart ? 'none' : '2px solid #D0D0D0',
                    boxShadow: step.isStart ? `0 6px 20px ${PITCH_COLORS.accent}40` : 'none',
                  }}
                >
                  <step.icon 
                    style={{ 
                      width: 'clamp(22px, 2.2vw, 34px)', 
                      height: 'clamp(22px, 2.2vw, 34px)',
                      color: step.isStart ? 'white' : PITCH_COLORS.muted,
                    }} 
                    strokeWidth={2} 
                  />
                </div>
                
                {/* Label */}
                <span 
                  className="font-bold leading-tight text-center"
                  style={{ 
                    marginTop: 'clamp(12px, 1.4vh, 20px)',
                    fontSize: FONT_SIZES.caption,
                    color: step.isStart ? PITCH_COLORS.accent : PITCH_COLORS.muted,
                    maxWidth: 'clamp(80px, 9vw, 140px)',
                  }}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Bottom note - under timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-auto text-center w-full"
          style={{ 
            paddingTop: PITCH_SPACING.contentGap,
          }}
        >
          <p 
            className="font-semibold"
            style={{ 
              fontSize: FONT_SIZES.caption,
              color: PITCH_COLORS.muted,
            }}
          >
            2.7m FTE social workers in EU, 0.6m in DE
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Slide 10 - Team (Unified Design)
const TeamSlide = () => {
  const teamMembers = [
    { name: "Žana Kajganić", role: "Operations & Intelligence", detail: "Social Volunteer", initials: "ŽK", photo: zanaPhoto },
    { name: "Jennifer Nikolovic", role: "Tech & Delivery", detail: "Care Leaver", initials: "JN", photo: jenniferTeamPhoto },
    { name: "Eva Feische", role: "Product & Design", detail: "Social Youth Work", initials: "EF", photo: evaPhoto },
    { name: "Daniel Genath", role: "Sales & Finance", detail: "Social worker", initials: "DG", photo: danielPhoto },
  ];

  const logos = [
    { name: "IBM", img: logoIbm },
    { name: "PwC", img: logoPwc },
    { name: "TUM", img: logoTum },
    { name: "LMU", img: logoLmu },
    { name: "HM", img: logoHm },
    { name: "Simon-Kucher", img: logoSimonKucher },
    { name: "HEC Paris", img: logoHec },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Team" 
            title="A team built for the complexities of social care."
          />
        </motion.div>
        
        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center"
          style={{ 
            fontSize: FONT_SIZES.bodyM,
            marginBottom: PITCH_SPACING.contentGap, 
            color: PITCH_COLORS.accent 
          }}
        >
          Lived experience + engineering + design + domain expertise.
        </motion.p>
        
        {/* Team Members Row - MUCH LARGER photos, centered, more prominent */}
        <div 
          className="flex justify-center flex-1"
          style={{ gap: 'clamp(40px, 6vmin, 96px)' }}
        >
          {teamMembers.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              {/* Profile Photo - MUCH BIGGER */}
              <div 
                className="rounded-full bg-[#F0F0F0] flex items-center justify-center overflow-hidden shadow-xl"
                style={{ 
                  width: 'clamp(140px, 16vmin, 240px)', 
                  height: 'clamp(140px, 16vmin, 240px)',
                  marginBottom: 'clamp(16px, 2vmin, 28px)',
                }}
              >
                {member.photo ? (
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="font-bold" style={{ fontSize: FONT_SIZES.h2, color: PITCH_COLORS.muted }}>
                    {member.initials}
                  </span>
                )}
              </div>
              
              {/* Name - BIGGER */}
              <h3 
                className="font-bold"
                style={{ 
                  fontSize: FONT_SIZES.bodyL,
                  color: PITCH_COLORS.accent,
                  marginBottom: 'clamp(4px, 0.5vmin, 10px)',
                }}
              >
                {member.name}
              </h3>
              
              {/* Role - BIGGER */}
              <p 
                className="font-semibold"
                style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.heading }}
              >
                {member.role}
              </p>
              
              {/* Detail - BIGGER */}
              <p 
                className="font-semibold italic"
                style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.muted }}
              >
                {member.detail}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Logos Row - More spacing, positioned lower */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex-shrink-0"
          style={{ marginTop: 'clamp(48px, 6vmin, 88px)' }}
        >
          <div 
            className="flex justify-center items-center flex-wrap"
            style={{ gap: 'clamp(24px, 3.5vmin, 56px)' }}
          >
            {logos.map((logo, i) => (
              <img 
                key={i}
                src={logo.img}
                alt={logo.name}
                className="object-contain"
                style={{ 
                  height: 'clamp(32px, 3.5vmin, 56px)',
                  filter: 'grayscale(1) opacity(0.6)'
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Ask Slide - Unified Design
const AskSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Join Us" 
            title={<>Help us give youth welfare practitioners <span style={{ color: PITCH_COLORS.accent }}>more time</span> for the children.</>}
          />
        </motion.div>

        {/* Centered content area */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-bold leading-[1.4]"
            style={{ 
              fontSize: FONT_SIZES.subtitle,
              marginBottom: PITCH_SPACING.contentGap, 
              color: PITCH_COLORS.body,
              maxWidth: '90%',
            }}
          >
            Connect us with social workers, youth welfare institutions, or impact partners.
          </motion.p>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row items-center"
            style={{ gap: 'clamp(32px, 4vw, 64px)' }}
          >
            {/* Email CTA - Primary */}
            <div className="flex flex-col items-center">
              <a 
                href="mailto:hello@carelo.org"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center font-bold hover:opacity-80 transition-opacity"
                style={{ 
                  fontSize: FONT_SIZES.bodyL,
                  gap: 'clamp(8px, 1vw, 16px)', 
                  marginBottom: 'clamp(4px, 0.5vh, 10px)', 
                  color: PITCH_COLORS.accent 
                }}
              >
                <Mail style={{ width: 'clamp(28px, 2.5vw, 40px)', height: 'clamp(28px, 2.5vw, 40px)' }} />
                hello@carelo.org
              </a>
              <a 
                href="https://www.carelo.org"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.heading }}
              >
                www.carelo.org
              </a>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-[#D0D0D0] to-transparent" style={{ height: 'clamp(80px, 10vh, 140px)' }} />

            {/* QR Code Card */}
            <div className="flex flex-col items-center">
              <div 
                className="bg-white shadow-lg shadow-black/5 border border-[#E8E8E8]"
                style={{ borderRadius: 'clamp(12px, 1.2vw, 20px)', padding: 'clamp(16px, 2vw, 32px)' }}
              >
                <img 
                  src={qrCode} 
                  alt="QR Code to connect" 
                  style={{ width: 'clamp(100px, 10vw, 160px)', height: 'clamp(100px, 10vw, 160px)' }}
                />
              </div>
              <span 
                className="font-semibold uppercase tracking-wider"
                style={{ marginTop: 'clamp(12px, 1.5vh, 20px)', fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}
              >
                Visit carelo.org
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </PitchSlideWrapper>
  );
};


// Appendix Slide
const AppendixSlide = () => (
  <PitchSlideWrapper>
    <div className="flex flex-col items-center w-full flex-1">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PitchHeaderBlock 
          badge="Appendix" 
          title="Appendix"
          badgeVariant="appendix"
        />
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-semibold"
        style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.muted }}
      >
        Additional details & deep dives
      </motion.p>
    </div>
  </PitchSlideWrapper>
);

// Appendix - Market Model Assumptions

// ============ APPENDIX - TECHNOLOGY & COMPLIANCE ============

// Integration & Technical Architecture Slide
const IntegrationArchitectureSlide = () => {
  const whyItMattersItems = [
    { icon: Layers, text: "Existing systems are essential (Vivendi, Tau-Office, etc.)" },
    { icon: AlertTriangle, text: "Workflows are fragmented across tools" },
    { icon: Shield, text: "New solutions must fit, not replace" },
  ];

  const howItWorksItems = [
    { icon: RefreshCw, text: "Runs alongside existing software" },
    { icon: Lock, text: "Secure data connections, gradual rollout" },
    { icon: Check, text: "No migration risk, no disruption" },
  ];

  const whatItEnablesItems = [
    { icon: Zap, text: "Fast adoption, low IT effort" },
    { icon: Monitor, text: "Unified view across systems" },
    { icon: Heart, text: "More time for care, less for admin" },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Thoughtfully integrated. Designed for how youth welfare really works."
            badgeVariant="appendix"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center"
          style={{ fontSize: FONT_SIZES.subtitle, color: PITCH_COLORS.body, marginBottom: PITCH_SPACING.contentGap }}
        >
          Connects with existing systems — step by step, not all at once.
        </motion.p>
        
        {/* Three Column Layout */}
        <div 
          className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"
          style={{ gap: PITCH_SPACING.contentGap, maxWidth: '95%' }}
        >
          {[
            { title: "Why It Matters", icon: Heart, items: whyItMattersItems },
            { title: "How It Works", icon: Workflow, items: howItWorksItems },
            { title: "What It Enables", icon: Zap, items: whatItEnablesItems },
          ].map((col, colIdx) => (
          <motion.div
              key={colIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + colIdx * 0.1 }}
            className="flex flex-col"
          >
              <div 
                className="flex items-center border-b-2"
                style={{ gap: 'clamp(10px, 1vw, 16px)', paddingBottom: 'clamp(12px, 1.5vh, 20px)', marginBottom: 'clamp(16px, 2vh, 28px)', borderColor: '#E5E5E5' }}
              >
                <div 
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 'clamp(40px, 4vw, 60px)', height: 'clamp(40px, 4vw, 60px)', backgroundColor: `${PITCH_COLORS.accent}15` }}
                >
                  <col.icon style={{ width: 'clamp(20px, 2vw, 32px)', height: 'clamp(20px, 2vw, 32px)', color: PITCH_COLORS.accent }} />
              </div>
                <h3 className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>
                  {col.title}
              </h3>
            </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 1.6vh, 24px)' }}>
                {col.items.map((item, i) => (
                  <div key={i} className="flex items-start" style={{ gap: 'clamp(10px, 1vw, 16px)' }}>
                    <div 
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ width: 'clamp(24px, 2.2vw, 36px)', height: 'clamp(24px, 2.2vw, 36px)', backgroundColor: `${PITCH_COLORS.accent}15`, marginTop: '2px' }}
                    >
                      <item.icon style={{ width: 'clamp(12px, 1.1vw, 18px)', height: 'clamp(12px, 1.1vw, 18px)', color: PITCH_COLORS.accent }} strokeWidth={2} />
              </div>
                    <p className="font-semibold leading-relaxed" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body }}>{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
          ))}
        </div>

        {/* Bottom Line */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-shrink-0 border-t-2 w-full"
          style={{ paddingTop: 'clamp(16px, 2vh, 28px)', marginTop: 'auto', borderColor: '#E5E5E5', maxWidth: '95%' }}
        >
          <p className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}>
            Carelo integrates quietly — improving what already works.
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Security, Data & Legal Framework Slide
const SecurityComplianceSlide = () => {
  const securityItems = [
    { text: "Locally hosted in Germany (ISO 27001, certified data centers)" },
    { text: "No external cloud dependencies — data never leaves EU soil" },
    { text: "Zero retention — all data deleted after case closure" },
    { text: "End-to-end encryption (AES-256, TLS 1.3)" },
  ];

  const privacyItems = [
    { text: "No model training on personal data" },
    { text: "Open-source AI models hosted within the organization" },
    { text: "Pseudonymization before AI processing" },
    { text: "Transparent AI outputs and full audit logs" },
  ];

  const complianceItems = [
    { text: "GDPR Art. 9 (special category data handling)" },
    { text: "SGB VIII §8a + §36 (risk assessment & help plan obligations)" },
    { text: "EU AI Act Ready (classified as limited-risk system)" },
    { text: "Individual Data Processing Agreements for every client instance" },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Built for trust. Compliant by design."
            badgeVariant="appendix"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center"
          style={{ fontSize: FONT_SIZES.subtitle, color: PITCH_COLORS.body, marginBottom: 'clamp(12px, 1.5vh, 20px)' }}
        >
          True data protection means more than encryption — it means local control, transparency, and zero retention.
        </motion.p>
        
        {/* Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center flex-wrap rounded-xl"
          style={{ gap: 'clamp(16px, 2vw, 32px)', padding: 'clamp(12px, 1.5vh, 20px) clamp(20px, 2.5vw, 40px)', background: '#FAF7F4', marginBottom: PITCH_SPACING.contentGap }}
        >
          {['🇩🇪 Hosted in Germany', 'Open-Source Models', 'Zero Retention', '100% GDPR Compliant'].map((item, i) => (
            <span key={i} className="font-semibold" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body }}>{item}</span>
          ))}
        </motion.div>
        
        {/* Three Column Layout */}
        <div 
          className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"
          style={{ gap: PITCH_SPACING.contentGap, maxWidth: '95%' }}
        >
          {[
            { title: "Security", icon: Lock, items: securityItems },
            { title: "Privacy", icon: ShieldCheck, items: privacyItems },
            { title: "Compliance", icon: Shield, items: complianceItems },
          ].map((col, colIdx) => (
          <motion.div
              key={colIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + colIdx * 0.1 }}
            className="flex flex-col"
          >
              <div 
                className="flex items-center border-b-2"
                style={{ gap: 'clamp(10px, 1vw, 16px)', paddingBottom: 'clamp(12px, 1.5vh, 20px)', marginBottom: 'clamp(16px, 2vh, 28px)', borderColor: '#E5E5E5' }}
              >
                <div 
                  className="rounded-xl flex items-center justify-center"
                  style={{ width: 'clamp(40px, 4vw, 60px)', height: 'clamp(40px, 4vw, 60px)', backgroundColor: `${PITCH_COLORS.accent}15` }}
                >
                  <col.icon style={{ width: 'clamp(20px, 2vw, 32px)', height: 'clamp(20px, 2vw, 32px)', color: PITCH_COLORS.accent }} />
              </div>
                <h3 className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>
                  {col.title}
              </h3>
            </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.4vh, 20px)' }}>
                {col.items.map((item, i) => (
                  <div key={i} className="flex items-start" style={{ gap: 'clamp(10px, 1vw, 16px)' }}>
                    <div 
                      className="rounded-full flex-shrink-0"
                      style={{ width: 'clamp(6px, 0.5vw, 10px)', height: 'clamp(6px, 0.5vw, 10px)', backgroundColor: PITCH_COLORS.accent, marginTop: 'clamp(10px, 1vh, 16px)' }}
                    />
                    <p className="font-semibold leading-relaxed" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body }}>{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
          ))}
        </div>

        {/* Bottom Line */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-shrink-0 border-t-2 w-full"
          style={{ paddingTop: 'clamp(16px, 2vh, 28px)', marginTop: 'auto', borderColor: '#E5E5E5', maxWidth: '95%' }}
        >
          <p className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}>
            Carelo gives organizations full sovereignty over their data and AI — locally hosted, open, and GDPR by architecture.
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Market Homes Overview Slide
const MarketHomesSlide = () => {
  const regions = ['Munich', 'Bavaria', 'Germany', 'EU (est.)'];
  
  const segments = [
    { name: 'Youth Welfare', subtitle: 'Jugendhilfe', icon: '👶', values: ['≈ 250', '≈ 1,900', '≈ 10,700', '≈ 50,000'] },
    { name: 'Disability Care', subtitle: 'Eingliederungshilfe', icon: '♿', values: ['≈ 120', '≈ 1,300', '≈ 7,300', '≈ 35,000'] },
    { name: 'Elderly Care', subtitle: 'Pflegeheime', icon: '👵', values: ['57', '≈ 2,100', '≈ 11,600', '≈ 55,000'] }
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Market Overview — Estimated Number of Care Homes"
            badgeVariant="appendix"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center"
          style={{ fontSize: FONT_SIZES.subtitle, color: PITCH_COLORS.body, marginBottom: PITCH_SPACING.contentGap }}
        >
          Approximate number of residential facilities across care segments and regions.
        </motion.p>
        
        {/* Data Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-full overflow-x-auto"
          style={{ maxWidth: '95%' }}
        >
          <div style={{ minWidth: '600px' }}>
          {/* Header Row */}
          <div 
            className="grid grid-cols-5 border-b-2"
            style={{ gap: 'clamp(12px, 1.5vw, 24px)', paddingBottom: 'clamp(12px, 1.5vh, 20px)', marginBottom: 'clamp(16px, 2vh, 28px)', borderColor: '#E5E5E5' }}
          >
            <div className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>Segment</div>
            {regions.map((region, i) => (
              <div key={i} className="text-center font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.heading }}>{region}</div>
            ))}
          </div>
          
          {/* Data Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.5vh, 20px)' }}>
            {segments.map((segment, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="grid grid-cols-5 items-center rounded-xl"
                style={{ gap: 'clamp(12px, 1.5vw, 24px)', padding: 'clamp(14px, 1.8vh, 24px)', background: i % 2 === 0 ? '#FAF7F4' : 'transparent' }}
              >
                <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 16px)' }}>
                  <span style={{ fontSize: FONT_SIZES.bodyL }}>{segment.icon}</span>
                  <div>
                    <p className="font-bold" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.heading }}>{segment.name}</p>
                    <p className="font-medium" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>{segment.subtitle}</p>
                  </div>
                </div>
                {segment.values.map((value, j) => (
                  <div key={j} className="text-center">
                    <span className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: j === 3 ? PITCH_COLORS.accent : PITCH_COLORS.heading }}>{value}</span>
                    <p className="font-medium" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>homes</p>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
          </div>
        </motion.div>

        {/* Bottom Line */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-shrink-0 border-t-2 w-full flex flex-col"
          style={{ paddingTop: 'clamp(16px, 2vh, 28px)', marginTop: 'auto', borderColor: '#E5E5E5', maxWidth: '95%', gap: 'clamp(6px, 0.8vh, 12px)' }}
        >
          <p className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}>
            Over 18,000 care homes in Germany — over 140,000 across the EU.
          </p>
          <p className="font-semibold" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body }}>
            Carelo's potential market spans all three verticals.
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

const MarketModelAssumptionsSlide = () => {
  const rows = [
    { category: "TAM (EU)", value: "€300M", assumptions: "2.7M staff × €110 ARPU" },
    { category: "SAM (DE)", value: "€75M", assumptions: "700k staff in Germany" },
    { category: "SOM (Year 3)", value: "€30M", assumptions: "With adoption filters applied" },
    { category: "ARPU", value: "€100–200", assumptions: "Based on time savings" },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Market Model"
            badgeVariant="appendix"
          />
        </motion.div>
        
        {/* Simplified Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full"
          style={{ maxWidth: '85%', marginTop: PITCH_SPACING.contentGap }}
        >
          {/* Table Header */}
          <div 
            className="grid grid-cols-[1fr_1fr_2fr] border-b-2"
            style={{ gap: 'clamp(16px, 2vw, 32px)', paddingBottom: 'clamp(12px, 1.5vh, 20px)', borderColor: '#E0E0E0' }}
          >
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>Metric</span>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>Value</span>
            <span className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>Basis</span>
          </div>
          
          {/* Table Rows */}
          {rows.map((row, index) => (
            <motion.div
              key={row.category}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              className="grid grid-cols-[1fr_1fr_2fr] border-b"
              style={{ gap: 'clamp(16px, 2vw, 32px)', padding: 'clamp(16px, 2vh, 28px) 0', borderColor: '#F0F0F0' }}
            >
              <span className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.heading }}>{row.category}</span>
              <span className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}>{row.value}</span>
              <span className="font-semibold" style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.muted }}>{row.assumptions}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Slide 13 - Competitor Matrix (Strategic Positioning) - MATRIX-FOCUSED
const CompetitorMatrixSlide = () => {
  const competitors = [
    { id: "carelo", name: "Carelo", subtitle: "Full AI + Youth Welfare Fit", x: 80, y: 12, isHero: true },
    { id: "kodoku", name: "Kodoku", subtitle: "Specialized, limited AI", x: 50, y: 32, isHero: false },
    { id: "soki", name: "SoKI", subtitle: "Generic AI, no niche fit", x: 70, y: 68, isHero: false },
    { id: "generic", name: "Generic AI", subtitle: "No case model", x: 83, y: 82, isHero: false },
    { id: "caremates", name: "CareMates", subtitle: "Intake only", x: 27, y: 55, isHero: false },
    { id: "legacy", name: "Vivendi / Tau-Office", subtitle: "Legacy admin systems", x: 17, y: 35, isHero: false },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full h-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
        {/* Heading - Tighter Spacing */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-6xl mb-2 sm:mb-3 lg:mb-4"
        >
          <PitchHeaderBlock 
            badge="Competitive Landscape" 
            title={
              <>
                Who Really Understands Social Work — and <span style={{ color: PITCH_COLORS.accent, fontWeight: 800 }}>Automates</span> It?
              </>
            }
          />
        </motion.div>

        {/* Matrix - Compact and Viewport-Optimized */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          className="flex-1 flex items-center justify-center w-full max-w-5xl"
        >
          <div className="flex items-stretch w-full gap-1.5 sm:gap-2 lg:gap-3">
            {/* Y-Axis - Simplified */}
            <div className="flex flex-col items-center justify-between pt-1 sm:pt-2 pb-6 sm:pb-7 lg:pb-8">
              <span className="font-black text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#111' }}>High</span>
              <div className="flex-1 flex items-center my-2 sm:my-2.5 lg:my-3">
                    <div 
                  className="font-bold uppercase tracking-wide text-xs sm:text-sm lg:text-base"
                  style={{ color: '#111', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                    >
                      Youth welfare specialization
                    </div>
                  </div>
              <span className="font-black text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#111' }}>Low</span>
                </div>

            {/* Matrix Grid - 25% Height Reduction */}
                <div className="flex-1 flex flex-col max-w-4xl mx-auto">
                  <div 
                className="relative bg-white border-2 overflow-visible rounded-xl sm:rounded-2xl h-48 sm:h-60 md:h-72 lg:h-[315px] xl:h-[360px]"
                style={{ borderColor: '#222' }}
                  >
                {/* Grid lines - MAIN AXES ONLY */}
                    <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 bottom-0 left-1/2 bg-[#111] w-0.5" />
                  <div className="absolute left-0 right-0 top-1/2 bg-[#111] h-0.5" />
                    </div>

                {/* Competitors - Reduced Whitespace, Carelo Emphasized */}
                    {competitors.map((comp, index) => (
                      <motion.div
                        key={comp.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.06 }}
                        className="absolute flex flex-col items-center"
                    style={{ left: `${comp.x}%`, top: `${comp.y}%`, transform: 'translate(-50%, -50%)', zIndex: comp.isHero ? 10 : 1 }}
                      >
                    {/* NAME - Tighter Spacing */}
                    <div className="text-center mb-0.5 sm:mb-1 lg:mb-1.5 max-w-[60px] sm:max-w-[80px] lg:max-w-[110px] xl:max-w-[130px]">
                      <span 
                        className="block text-[10px] sm:text-xs lg:text-sm xl:text-base leading-tight" 
                        style={{ 
                          color: comp.isHero ? '#F26A2E' : '#111',
                          fontWeight: comp.isHero ? 900 : 800,
                        }}
                      >
                        {comp.name}
                            </span>
                        </div>
                        
                    {/* CIRCLE - Same Size, Higher Contrast for Carelo */}
                    <div 
                      className="rounded-full flex-shrink-0"
                      style={{ 
                        width: comp.isHero ? 'clamp(36px, 5vw, 48px)' : 'clamp(28px, 4vw, 38px)',
                        height: comp.isHero ? 'clamp(36px, 5vw, 48px)' : 'clamp(28px, 4vw, 38px)',
                        background: comp.isHero ? '#F26A2E' : '#F5F5F5',
                        border: comp.isHero ? '3px solid #111' : '2px solid #444',
                      }}
                    />
                    
                    {/* SUBTITLE - Tighter Spacing */}
                    <div className="text-center mt-0.5 sm:mt-1 lg:mt-1.5 max-w-[60px] sm:max-w-[80px] lg:max-w-[110px] xl:max-w-[130px]">
                      <span 
                        className="block text-[9px] sm:text-[10px] lg:text-xs xl:text-sm leading-tight" 
                        style={{ 
                          color: comp.isHero ? '#F26A2E' : '#555',
                          fontWeight: comp.isHero ? 700 : 600,
                        }}
                      >
                            {comp.subtitle}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

              {/* X-Axis - Simplified */}
              <div className="flex items-center pt-2 sm:pt-2.5 lg:pt-3">
                <span className="font-black text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#111' }}>Low</span>
                <div className="flex-1 mx-2 sm:mx-3 bg-[#111] h-0.5" />
                <span className="font-black text-base sm:text-lg lg:text-xl xl:text-2xl" style={{ color: '#111' }}>High</span>
                  </div>
              <span className="font-bold text-center uppercase tracking-wide text-xs sm:text-sm lg:text-base mt-1.5 sm:mt-2 lg:mt-2.5" style={{ color: '#111' }}>
                    AI Maturity / Automation Depth
                  </span>
                </div>
              </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Go-to-Market Detail Slide
const GTMDetailSlide = () => {
  const phases = [
    { phase: 'Phase 1', title: 'Pilot Projects', timeline: '0–6 months', focus: 'Medium-size free carriers (5–20 homes)', examples: 'Condrobs, SOS-Kinderdorf, Diakonie Hasenbergl', goal: 'Validate product, measure time savings, collect references' },
    { phase: 'Phase 2', title: 'Expansion', timeline: '6–12 months', focus: 'Verband-level scaling (regional + national)', examples: 'Caritas, AWO, Paritätischer Wohlfahrtsverband', goal: 'Build credibility, reach, and standardization' },
    { phase: 'Phase 3', title: 'Public Sector Entry', timeline: '12–24 months', focus: 'Stadt- & Bezirksjugendämter', examples: 'Munich, Oberbayern', goal: 'Institutional adoption under public compliance frameworks' }
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
              <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Go-to-Market Focus: Youth Welfare Träger"
            badgeVariant="appendix"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center"
          style={{ fontSize: FONT_SIZES.subtitle, color: PITCH_COLORS.body, marginBottom: PITCH_SPACING.contentGap }}
        >
          Start small, build trust, scale through networks.
        </motion.p>
        
        {/* Three Phase Cards */}
        <div 
          className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"
          style={{ gap: PITCH_SPACING.contentGap, maxWidth: '95%' }}
        >
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex flex-col rounded-xl"
              style={{ padding: 'clamp(20px, 2.5vh, 36px) clamp(20px, 2vw, 32px)', background: '#FAF7F4' }}
            >
              {/* Phase Header */}
              <div className="flex items-center" style={{ gap: 'clamp(10px, 1vw, 16px)', marginBottom: 'clamp(12px, 1.5vh, 20px)' }}>
                <span 
                  className="rounded-full font-bold uppercase tracking-wider text-white"
                  style={{ fontSize: FONT_SIZES.caption, padding: 'clamp(6px, 0.7vh, 12px) clamp(14px, 1.4vw, 24px)', backgroundColor: PITCH_COLORS.accent }}
                >
                  {phase.phase}
                </span>
                <span className="font-semibold" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted }}>{phase.timeline}</span>
                  </div>
                  
              <h3 className="font-bold" style={{ fontSize: FONT_SIZES.bodyL, color: PITCH_COLORS.heading, marginBottom: 'clamp(16px, 2vh, 28px)' }}>{phase.title}</h3>
              
              <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 1.4vh, 20px)' }}>
                {[{ label: 'Focus', value: phase.focus }, { label: 'Examples', value: phase.examples, italic: true }, { label: 'Goal', value: phase.goal }].map((item, j) => (
                  <div key={j}>
                    <p className="font-bold uppercase tracking-wider" style={{ fontSize: FONT_SIZES.caption, color: PITCH_COLORS.muted, marginBottom: 'clamp(4px, 0.5vh, 8px)' }}>{item.label}</p>
                    <p className={`font-semibold ${item.italic ? 'italic' : ''}`} style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body }}>{item.value}</p>
                  </div>
                ))}
                </div>
              </motion.div>
          ))}
            </div>

        {/* Bottom Line */}
            <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-shrink-0 border-t-2 w-full"
          style={{ paddingTop: 'clamp(16px, 2vh, 28px)', marginTop: 'auto', borderColor: '#E5E5E5', maxWidth: '95%' }}
        >
          <p className="font-bold" style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}>
            Trust beats speed — we grow by proving value and earning credibility.
              </p>
        </motion.div>
        </div>
    </PitchSlideWrapper>
  );
};

// Go-To-Market: Market Entry Strategy (Youth Welfare)
const GTMMarketEntrySlide = () => {
  const whyYouthWelfare = [
    "Highest documentation load (50% time lost)",
    "Mandatory §8a risk processes → high liability pressure",
    "Biggest measurable ROI (time + safety + quality)",
    "Strong practitioner demand for automation",
  ];

  const targetFirst = [
    "ASD + stationäre Jugendhilfe (public + freie Träger)",
    "Teamleiter:innen & Fachkräfte (10–50 seats)",
    "Entscheider: Bereichsleitung, GF, Qualitätsmanagement",
    "Early adopters: overloaded teams with high turnover",
  ];

  const whyWorks = [
    "Voice → risks → report pipeline fits all workflows",
    "Measurable ROI within first week",
    "Templates make rollouts fast",
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Go-To-Market" 
            title="Market Entry Strategy (Youth Welfare)"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-bold text-center"
          style={{ 
            fontSize: FONT_SIZES.subtitle,
            color: PITCH_COLORS.body,
            marginBottom: 'clamp(32px, 4vh, 56px)',
            fontWeight: 700,
          }}
        >
          We start in Youth Welfare — the deepest pain, clearest ROI, and fastest adoption.
        </motion.p>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-8 xl:gap-10">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="border shadow-sm bg-white border-[#E0E0E0] h-full" style={{ borderRadius: '16px', padding: '24px' }}>
              <h3 className="text-[20px] xl:text-[22px] 2xl:text-[24px] font-bold text-pitch-heading mb-6">
                Why Youth Welfare?
              </h3>
              <div className="space-y-4">
                {whyYouthWelfare.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-pitch-problem/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-pitch-problem" strokeWidth={2.5} />
                    </div>
                    <span className="text-[16px] xl:text-[17px] 2xl:text-[18px] font-medium text-pitch-body-color leading-relaxed">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="h-full p-6 xl:p-8 rounded-2xl bg-white shadow-lg border border-pitch-text/5">
              <h3 className="text-[20px] xl:text-[22px] 2xl:text-[24px] font-bold text-pitch-heading mb-6">
                Who We Target First
              </h3>
              <div className="space-y-4">
                {targetFirst.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-pitch-solution/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-pitch-solution" strokeWidth={2.5} />
                    </div>
                    <span className="text-[16px] xl:text-[17px] 2xl:text-[18px] font-medium text-pitch-body-color leading-relaxed">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 xl:mt-10 p-5 xl:p-6 rounded-xl bg-pitch-text/[0.03] border border-pitch-text/10"
        >
          <h4 className="text-[16px] xl:text-[17px] font-bold text-pitch-heading mb-4 uppercase tracking-wide">
            Why This Works
          </h4>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {whyWorks.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[15px] xl:text-[16px] font-medium text-pitch-body-color">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};


// Go-To-Market Execution Roadmap
const GTMRoadmapSlide = () => {
  const steps = [
    {
      phase: "Step 1",
      title: "Validation",
      timeline: "0–2 months",
      items: [
        "Practitioner interviews (20+)",
        "Collect real voice notes & help plans",
        "Confirm top workflows + risk logic",
      ],
    },
    {
      phase: "Step 2",
      title: "Pilot Motion",
      timeline: "2–6 months",
      items: [
        "3–5 pilot institutions (ASD + stationär)",
        "Weekly sessions with practitioners",
        "Produce measurable before/after results",
      ],
    },
    {
      phase: "Step 3",
      title: "Repeatable Sales Motion",
      timeline: "6–12 months",
      items: [
        "ROI calculator for leadership",
        "Standardized 20-min demo script",
        "Templates for DE: Hilfeplan, §8a, Verlaufsdoku",
      ],
    },
    {
      phase: "Step 4",
      title: "Institutional Scaling",
      timeline: "12–24 months",
      items: [
        "Onboarding playbook (1h → ready)",
        "Integration pack (Vivendi / Connext)",
        "Reference customers + case studies",
      ],
    },
  ];

  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Go-To-Market" 
            title="Execution Roadmap"
          />
        </motion.div>

        {/* Horizontal timeline */}
        <div className="mt-10 xl:mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="relative"
              >
                <div className="border shadow-sm bg-white border-[#E0E0E0] h-full" style={{ borderRadius: '16px', padding: '24px' }}>
                  {/* Phase badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] xl:text-[13px] font-bold uppercase tracking-wide">
                      {step.phase}
                    </span>
                    <span className="text-[12px] xl:text-[13px] font-medium text-pitch-muted">
                      {step.timeline}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-[17px] xl:text-[18px] 2xl:text-[19px] font-bold text-pitch-heading mb-4 leading-tight">
                    {step.title}
                  </h3>
                  
                  {/* Items */}
                  <div className="space-y-2.5">
                    {step.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-pitch-heading mt-2 flex-shrink-0" />
                        <span className="text-[13px] xl:text-[14px] 2xl:text-[15px] font-medium text-pitch-body-color leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Arrow connector */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 xl:-right-3.5 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-pitch-muted" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 xl:mt-10 pt-5 border-t border-pitch-text/10"
        >
          <p className="text-[14px] xl:text-[15px] 2xl:text-[16px] font-medium text-pitch-muted text-center">
            Engine generalizes to Eingliederungshilfe, Disability, Elderly Care.
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// GTM Strategy Slide - Clean, Minimal Appendix Version
const GTMStrategySlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Go-To-Market Strategy" 
            title={<>We start by building <Highlight>with real agencies</Highlight> — not for them.</>}
          />
        </motion.div>
        
        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[18px] xl:text-[20px] text-[#606060] font-medium mb-14"
        >
          Direct access, real workflows, instant value.
        </motion.p>
        
        {/* Four sections in 2x2 grid */}
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 max-w-5xl">
          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-[13px] font-bold text-[#888888] uppercase tracking-[0.15em] mb-3">
              Direct Customer Access
            </h3>
            <p className="text-[16px] xl:text-[17px] text-[#1A1A1A] font-medium leading-relaxed">
              We work directly with small & large youth welfare agencies (Jugendhilfe-Träger). This sector faces the highest documentation burden — strongest need, fastest adoption.
            </p>
          </motion.div>
          
          {/* Section 2 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-[13px] font-bold text-[#888888] uppercase tracking-[0.15em] mb-3">
              Co-Development
            </h3>
            <p className="text-[16px] xl:text-[17px] text-[#1A1A1A] font-medium leading-relaxed">
              Practitioners use Carelo in real daily workflows. We iterate on real cases, real reports, real constraints. Ensures immediate usefulness — zero adoption friction.
            </p>
          </motion.div>
          
          {/* Section 3 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-[13px] font-bold text-[#888888] uppercase tracking-[0.15em] mb-3">
              <span className="text-primary">Fast Pilots</span> → <span className="text-primary">Fast Rollouts</span>
            </h3>
            <p className="text-[16px] xl:text-[17px] text-[#1A1A1A] font-medium leading-relaxed">
              1–2 week pilot with one team. Demonstrate measurable 2–4 hours saved per worker per day. Expand to whole agency after proven value.
            </p>
          </motion.div>
          
          {/* Section 4 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-[13px] font-bold text-[#888888] uppercase tracking-[0.15em] mb-3">
              Simple Institutional Pricing
            </h3>
            <p className="text-[16px] xl:text-[17px] text-[#1A1A1A] font-medium leading-relaxed">
              Annual site license. No per-user complexity. Predictable budgets for public agencies.
            </p>
          </motion.div>
        </div>
      </div>
    </PitchSlideWrapper>
  );
};

// Buyer vs Customer Persona Slide
const BuyerCustomerPersonaSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full h-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title={<>Private Träger — <Highlight>Buyer vs Customer</Highlight></>}
            badgeVariant="appendix"
          />
        </motion.div>
        
        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[14px] xl:text-[16px] font-medium mb-6 xl:mb-8"
          style={{ color: PITCH_COLORS.muted }}
        >
          One uses Carelo daily. One pays for it.
        </motion.p>
        
        {/* Two-column layout with visual separation */}
        <div className="grid md:grid-cols-2 gap-6 xl:gap-8 flex-1 relative">
          {/* Left Column - Social Worker (USER) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col rounded-2xl p-5 xl:p-6"
            style={{ backgroundColor: '#F8F9FA' }}
          >
            {/* Label Badge */}
            <div className="flex justify-center mb-3">
              <span className="px-4 py-1.5 rounded-full text-[11px] xl:text-[12px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: '#5B8DEF' }}>
                User
              </span>
            </div>
            
            <h3 className="text-[17px] xl:text-[19px] font-bold text-center mb-1"
                style={{ color: PITCH_COLORS.heading }}>
              Social Worker
            </h3>
            
            {/* Emotional Driver */}
            <p className="text-[12px] xl:text-[13px] text-center mb-4 italic"
               style={{ color: PITCH_COLORS.muted }}>
              "More time for children, less frustration."
            </p>
            
            {/* Image */}
            <div className="w-20 h-20 xl:w-24 xl:h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-md"
                 style={{ border: '3px solid #5B8DEF' }}>
              <img 
                src={personaSocialWorker} 
                alt="Social Worker" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Pain Points - Short Impact Lines */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#5B8DEF' }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Spends &lt;3h/day with youth
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#5B8DEF' }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Loses data between tools
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <Heart className="w-4 h-4 flex-shrink-0" style={{ color: '#5B8DEF' }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Wants impact, feels stuck
                </span>
              </div>
            </div>
          </motion.div>
          
          {/* Center Divider */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
            <div className="w-px h-16 bg-[#E0E0E0]" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-white text-[#888]">vs</span>
            <div className="w-px h-16 bg-[#E0E0E0]" />
          </div>
          
          {/* Right Column - Owner (BUYER) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col rounded-2xl p-5 xl:p-6"
            style={{ backgroundColor: '#FFF8F5' }}
          >
            {/* Label Badge */}
            <div className="flex justify-center mb-3">
              <span className="px-4 py-1.5 rounded-full text-[11px] xl:text-[12px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: PITCH_COLORS.accent }}>
                Buyer
              </span>
            </div>
            
            <h3 className="text-[17px] xl:text-[19px] font-bold text-center mb-1"
                style={{ color: PITCH_COLORS.heading }}>
              Owner of Private Home
            </h3>
            
            {/* Emotional Driver */}
            <p className="text-[12px] xl:text-[13px] text-center mb-4 italic"
               style={{ color: PITCH_COLORS.muted }}>
              "Efficiency and cost control."
            </p>
            
            {/* Image */}
            <div className="w-20 h-20 xl:w-24 xl:h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-md"
                 style={{ border: `3px solid ${PITCH_COLORS.accent}` }}>
              <img 
                src={personaOwner} 
                alt="Home Owner" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Pain Points - Short Impact Lines */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: PITCH_COLORS.accent }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Pays for inefficiency
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <Users className="w-4 h-4 flex-shrink-0" style={{ color: PITCH_COLORS.accent }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Staff burnout & turnover
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/70">
                <Target className="w-4 h-4 flex-shrink-0" style={{ color: PITCH_COLORS.accent }} />
                <span className="text-[12px] xl:text-[13px] font-medium" style={{ color: PITCH_COLORS.body }}>
                  Needs compliance + ROI
                </span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Tagline - Smaller */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[11px] xl:text-[12px] font-medium text-center mt-5 pt-3 border-t border-[#E5E5E5]"
          style={{ color: PITCH_COLORS.muted }}
        >
          Carelo sells to owners. Social workers drive adoption.
        </motion.p>
      </div>
    </PitchSlideWrapper>
  );
};

export default PitchDeck;
