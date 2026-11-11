import { motion } from "framer-motion";
import { 
  Home, Phone, Camera, AlertTriangle, Users, FileText, 
  Mic, FileCheck, CheckCircle
} from "lucide-react";
import { PITCH_COLORS, PITCH_SPACING, FONT_SIZES, PitchSlideWrapper, PitchHeaderBlock } from "./PitchSlideWrapper";

// Timeline hours
const timelineHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// Problem events (Without Carelo)
const problemEvents = [
  { hour: 8.5, label: "Shift handover", detail: "verbal only, no notes", icon: Users, rotation: -2 },
  { hour: 9, label: "Home visit", detail: "handwritten note", icon: Home, rotation: 2 },
  { hour: 10, label: "Photo", detail: "WhatsApp", icon: Camera, rotation: -2 },
  { hour: 11, label: "Call", detail: "scattered PDF notes", icon: Phone, rotation: 3 },
  { hour: 12.5, label: "Urgent email", detail: "lost in inbox", icon: FileText, rotation: 1 },
  { hour: 13.5, label: "Crisis case", detail: "no documentation", icon: AlertTriangle, rotation: -3 },
  { hour: 15, label: "Meeting", detail: "different tool", icon: Users, rotation: 2 },
  { hour: 18, label: "Report", detail: "written from memory", icon: FileText, rotation: -2 },
];

// Vision events
const visionEvents = [
  { hour: 9, label: "Home visit", detail: "auto-captured", icon: Mic },
  { hour: 11, label: "Photo/PDF", detail: "auto-processed", icon: Camera },
  { hour: 13, label: "Risks", detail: "AI-detected", icon: AlertTriangle },
  { hour: 15, label: "Tasks", detail: "AI-suggested", icon: CheckCircle },
  { hour: 17, label: "Report", detail: "pre-filled", icon: FileCheck },
];

const getPosition = (hour: number) => ((hour - 8) / 10) * 100;

// Problem Event Component
const ProblemEvent = ({ 
  event, 
  index,
  isHighlighted = false
}: { 
  event: typeof problemEvents[0]; 
  index: number;
  isHighlighted?: boolean;
}) => {
  const isAbove = index % 2 === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: isAbove ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.4, duration: 0.6, ease: "easeOut" }}
      className="absolute flex flex-col items-center"
      style={{ 
        left: `${getPosition(event.hour)}%`,
        top: '50%',
        transform: 'translateX(-50%)'
      }}
    >
      {/* Vertical marker line */}
      <motion.div 
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5 + index * 0.4, duration: 0.3 }}
        className={`absolute ${isAbove ? 'bottom-0 origin-bottom' : 'top-0 origin-top'}`}
        style={{ 
          width: isHighlighted ? '4px' : '2.5px',
          height: isHighlighted ? 'clamp(28px, 4vmin, 48px)' : 'clamp(24px, 3.2vmin, 40px)',
          backgroundColor: isHighlighted ? PITCH_COLORS.accent : `${PITCH_COLORS.accent}70`
        }}
      />
      
      {/* Sticky note - Tighter Spacing */}
      <motion.div 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 + index * 0.4, duration: 0.4 }}
        className={`absolute ${isAbove ? 'bottom-[clamp(30px,4.2vmin,54px)]' : 'top-[clamp(30px,4.2vmin,54px)]'}`}
        style={{ transform: `rotate(${event.rotation}deg)` }}
      >
        <div 
          className="shadow-lg rounded-sm"
          style={{
            padding: isHighlighted 
              ? 'clamp(12px, 1.4vmin, 24px) clamp(16px, 1.9vmin, 32px)' 
              : 'clamp(10px, 1.2vmin, 18px) clamp(14px, 1.6vmin, 24px)',
            minWidth: isHighlighted ? 'clamp(120px, 11vmin, 200px)' : 'clamp(100px, 9vmin, 170px)',
            backgroundColor: isHighlighted ? PITCH_COLORS.accent : '#FFFBEB',
            border: isHighlighted ? `3px solid ${PITCH_COLORS.accentDark}` : '2px solid #FDE68A',
            boxShadow: isHighlighted ? `0 8px 24px ${PITCH_COLORS.accent}66` : undefined
          }}
        >
          <div className="flex items-center" style={{ gap: 'clamp(6px, 0.7vmin, 12px)', marginBottom: 'clamp(3px, 0.4vmin, 6px)' }}>
            <event.icon 
              style={{ 
                width: isHighlighted ? 'clamp(18px, 1.8vmin, 28px)' : 'clamp(14px, 1.4vmin, 22px)', 
                height: isHighlighted ? 'clamp(18px, 1.8vmin, 28px)' : 'clamp(14px, 1.4vmin, 22px)',
                color: isHighlighted ? '#FFFFFF' : PITCH_COLORS.accent,
              }} 
              strokeWidth={2.5}
            />
            <span 
              className="font-bold"
              style={{ 
                fontSize: isHighlighted ? 'clamp(18px, 1.7vmin, 26px)' : 'clamp(16px, 1.5vmin, 22px)', 
                color: isHighlighted ? '#FFFFFF' : PITCH_COLORS.heading,
                fontWeight: 700,
              }}
            >
              {event.label}
            </span>
          </div>
          <span 
            className="font-bold"
            style={{ 
              fontSize: isHighlighted ? 'clamp(16px, 1.5vmin, 22px)' : 'clamp(14px, 1.3vmin, 20px)', 
              color: isHighlighted ? '#FFFFFF' : PITCH_COLORS.body,
              fontWeight: 600,
            }}
          >
            {event.detail}
          </span>
        </div>
      </motion.div>

      {/* Dot on timeline */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 + index * 0.4, duration: 0.3 }}
        className="rounded-full border-2 border-white shadow-sm"
        style={{ 
          width: isHighlighted ? 'clamp(12px, 1.2vmin, 20px)' : 'clamp(8px, 0.8vmin, 14px)',
          height: isHighlighted ? 'clamp(12px, 1.2vmin, 20px)' : 'clamp(8px, 0.8vmin, 14px)',
          backgroundColor: PITCH_COLORS.accent,
        }}
      />
    </motion.div>
  );
};

