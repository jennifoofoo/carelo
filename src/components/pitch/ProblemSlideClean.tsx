import { motion } from "framer-motion";
import { Clock, Users, LayoutGrid, AlertTriangle } from "lucide-react";
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from "./PitchSlideWrapper";

const problemColumns = [
  {
    icon: Clock,
    title: "Wrong timing",
    bullets: [
      "Written hours later",
      "Details already gone",
      "Memory replaces facts"
    ],
  },
  {
    icon: Users,
    title: "Wrong audience",
    bullets: [
      "Same note rewritten",
      "Different versions circulate",
      "No single source of truth"
    ],
  },
  {
    icon: LayoutGrid,
    title: "Wrong systems",
    bullets: [
      "Files everywhere",
      "No shared timeline",
      "Signals never connect"
    ],
  }
];

export const ProblemSlideClean = () => {
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
            badge="The Problem" 
            title={<>Documentation breaks. <span style={{ color: PITCH_COLORS.accent }}>Risks go unnoticed.</span></>}
            badgeVariant="problem"
          />
        </motion.div>

        {/* THREE CARDS - Reduced Padding, Tighter Spacing */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl gap-4 sm:gap-5 lg:gap-6"
          style={{ marginBottom: PITCH_SPACING.contentGap }}
        >
          {problemColumns.map((col, index) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="flex flex-col items-center rounded-xl"
              style={{ 
                padding: 'clamp(20px, 2.5vh, 32px) clamp(18px, 2.2vw, 28px)',
                backgroundColor: '#FAFAFA',
                border: '2px solid #E5E5E5',
              }}
            >
              {/* Icon - Smaller, Secondary */}
              <div 
                className="rounded-full flex items-center justify-center"
                style={{ 
                  width: 'clamp(48px, 6vmin, 72px)',
                  height: 'clamp(48px, 6vmin, 72px)',
                  backgroundColor: PITCH_COLORS.accent,
                  marginBottom: 'clamp(14px, 1.8vh, 24px)',
                }}
              >
                <col.icon 
                  style={{ 
                    width: 'clamp(24px, 3vmin, 36px)', 
                    height: 'clamp(24px, 3vmin, 36px)',
                    color: 'white',
                  }} 
                  strokeWidth={2.5} 
                />
              </div>

              {/* Title */}
              <h3 
                className="font-black text-center"
                style={{ 
                  fontSize: FONT_SIZES.h3,
                  color: PITCH_COLORS.heading, 
                  marginBottom: 'clamp(12px, 1.5vh, 20px)',
                  fontWeight: 900,
                }}
              >
                {col.title}
              </h3>

              {/* Bullets - Clean and Focused */}
              <ul 
                className="flex flex-col text-center"
                style={{ gap: 'clamp(8px, 1vh, 14px)' }}
              >
                {col.bullets.map((bullet, i) => (
                  <li 
                    key={i} 
                    className="font-semibold"
                    style={{ 
                      fontSize: FONT_SIZES.bodyM,
                      color: PITCH_COLORS.body, 
                      lineHeight: 1.4,
                      fontWeight: 600,
                    }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Statement - Unified Capsule Design */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
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
            <AlertTriangle 
              style={{ 
                width: 'clamp(20px, 2vmin, 32px)', 
                height: 'clamp(20px, 2vmin, 32px)', 
                color: PITCH_COLORS.accent,
                flexShrink: 0,
              }} 
              strokeWidth={2.5} 
            />
            <span 
              className="font-bold" 
              style={{ 
                fontSize: FONT_SIZES.bodyM,
                color: PITCH_COLORS.accent,
                fontWeight: 700,
              }}
            >
              50% of working time goes into paperwork. Not into care.
            </span>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};
