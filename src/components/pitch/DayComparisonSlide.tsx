import { motion, AnimatePresence } from "framer-motion";

const withoutTimeline = [
  { time: "09:00", label: "Home visit", detail: "mental notes only" },
  { time: "11:00", label: "Phone call", detail: "scattered details" },
  { time: "13:00", label: "Crisis case", detail: "no time to document" },
  { time: "15:00", label: "Meeting", detail: "different tools" },
  { time: "18:00", label: "Report", detail: "written from memory" },
];

const withTimeline = [
  { time: "09:00", label: "Voice note", detail: "captured instantly" },
  { time: "11:00", label: "Call update", detail: "linked to case" },
  { time: "13:00", label: "Crisis note", detail: "auto-extracted" },
  { time: "15:00", label: "Update", detail: "auto-structured" },
  { time: "18:00", label: "Report", detail: "pre-filled" },
];

// Unified SlideWrapper
const SlideWrapper = ({ children }: { children: React.ReactNode }) => (
  <div 
    className="fixed inset-0 overflow-hidden flex items-center justify-center"
    style={{ background: '#FAFAFA' }}
  >
    <div className="relative z-10 w-[88vw] max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] h-[calc(100vh-80px)] flex flex-col justify-center">
      <div className="py-12">
        {children}
      </div>
    </div>
  </div>
);

// Unified SectionLabel - Orange with background, left-aligned
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4"
  >
    <span 
      className="inline-block px-4 py-1.5 rounded-full border text-[13px] xl:text-[14px] font-bold tracking-[0.1em] uppercase text-[#EB6A38]"
      style={{ backgroundColor: 'rgba(235, 106, 56, 0.08)', borderColor: 'rgba(235, 106, 56, 0.15)' }}
    >
      {children}
    </span>
  </motion.div>
);

// Unified SlideTitle - same mb-6 as PitchDeck
const SlideTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h1
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    className="text-[44px] md:text-[52px] lg:text-[60px] xl:text-[72px] 2xl:text-[80px] font-extrabold text-[#000000] leading-[1.05] tracking-[-0.02em] mb-6"
  >
    {children}
  </motion.h1>
);

interface DayComparisonSlideProps {
  showSolution?: boolean;
}

export const DayComparisonSlide = ({ showSolution = false }: DayComparisonSlideProps) => {
  return (
    <SlideWrapper>
      <div>
        <SectionLabel>A Day in the Life</SectionLabel>
        
        <SlideTitle>
          From a fragmented workflow → to a <span className="text-[#EB6A38]">unified</span> one.
        </SlideTitle>
      </div>

      {/* Two Panels */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="flex gap-6 items-stretch"
      >
        {/* Left Panel - Without Carelo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="flex-1 rounded-xl p-6 xl:p-8"
          style={{ background: '#FFF5F2' }}
        >
          <h3 className="text-[11px] xl:text-[12px] font-semibold tracking-[0.15em] uppercase text-[#666666] mb-6">
            Without Carelo
          </h3>
          
          <div className="space-y-4 xl:space-y-5">
            {withoutTimeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.04 }}
                className="flex items-baseline gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4A59A] flex-shrink-0 mt-1.5" />
                <span className="font-mono text-[12px] xl:text-[13px] font-medium text-[#666666] w-12 flex-shrink-0">
                  {item.time}
                </span>
                <span className="text-[14px] xl:text-[15px] font-bold text-[#111111]">{item.label}</span>
                <span className="text-[13px] xl:text-[14px] text-[#666666]">— {item.detail}</span>
              </motion.div>
            ))}
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-[13px] xl:text-[14px] font-medium text-[#C45C3A]"
          >
            Details get lost. Mental load rises.
          </motion.p>
        </motion.div>

        {/* Right Panel - With Carelo (appears on next click) */}
        <AnimatePresence>
          {showSolution && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="flex-1 rounded-xl p-6 xl:p-8"
              style={{ background: '#FFF8F3' }}
            >
              <h3 className="text-[11px] xl:text-[12px] font-semibold tracking-[0.15em] uppercase text-[#666666] mb-6">
                With Carelo
              </h3>
              
              <div className="space-y-4 xl:space-y-5">
                {withTimeline.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-baseline gap-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EB6A38] flex-shrink-0 mt-1.5" />
                    <span className="font-mono text-[12px] xl:text-[13px] font-medium text-[#EB6A38] w-12 flex-shrink-0">
                      {item.time}
                    </span>
                    <span className="text-[14px] xl:text-[15px] font-bold text-[#111111]">{item.label}</span>
                    <span className="text-[13px] xl:text-[14px] text-[#EB6A38] font-medium">— {item.detail}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-8 text-[13px] xl:text-[14px] font-medium text-[#EB6A38]"
              >
                Real-time capture. No information loss.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </SlideWrapper>
  );
};