// Vision Event Component
const VisionEvent = ({ 
  event, 
  index,
  isActive = false
}: { 
  event: typeof visionEvents[0]; 
  index: number;
  isActive?: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.4, duration: 0.6, ease: "easeOut" }}
      className="absolute flex flex-col items-center"
      style={{ 
        left: `${getPosition(event.hour)}%`,
        top: '50%',
        transform: 'translateX(-50%)'
      }}
    >
      {/* Vertical connector */}
      <motion.div 
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.5 + index * 0.4, duration: 0.3 }}
        className="absolute bottom-0 origin-bottom"
        style={{ width: '3px', height: 'clamp(28px, 4vmin, 52px)', backgroundColor: `${PITCH_COLORS.accent}60` }}
      />
      
      {/* Icon bubble - BEAMER-OPTIMIZED, closer to timeline */}
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 + index * 0.4, duration: 0.4 }}
        className="absolute rounded-full flex items-center justify-center shadow-md"
        style={{ 
          bottom: 'clamp(32px, 4.5vmin, 60px)',
          width: 'clamp(48px, 5.5vmin, 88px)',
          height: 'clamp(48px, 5.5vmin, 88px)',
          backgroundColor: isActive ? PITCH_COLORS.accent : `${PITCH_COLORS.accent}20`,
          border: `3px solid ${PITCH_COLORS.accent}`
        }}
      >
        <event.icon 
          style={{ 
            width: 'clamp(24px, 2.8vmin, 44px)', 
            height: 'clamp(24px, 2.8vmin, 44px)',
            color: isActive ? '#FFFFFF' : PITCH_COLORS.accent,
          }}
          strokeWidth={2.5}
        />
      </motion.div>
      
      {/* Label above bubble - BEAMER-OPTIMIZED, reduced distance */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 + index * 0.4, duration: 0.4 }}
        className="absolute text-center whitespace-nowrap"
        style={{ bottom: 'clamp(72px, 10vmin, 130px)' }}
      >
        <span 
          className="font-bold block"
          style={{ fontSize: 'clamp(20px, 1.8vmin, 28px)', color: PITCH_COLORS.heading, fontWeight: 700 }}
        >
          {event.label}
        </span>
        <span 
          className="font-bold"
          style={{ fontSize: 'clamp(18px, 1.6vmin, 24px)', color: PITCH_COLORS.accent, fontWeight: 700 }}
        >
          {event.detail}
        </span>
      </motion.div>

      {/* Dot on timeline */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4 + index * 0.4, duration: 0.3 }}
        className="rounded-full"
        style={{ 
          width: 'clamp(10px, 1vmin, 18px)',
          height: 'clamp(10px, 1vmin, 18px)',
          backgroundColor: PITCH_COLORS.accent,
        }}
      />
    </motion.div>
  );
};

