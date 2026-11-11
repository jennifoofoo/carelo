import { motion } from "framer-motion";
import { Mic, Sparkles, FileText, CheckCircle, ArrowRight, Shield } from "lucide-react";
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from "./PitchSlideWrapper";

const features = [
  {
    icon: Mic,
    title: "Capture",
    description: "Voice notes become structured case data — zero information lost.",
  },
  {
    icon: Sparkles,
    title: "Understand",
    description: "AI identifies risks, people, timelines, and §8a SGB VIII mandates.",
  },
  {
    icon: FileText,
    title: "Generate",
    description: "Case notes, reports, and protection plans generated instantly.",
  },
  {
    icon: CheckCircle,
    title: "Manage",
    description: "Follow-ups auto-created from legal requirements — never miss a task.",
  },
];

export const BeforeAfterSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-7xl"
        >
          <PitchHeaderBlock 
            badge="The Solution" 
            title={<>The first end-to-end workflow system <span style={{ color: PITCH_COLORS.accent }}>built for youth welfare.</span></>}
            badgeVariant="solution"
          />
        </motion.div>

        {/* Feature Blocks - Fully Responsive */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch w-full max-w-7xl gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center"
            >
              {/* Feature Card */}
              <div 
                className="flex-1 bg-white border-2 h-full flex flex-col items-center text-center shadow-md rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8"
                style={{
                  borderColor: '#CCCCCC',
                }}
              >
                {/* Icon */}
                <div 
                  className="rounded-lg sm:rounded-xl flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mb-4 sm:mb-5 lg:mb-6"
                  style={{
                    backgroundColor: `${PITCH_COLORS.accent}18`,
                    border: `2px solid ${PITCH_COLORS.accent}40`,
                  }}
                >
                  <feature.icon 
                    className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
                    style={{ 
                      color: PITCH_COLORS.accent,
                    }} 
                    strokeWidth={2}
                  />
                </div>
                
                {/* Title - BOLD, large */}
                <h3 
                  className="font-bold text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3"
                  style={{ 
                    color: PITCH_COLORS.heading,
                  }}
                >
                  {feature.title}
                </h3>
                
                {/* Description - SEMI-BOLD, high contrast */}
                <p 
                  className="font-semibold leading-[1.4] text-center text-sm sm:text-base lg:text-lg"
                  style={{ 
                    color: PITCH_COLORS.body,
                  }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Arrow between cards */}
              {i < features.length - 1 && (
                <div 
                  className="hidden lg:flex items-center justify-center flex-shrink-0 w-8 lg:w-10"
                >
                  <ArrowRight 
                    className="w-6 h-6 lg:w-8 lg:h-8"
                    style={{ 
                      color: PITCH_COLORS.muted,
                    }} 
                    strokeWidth={2.5}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Compliance Footer - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center mt-6 sm:mt-8"
        >
          <div 
            className="flex items-center rounded-full border-2 gap-2 sm:gap-3 lg:gap-4 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4"
            style={{
              backgroundColor: `${PITCH_COLORS.heading}08`,
              borderColor: `${PITCH_COLORS.heading}20`,
            }}
          >
            <Shield 
              className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0"
              style={{ 
                color: PITCH_COLORS.muted,
              }}
              strokeWidth={2}
            />
            <span 
              className="font-semibold text-xs sm:text-sm lg:text-base"
              style={{ 
                color: PITCH_COLORS.muted,
              }}
            >
              Art. 9 DSGVO compliant · EU-hosted · Zero data retention
            </span>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};