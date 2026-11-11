import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PitchSlideWrapper, PitchHeaderBlock, PitchCaption, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from './PitchSlideWrapper';

const Feature = ({ text }: { text: string }) => (
  <div 
    className="flex items-center gap-2 sm:gap-3"
  >
    <Check 
      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 flex-shrink-0"
      style={{ 
        color: PITCH_COLORS.accent,
      }} 
      strokeWidth={3} 
    />
    <span 
      className="font-semibold text-sm sm:text-base lg:text-lg"
      style={{ 
        color: PITCH_COLORS.heading,
      }}
    >
      {text}
    </span>
  </div>
);

const BusinessModelSlide = () => {
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
            badge="Business Model" 
            title="Pricing that matches how agencies buy."
          />
        </motion.div>

        {/* Pricing Cards - Fully Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 w-full max-w-6xl gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12"
        >
          {/* Basic Plan */}
          <div 
            className="bg-white border-2 shadow-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col"
            style={{
              borderColor: '#CCCCCC',
            }}
          >
            <div className="mb-4 sm:mb-5 lg:mb-6">
              <h3 
                className="font-bold text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{ 
                  color: PITCH_COLORS.heading,
                }}
              >
                Carelo Basic
              </h3>
              <p 
                className="font-semibold text-sm sm:text-base lg:text-lg"
                style={{ 
                  color: PITCH_COLORS.body,
                }}
              >
                For documentation and help-plan creation only
              </p>
            </div>
            
            <div className="mb-4 sm:mb-5 lg:mb-6">
              <span 
                className="font-black text-4xl sm:text-5xl lg:text-6xl"
                style={{ 
                  color: PITCH_COLORS.accent,
                }}
              >
                €120
              </span>
              <span 
                className="font-semibold ml-2 text-base sm:text-lg lg:text-xl"
                style={{ 
                  color: PITCH_COLORS.muted,
                }}
              >
                / user / year
              </span>
            </div>

            <div className="mb-4 sm:mb-5 lg:mb-6 flex-grow">
              <div className="space-y-2 sm:space-y-3">
                <Feature text="Documentation & help-plan generation" />
                <Feature text="Case overview" />
                <Feature text="Secure file storage" />
              </div>
            </div>

            <p 
              className="font-semibold italic text-sm sm:text-base lg:text-lg mt-auto"
              style={{ 
                color: PITCH_COLORS.body,
              }}
            >
              Perfect for small teams or new institutions.
            </p>
          </div>

          {/* Pro Plan */}
          <div 
            className="relative border-2 shadow-lg rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col"
            style={{
              backgroundColor: '#FDF8F5',
              borderColor: PITCH_COLORS.accent,
            }}
          >
            {/* RECOMMENDED Badge - positioned OUTSIDE the card flow */}
            <div 
              className="absolute -top-3 right-4 sm:right-6 lg:right-8 z-10"
            >
              <span 
                className="font-black uppercase tracking-wider text-white rounded-full shadow-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm inline-block"
                style={{ 
                  backgroundColor: PITCH_COLORS.accent,
                }}
              >
                Recommended
              </span>
            </div>

            <div className="mb-4 sm:mb-5 lg:mb-6">
              <h3 
                className="font-bold text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{ 
                  color: PITCH_COLORS.heading,
                }}
              >
                Carelo Pro
              </h3>
              <p 
                className="font-semibold text-sm sm:text-base lg:text-lg"
                style={{ 
                  color: PITCH_COLORS.body,
                }}
              >
                Full functionality for institutions managing multiple teams
              </p>
            </div>
            
            <div className="mb-4 sm:mb-5 lg:mb-6">
              <span 
                className="font-black text-4xl sm:text-5xl lg:text-6xl"
                style={{ 
                  color: PITCH_COLORS.accent,
                }}
              >
                €150
              </span>
              <span 
                className="font-semibold ml-2 text-base sm:text-lg lg:text-xl"
                style={{ 
                  color: PITCH_COLORS.body,
                }}
              >
                / user / year
              </span>
            </div>

            <div className="mb-4 sm:mb-5 lg:mb-6 flex-grow">
              <div className="space-y-2 sm:space-y-3">
                <Feature text="All basic features +" />
                <Feature text="Scheduling & workload tracking" />
                <Feature text="Analytics & reporting dashboards" />
                <Feature text="Compliance & risk modules" />
              </div>
            </div>

            <p 
              className="font-semibold italic text-sm sm:text-base lg:text-lg mt-auto"
              style={{ 
                color: PITCH_COLORS.body,
              }}
            >
              Designed for medium to large agencies.
            </p>
          </div>
        </motion.div>
        
        {/* Bottom calculation note - centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-auto text-center w-full max-w-4xl pt-4 sm:pt-6 lg:pt-8"
        >
          <p 
            className="font-semibold text-xs sm:text-sm lg:text-base"
            style={{ 
              color: PITCH_COLORS.muted,
            }}
          >
            Based on 1-2.5 hrs documentation × 25% time savings × 5% value capture
          </p>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

export default BusinessModelSlide;