// Without Carelo Slide
export const DayWithoutCareloSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full h-full">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="The Problem" 
            title="A Day in the Life"
            badgeVariant="problem"
          />
        </motion.div>

        {/* Timeline Container - Viewport-Optimized */}
        <div 
          className="relative w-full"
          style={{ 
            maxWidth: '88%',
            height: 'clamp(220px, 32vh, 380px)',
            marginTop: 'clamp(28px, 4vh, 56px)',
            marginBottom: 'clamp(24px, 3.5vh, 48px)',
          }}
        >
          {/* Time axis */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-1.5 rounded-full origin-left"
              style={{ backgroundColor: `${PITCH_COLORS.heading}25` }}
            />
            
            {/* Hour markers */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {timelineHours.map((hour, i) => (
                <motion.div
                  key={hour}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${getPosition(hour)}%`, transform: 'translateX(-50%)' }}
                >
                  <div 
                    className="rounded-full"
                    style={{ 
                      width: 'clamp(5px, 0.5vmin, 8px)', 
                      height: 'clamp(5px, 0.5vmin, 8px)',
                      backgroundColor: PITCH_COLORS.muted, 
                      marginBottom: 'clamp(12px, 2vmin, 28px)',
                    }} 
                  />
                  <span 
                    className="font-bold font-mono" 
                    style={{ fontSize: 'clamp(14px, 1.3vmin, 20px)', color: PITCH_COLORS.muted, fontWeight: 700 }}
                  >
                    {hour}:00
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Events */}
          {problemEvents.map((event, i) => (
            <ProblemEvent key={i} event={event} index={i} isHighlighted={i === problemEvents.length - 1} />
          ))}
        </div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="flex-shrink-0"
        >
          <div 
            className="inline-flex items-center rounded-xl border-2"
            style={{ 
              padding: 'clamp(10px, 1.2vmin, 20px) clamp(18px, 2vmin, 36px)',
              gap: 'clamp(10px, 1.2vmin, 20px)',
              backgroundColor: `${PITCH_COLORS.accent}12`,
              borderColor: `${PITCH_COLORS.accent}50`,
            }}
          >
            <AlertTriangle style={{ width: 'clamp(20px, 2vmin, 32px)', height: 'clamp(20px, 2vmin, 32px)', color: PITCH_COLORS.accent }} strokeWidth={2.5} />
            <span 
              className="font-bold" 
              style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}
            >
              Details get lost. Mental load rises.
            </span>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

// Vision Slide
export const DayWithCareloSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full h-full">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PitchHeaderBlock 
            badge="The Vision" 
            title="When documentation works for you."
            badgeVariant="solution"
          />
        </motion.div>

        {/* Timeline Container - CENTERED with proper spacing */}
        <div 
          className="relative w-full"
          style={{ 
            maxWidth: '90%',
            height: 'clamp(280px, 40vh, 480px)',
            marginTop: 'clamp(40px, 6vh, 80px)',
            marginBottom: 'clamp(32px, 5vh, 64px)',
          }}
        >
          {/* Time axis */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
            <div className="h-1.5 rounded-full" style={{ backgroundColor: `${PITCH_COLORS.accent}25` }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: `${PITCH_COLORS.accent}B3` }}
              />
            </div>
            
            {/* Hour markers */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {timelineHours.map((hour, i) => (
                <motion.div
                  key={hour}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${getPosition(hour)}%`, transform: 'translateX(-50%)' }}
                >
                  <div 
                    className="rounded-full"
                    style={{ 
                      width: 'clamp(6px, 0.6vmin, 10px)', 
                      height: 'clamp(6px, 0.6vmin, 10px)',
                      backgroundColor: PITCH_COLORS.accent, 
                      marginBottom: 'clamp(16px, 2.5vmin, 36px)',
                    }} 
                  />
                  <span 
                    className="font-bold font-mono" 
                    style={{ fontSize: 'clamp(16px, 1.5vmin, 24px)', color: PITCH_COLORS.accent, fontWeight: 700 }}
                  >
                    {hour}:00
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Events */}
          {visionEvents.map((event, i) => (
            <VisionEvent key={i} event={event} index={i} isActive={i === visionEvents.length - 1} />
          ))}
        </div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="flex-shrink-0"
        >
          <div 
            className="inline-flex items-center rounded-xl border-2"
            style={{ 
              padding: 'clamp(10px, 1.2vmin, 20px) clamp(18px, 2vmin, 36px)',
              gap: 'clamp(10px, 1.2vmin, 20px)',
              backgroundColor: `${PITCH_COLORS.accent}08`,
              borderColor: `${PITCH_COLORS.accent}30`,
            }}
          >
            <FileCheck style={{ width: 'clamp(20px, 2vmin, 32px)', height: 'clamp(20px, 2vmin, 32px)', color: PITCH_COLORS.accent }} strokeWidth={2.5} />
            <span 
              className="font-bold" 
              style={{ fontSize: FONT_SIZES.bodyM, color: PITCH_COLORS.accent }}
            >
              Focus on people, not paperwork.
            </span>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};
