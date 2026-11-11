import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building2, Globe, ArrowRight } from 'lucide-react';
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from './PitchSlideWrapper';

const MarketExpansionSlide = () => {
  const steps = [
    {
      step: "Step 1",
      title: "Munich & Bavaria",
      icon: MapPin,
      points: [
        "Founders based in Bavaria → easy lighthouse access",
        "Strong local network for first pilots"
      ],
      metric: "2024-2025"
    },
    {
      step: "Step 2",
      title: "Rest of Germany",
      icon: Building2,
      points: [
        "Same needs across institutions nationwide",
        "Germany = largest youth welfare market in Europe"
      ],
      metric: "2025-2026"
    },
    {
      step: "Step 3",
      title: "EU Expansion",
      icon: Globe,
      points: [
        "Many EU institutions working with German-speaking youth",
        "Highest documentation burden in EU → strong pull"
      ],
      metric: "2027+"
    }
  ];

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
            badge="Appendix" 
            title="Geographic Expansion Strategy"
            badgeVariant="appendix"
          />
        </motion.div>

        {/* Subtitle - Responsive */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-semibold text-center text-base sm:text-lg lg:text-xl mb-6 sm:mb-8"
          style={{ 
            color: PITCH_COLORS.body,
          }}
        >
          From Bavaria → Germany → EU.
        </motion.p>

        {/* Step Cards - Fully Responsive */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 items-stretch w-full max-w-7xl gap-4 sm:gap-6 lg:gap-8"
        >
          {steps.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.15 }}
              className="relative bg-white border shadow-sm flex flex-col rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8"
              style={{ 
                borderColor: '#E5E5E5',
              }}
            >
              {/* Step badge */}
              <div 
                className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4"
              >
                <span 
                  className="rounded-full font-black uppercase tracking-wider text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                  style={{ 
                    backgroundColor: PITCH_COLORS.accent,
                  }}
                >
                  {item.step}
                </span>
                <span 
                  className="font-semibold text-sm sm:text-base"
                  style={{ 
                    color: PITCH_COLORS.body,
                  }}
                >
                  {item.metric}
                </span>
              </div>

              {/* Icon and Title */}
              <div 
                className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 lg:mb-6"
              >
                <div 
                  className="rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16"
                  style={{ 
                    backgroundColor: `${PITCH_COLORS.accent}15`,
                  }}
                >
                  <item.icon 
                    className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
                    style={{ 
                      color: PITCH_COLORS.accent,
                    }} 
                    strokeWidth={1.8} 
                  />
                </div>
                <h3 
                  className="font-bold text-lg sm:text-xl lg:text-2xl"
                  style={{ 
                    color: PITCH_COLORS.heading,
                  }}
                >
                  {item.title}
                </h3>
              </div>
              
              {/* Points */}
              <div 
                className="flex-1 flex flex-col gap-2 sm:gap-3"
              >
                {item.points.map((point, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-2 sm:gap-3"
                  >
                    <div 
                      className="rounded-full flex-shrink-0 w-2 h-2 mt-2 sm:mt-2.5"
                      style={{ 
                        backgroundColor: PITCH_COLORS.accent,
                      }}
                    />
                    <span 
                      className="font-semibold leading-relaxed text-sm sm:text-base lg:text-lg"
                      style={{ 
                        color: PITCH_COLORS.body,
                      }}
                    >
                      {point}
                    </span>
                  </div>
                ))}
              </div>

              {/* Arrow to next step - desktop only */}
              {index < steps.length - 1 && (
                <div 
                  className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10"
                >
                  <div 
                    className="rounded-full bg-white border shadow-sm flex items-center justify-center w-8 h-8"
                    style={{ 
                      borderColor: '#E5E5E5',
                    }}
                  >
                    <ArrowRight 
                      className="w-4 h-4"
                      style={{ 
                        color: PITCH_COLORS.accent,
                      }} 
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </PitchSlideWrapper>
  );
};

export default MarketExpansionSlide;