import React from "react";
import { motion } from "framer-motion";
import { Check, X, Circle } from "lucide-react";
import { PitchSlideWrapper, PitchHeaderBlock, PitchCaption, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from "./PitchSlideWrapper";

type SupportLevel = 'full' | 'partial' | 'none';

interface CompetitorData {
  name: string;
  features: Record<string, SupportLevel>;
}

const features = [
  { id: 'documentation', short: 'Docs' },
  { id: 'ai_writing', short: 'AI Assist' },
  { id: 'voice_notes', short: 'Voice' },
  { id: 'timeline', short: 'Timeline' },
  { id: 'risk_trends', short: 'Risk' },
  { id: 'help_plan', short: 'Help Plan' },
  { id: 'mobile', short: 'Mobile' },
];

const competitors: CompetitorData[] = [
  { name: 'Carelo', features: { documentation: 'full', ai_writing: 'full', voice_notes: 'full', timeline: 'full', risk_trends: 'full', help_plan: 'full', mobile: 'full' }},
  { name: 'Vivendi / CGM', features: { documentation: 'full', ai_writing: 'none', voice_notes: 'none', timeline: 'partial', risk_trends: 'none', help_plan: 'partial', mobile: 'partial' }},
  { name: 'Tau-Office', features: { documentation: 'full', ai_writing: 'none', voice_notes: 'none', timeline: 'partial', risk_trends: 'none', help_plan: 'partial', mobile: 'none' }},
  { name: 'SODISYS', features: { documentation: 'full', ai_writing: 'none', voice_notes: 'none', timeline: 'none', risk_trends: 'none', help_plan: 'partial', mobile: 'partial' }},
  { name: 'SoFa', features: { documentation: 'full', ai_writing: 'none', voice_notes: 'none', timeline: 'none', risk_trends: 'none', help_plan: 'partial', mobile: 'none' }},
  { name: 'Kodoku', features: { documentation: 'full', ai_writing: 'partial', voice_notes: 'none', timeline: 'partial', risk_trends: 'none', help_plan: 'none', mobile: 'full' }},
  { name: 'SoKI', features: { documentation: 'full', ai_writing: 'partial', voice_notes: 'partial', timeline: 'none', risk_trends: 'none', help_plan: 'none', mobile: 'partial' }},
  { name: 'CareMates', features: { documentation: 'full', ai_writing: 'none', voice_notes: 'none', timeline: 'full', risk_trends: 'none', help_plan: 'none', mobile: 'full' }},
];

const FeatureCell = ({ level, isCarelo }: { level: SupportLevel; isCarelo: boolean }) => {
  if (level === 'full') {
    return (
      <div 
        className={`flex items-center justify-center rounded-md sm:rounded-lg w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 ${isCarelo ? 'bg-[#F26A2E]' : 'bg-[#F26A2E]/80'}`}
      >
        <Check className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (level === 'partial') {
    return (
      <div 
        className="flex items-center justify-center rounded-md sm:rounded-lg bg-[#FCD34D]/40 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
      >
        <Circle className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-[#B45309]" fill="currentColor" />
      </div>
    );
  }
  return (
    <div 
      className="flex items-center justify-center rounded-md sm:rounded-lg bg-[#FECACA] w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
    >
      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-[#DC2626]" strokeWidth={3} />
    </div>
  );
};

export const CompetitorHeatmapSlide = () => {
  return (
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
            badge="Appendix" 
            title="Competitor Analysis"
            badgeVariant="appendix"
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center text-base sm:text-lg lg:text-xl mb-4 sm:mb-6 lg:mb-8"
          style={{ 
            color: PITCH_COLORS.body,
          }}
        >
          AI-first Documentation Capabilities
        </motion.p>

        {/* Matrix - Responsive with horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full overflow-x-auto flex-1 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div className="min-w-max inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th 
                    className="sticky left-0 z-10 text-left font-bold border-b-2 text-xs sm:text-sm lg:text-base px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3"
                    style={{ 
                      color: PITCH_COLORS.heading,
                      backgroundColor: PITCH_COLORS.background,
                      borderColor: PITCH_COLORS.muted,
                      minWidth: '100px',
                    }}
                  >
                    Software
                  </th>
                  {features.map((feature) => (
                    <th 
                      key={feature.id}
                      className="text-center font-semibold border-b-2 text-xs sm:text-sm lg:text-base px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3"
                      style={{ 
                        color: PITCH_COLORS.body,
                        borderColor: PITCH_COLORS.muted,
                        minWidth: '60px',
                      }}
                    >
                      {feature.short}
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {competitors.map((competitor, rowIdx) => {
                  const isCarelo = competitor.name === 'Carelo';
                  return (
                    <tr 
                      key={competitor.name}
                      className={`${isCarelo ? 'border-l-2 sm:border-l-4' : ''}`}
                      style={{
                        backgroundColor: isCarelo ? `${PITCH_COLORS.accent}12` : rowIdx % 2 === 0 ? 'white' : '#F8F9FA',
                        borderLeftColor: isCarelo ? PITCH_COLORS.accent : undefined,
                      }}
                    >
                      <td 
                        className="sticky left-0 z-10 font-bold border-b text-xs sm:text-sm lg:text-base px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3"
                        style={{ 
                          color: isCarelo ? PITCH_COLORS.accent : PITCH_COLORS.heading,
                          backgroundColor: isCarelo ? `${PITCH_COLORS.accent}12` : 'inherit',
                          borderColor: '#E5E7EB',
                        }}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                          <span className="whitespace-nowrap">{competitor.name}</span>
                          {isCarelo && (
                            <span 
                              className="font-black uppercase tracking-wider text-white rounded text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1"
                              style={{ 
                                backgroundColor: PITCH_COLORS.accent,
                              }}
                            >
                              Ours
                            </span>
                          )}
                        </div>
                      </td>
                      {features.map((feature) => (
                        <td 
                          key={feature.id}
                          className="border-b px-2 py-2 sm:px-3 sm:py-2.5 lg:px-4 lg:py-3"
                          style={{ borderColor: '#E5E7EB' }}
                        >
                          <div className="flex justify-center">
                            <FeatureCell level={competitor.features[feature.id]} isCarelo={isCarelo} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Legend - Responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6 lg:mt-8"
        >
          {[
            { level: 'full', label: 'Full', bg: PITCH_COLORS.accent, Icon: Check, iconColor: 'white' },
            { level: 'partial', label: 'Partial', bg: '#FCD34D60', Icon: Circle, iconColor: '#B45309', fill: true },
            { level: 'none', label: 'None', bg: '#FECACA', Icon: X, iconColor: '#DC2626' },
          ].map((item) => (
            <div key={item.level} className="flex items-center gap-2 sm:gap-3">
              <div 
                className="rounded-md sm:rounded-lg flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                style={{ backgroundColor: item.bg }}
              >
                <item.Icon 
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                  style={{ color: item.iconColor }}
                  strokeWidth={3}
                  fill={item.fill ? 'currentColor' : 'none'}
                />
              </div>
              <span className="font-semibold text-sm sm:text-base lg:text-lg" style={{ color: PITCH_COLORS.body }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
        
        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }} 
          className="text-center mt-3 sm:mt-4 lg:mt-6 px-4"
        >
          <p className="text-xs sm:text-sm lg:text-base font-medium" style={{ color: PITCH_COLORS.muted }}>
            Legacy tools focus on administration — CareLo focuses on <span style={{ color: PITCH_COLORS.accent, fontWeight: 800 }}>intelligence</span>.
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

export default CompetitorHeatmapSlide;