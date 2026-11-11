import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING, FONT_SIZES } from "./PitchSlideWrapper";

// Icons for segments
const YouthWelfareIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#FF6B35" opacity="0.1"/>
    <path d="M24 12C19.6 12 16 15.6 16 20C16 24.4 24 36 24 36C24 36 32 24.4 32 20C32 15.6 28.4 12 24 12Z" fill="#FF6B35"/>
    <circle cx="24" cy="20" r="3" fill="white"/>
  </svg>
);

const DisabilityIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#FF6B35" opacity="0.1"/>
    <circle cx="20" cy="16" r="3" fill="#FF6B35"/>
    <path d="M28 22C29.1 22 30 22.9 30 24V28C30 30.2 28.2 32 26 32H22C19.8 32 18 30.2 18 28V24C18 22.9 18.9 22 20 22H28Z" fill="#FF6B35"/>
    <circle cx="30" cy="30" r="6" stroke="#FF6B35" strokeWidth="2" fill="white"/>
  </svg>
);

const ElderlyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#999999" opacity="0.1"/>
    <circle cx="24" cy="18" r="4" fill="#999999"/>
    <path d="M18 26C18 24.9 18.9 24 20 24H28C29.1 24 30 24.9 30 26V34H18V26Z" fill="#999999"/>
    <path d="M28 30L32 28V36L28 34V30Z" fill="#999999"/>
  </svg>
);

const GTMStrategySlideClean = () => {
  const timeline = [
    { 
      year: "2026", 
      segments: [
        { name: "BY", icon: <YouthWelfareIcon />, active: true },
        { name: "✕", icon: <DisabilityIcon />, active: false },
        { name: "✕", icon: <ElderlyIcon />, active: false }
      ],
      description: [
        { icon: "😣", text: "Highest docu pain" },
        { icon: "🧩", text: "Best Founder fit" }
      ]
    },
    { 
      year: "2027", 
      segments: [
        { name: "DE", icon: <YouthWelfareIcon />, active: true },
        { name: "BY", icon: <DisabilityIcon />, active: true },
        { name: "✕", icon: <ElderlyIcon />, active: false }
      ],
      description: [
        { icon: "📈", text: "Scaling after initial traction" },
        { icon: "🎯", text: "Similar pain" }
      ]
    },
    { 
      year: "2029", 
      segments: [
        { name: "DE", icon: <YouthWelfareIcon />, active: true },
        { name: "DE", icon: <DisabilityIcon />, active: true },
        { name: "BY", icon: <ElderlyIcon />, active: true }
      ],
      description: [
        { icon: "🧠", text: "Mature niche" },
        { icon: "📊", text: "Step into bigger market" }
      ]
    },
    { 
      year: "2033", 
      segments: [
        { name: "EU", icon: <YouthWelfareIcon />, active: true },
        { name: "EU", icon: <DisabilityIcon />, active: true },
        { name: "DE", icon: <ElderlyIcon />, active: true }
      ],
      description: [
        { icon: "🌍", text: "Internationalisation" },
        { icon: "👥", text: "Organisational ramp up" }
      ]
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
        >
          <PitchHeaderBlock 
            badge="Go-to-Market" 
            title="Go to Market Strategy"
          />
        </motion.div>

        {/* Timeline - CENTERED - Fully Responsive */}
        <div className="w-full max-w-6xl flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          {/* Years Row */}
          <div 
            className="flex items-center justify-center"
            style={{ gap: 'clamp(32px, 4vw, 64px)', marginBottom: 'clamp(24px, 3vh, 40px)' }}
          >
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center"
              >
                {/* Year */}
                <div 
                  className="font-black"
                  style={{ fontSize: FONT_SIZES.h2, color: PITCH_COLORS.heading }}
                >
                  {item.year}
                </div>
                
                {/* Arrow */}
                {i < timeline.length - 1 && (
                  <ArrowRight 
                    style={{ 
                      width: 'clamp(32px, 3vw, 56px)', 
                      height: 'clamp(32px, 3vw, 56px)',
                      marginLeft: 'clamp(24px, 3vw, 48px)',
                      color: '#D0D0D0' 
                    }}
                    strokeWidth={2}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Segments & Descriptions - CENTERED */}
          <div 
            className="flex items-start justify-center"
            style={{ gap: 'clamp(48px, 6vw, 100px)' }}
          >
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center"
                style={{ width: 'clamp(160px, 15vw, 240px)' }}
              >
                {/* Segment Icons */}
                <div 
                  className="flex flex-col"
                  style={{ gap: 'clamp(12px, 1.5vh, 20px)', marginBottom: 'clamp(20px, 2.5vh, 32px)' }}
                >
                  {item.segments.map((segment, j) => (
                    <div key={j} className="flex items-center" style={{ gap: 'clamp(8px, 1vw, 16px)' }}>
                      <div 
                        className="flex items-center justify-center"
                        style={{ width: 'clamp(40px, 4vw, 64px)', height: 'clamp(40px, 4vw, 64px)' }}
                      >
                        {segment.icon}
                      </div>
                      <div 
                        className="font-bold"
                        style={{ 
                          fontSize: FONT_SIZES.bodyM,
                          color: segment.active ? PITCH_COLORS.heading : '#E85D5D' 
                        }}
                      >
                        {segment.name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Description Cards */}
                <div className="flex flex-col w-full" style={{ gap: 'clamp(8px, 1vh, 14px)' }}>
                  {item.description.map((desc, j) => (
                    <div 
                      key={j}
                      className="flex items-start text-left"
                      style={{ gap: 'clamp(6px, 0.8vw, 12px)' }}
                    >
                      <span 
                        className="leading-none"
                        style={{ fontSize: FONT_SIZES.bodyM, marginTop: '2px' }}
                      >
                        {desc.icon}
                      </span>
                      <span 
                        className="font-bold leading-snug"
                        style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body, fontWeight: 600 }}
                      >
                        {desc.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer - Segment Legend - CENTERED - Fully Responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center border-t w-full max-w-4xl flex-shrink-0 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-5 lg:pt-6 mt-auto"
          style={{ 
            borderColor: '#E5E5E5',
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <ElderlyIcon />
            <span 
              className="font-semibold text-sm sm:text-base lg:text-lg"
              style={{ color: PITCH_COLORS.body }}
            >
              Elderly care
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DisabilityIcon />
            <span 
              className="font-semibold text-sm sm:text-base lg:text-lg"
              style={{ color: PITCH_COLORS.body }}
            >
              Disability care
            </span>
          </div>
          <div className="flex items-center" style={{ gap: 'clamp(8px, 1vw, 16px)' }}>
            <YouthWelfareIcon />
            <span 
              className="font-bold"
              style={{ fontSize: FONT_SIZES.bodyS, color: PITCH_COLORS.body, fontWeight: 600 }}
            >
              Youth Welfare
            </span>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

export default GTMStrategySlideClean;