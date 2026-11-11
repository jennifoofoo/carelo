import { motion } from "framer-motion";
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from "./PitchSlideWrapper";

const waves = [
  { year: "2025", label: "Documentation", highlight: true },
  { year: "2026", label: "Knowledge Management", highlight: false },
  { year: "2026", label: "AI Assistants", highlight: false },
  { year: "2027", label: "Chatbots", highlight: false },
  { year: "2027", label: "Predictive Analytics", highlight: false },
];

export const WhyNowSlide = () => (
  <PitchSlideWrapper>
    <div className="flex flex-col items-center w-full flex-1 px-4 sm:px-6 lg:px-8">
      {/* Unified Header Block */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-6xl"
      >
        <PitchHeaderBlock 
          badge="Why Now" 
          title={<>AI adoption in youth welfare is accelerating <span style={{ color: PITCH_COLORS.accent }}>and documentation is the first wave.</span></>}
        />
      </motion.div>

      {/* Credibility Line */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-semibold italic text-center text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 lg:mb-10"
        style={{ 
          color: PITCH_COLORS.body,
        }}
      >
        (Based on IKJ's 2025–2027 AI roadmap for youth welfare)
      </motion.p>

      {/* Timeline */}
      <div 
        className="relative w-full max-w-6xl flex-1 flex items-center justify-center px-2 sm:px-4"
      >
        {/* Timeline line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute left-0 right-0 h-[2px] sm:h-[3px] rounded-full origin-left top-12 sm:top-16 lg:top-20"
          style={{ 
            backgroundColor: `${PITCH_COLORS.heading}20` 
          }}
        />

        {/* Year markers */}
        <div className="flex justify-between items-start w-full">
          {waves.map((wave, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
              className="flex flex-col items-center text-center px-1"
              style={{ width: `${100 / waves.length}%` }}
            >
              {/* Label above */}
              <div 
                className="flex flex-col justify-end h-8 sm:h-10 lg:h-12 mb-2 sm:mb-3 lg:mb-4"
              >
                <span 
                  className="font-semibold leading-tight text-xs sm:text-sm lg:text-base"
                  style={{ 
                    color: wave.highlight ? PITCH_COLORS.accent : `${PITCH_COLORS.heading}40` 
                  }}
                >
                  {wave.label}
                </span>
              </div>

              {/* Dot on timeline */}
              <div 
                className="rounded-full w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5"
                style={{ 
                  backgroundColor: wave.highlight ? PITCH_COLORS.accent : 'white',
                  borderColor: wave.highlight ? PITCH_COLORS.accent : `${PITCH_COLORS.heading}30`,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                }}
              />

              {/* Year below */}
              <span 
                className="font-mono font-semibold text-xs sm:text-sm lg:text-base mt-2 sm:mt-3 lg:mt-4"
                style={{ 
                  color: wave.highlight ? PITCH_COLORS.accent : `${PITCH_COLORS.heading}40` 
                }}
              >
                {wave.year}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Arrow at end */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute -right-4 sm:-right-6 top-11 sm:top-15 lg:top-19"
        >
          <svg className="w-4 h-3 sm:w-5 sm:h-3.5 lg:w-6 lg:h-4" viewBox="0 0 20 12" fill="none" style={{ color: `${PITCH_COLORS.heading}20` }}>
            <path d="M1 6H19M19 6L14 1M19 6L14 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </div>

      {/* Bottom text */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="font-semibold text-center text-sm sm:text-base lg:text-lg max-w-full sm:max-w-5xl mt-6 sm:mt-8 lg:mt-10 px-4"
        style={{ color: PITCH_COLORS.heading }}
      >
        Youth welfare organizations are actively requesting AI tools for documentation — <span style={{ color: PITCH_COLORS.accent }}>this is where digital adoption starts.</span>
      </motion.p>
    </div>
  </PitchSlideWrapper>
);