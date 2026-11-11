import { motion, AnimatePresence } from "framer-motion";
import { PITCH_COLORS, FONT_SIZES } from "./PitchSlideWrapper";

interface EmotionalOpeningSlideProps {
  phase: number; // 0 = Jennifer intro, 1 = chaos builds, 2 = problem statement
}

// Background words - large, low opacity, blurred - FULL CANVAS
const backgroundWords = [
  { text: "Report", x: -44, y: -40, rotate: -8, size: "clamp(85px, 10.5vw, 170px)", opacity: 0.14, delay: 0.2 },
  { text: "Assessment", x: 40, y: 34, rotate: 5, size: "clamp(76px, 9.5vw, 148px)", opacity: 0.13, delay: 0.5 },
  { text: "Form", x: 50, y: -44, rotate: 12, size: "clamp(92px, 11.5vw, 180px)", opacity: 0.15, delay: 0.8 },
  { text: "Overdue", x: -50, y: 42, rotate: -6, size: "clamp(80px, 10vw, 158px)", opacity: 0.16, delay: 1.1 },
  { text: "Signature missing", x: 10, y: 48, rotate: 3, size: "clamp(64px, 8vw, 128px)", opacity: 0.13, delay: 1.4 },
  { text: "BACKLOG", x: -57, y: -17, rotate: -10, size: "clamp(74px, 9vw, 142px)", opacity: 0.12, delay: 0.3 },
  { text: "PENDING", x: 54, y: 17, rotate: 8, size: "clamp(69px, 8.5vw, 138px)", opacity: 0.11, delay: 0.7 },
];

// Main chaos words - SPREAD EDGE TO EDGE
const chaosWords = [
  { text: "WhatsApp notes", x: -38, y: -28, rotate: -3, size: "clamp(28px, 2.8vw, 48px)", fontWeight: "600", color: "#333333", opacity: 0.9, delay: 0 },
  { text: "Excel", x: 45, y: -40, rotate: 5, size: "clamp(36px, 3.5vw, 58px)", fontWeight: "bold", color: "#222222", opacity: 0.95, delay: 0.12 },
  { text: "PDF", x: -50, y: 12, rotate: -2, size: "clamp(38px, 3.8vw, 62px)", fontWeight: "bold", color: "#111111", opacity: 1, delay: 0.24 },
  { text: "Email", x: 56, y: 28, rotate: 6, size: "clamp(30px, 3vw, 52px)", fontWeight: "600", color: "#333333", opacity: 0.88, delay: 0.36 },
  { text: "voice memo", x: -25, y: 44, rotate: -4, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#444444", opacity: 0.82, delay: 0.48 },
  { text: "doc backlog", x: 32, y: -18, rotate: 3, size: "clamp(28px, 2.8vw, 48px)", fontWeight: "bold", color: "#333333", opacity: 0.9, delay: 0.6 },
  { text: "scan", x: -60, y: -35, rotate: -5, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#444444", opacity: 0.85, delay: 0.72 },
  { text: "fax", x: 62, y: -8, rotate: 4, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#555555", opacity: 0.78, delay: 0.84 },
  { text: "urgent", x: -18, y: -48, rotate: -6, size: "clamp(34px, 3.3vw, 56px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 0.96 },
  { text: "crisis call", x: 40, y: 42, rotate: 5, size: "clamp(32px, 3.1vw, 54px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 1.08 },
  { text: "overdue", x: -46, y: 32, rotate: -3, size: "clamp(30px, 2.9vw, 50px)", fontWeight: "bold", color: "#F26A2E", opacity: 0.95, delay: 1.2 },
  { text: "deadline", x: 50, y: -46, rotate: 7, size: "clamp(30px, 2.8vw, 48px)", fontWeight: "bold", color: "#F26A2E", opacity: 0.95, delay: 1.32 },
  { text: "midnight call", x: -56, y: -12, rotate: -4, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#444444", opacity: 0.82, delay: 1.44 },
  { text: "ASAP", x: 25, y: 58, rotate: 8, size: "clamp(32px, 3.1vw, 52px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 1.56 },
  { text: "Child 1", x: -32, y: 52, rotate: -2, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#444444", opacity: 0.82, delay: 1.68 },
  { text: "Child 2", x: 60, y: 18, rotate: 4, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#444444", opacity: 0.82, delay: 1.8 },
  { text: "foster family", x: 12, y: -60, rotate: 2, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#333333", opacity: 0.88, delay: 2.04 },
  { text: "case worker", x: -42, y: -58, rotate: -6, size: "clamp(26px, 2.5vw, 42px)", fontWeight: "600", color: "#444444", opacity: 0.82, delay: 2.16 },
  { text: "guardian", x: 52, y: 50, rotate: 5, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#444444", opacity: 0.88, delay: 2.28 },
  { text: "§8a SGB VIII", x: -12, y: 28, rotate: -1, size: "clamp(24px, 2.2vw, 38px)", fontWeight: "bold", color: "#333333", opacity: 0.9, delay: 2.4 },
  { text: "incident report", x: 46, y: -32, rotate: 4, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#222222", opacity: 0.9, delay: 2.52 },
  { text: "care plan", x: 20, y: 10, rotate: 2, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#333333", opacity: 0.88, delay: 2.76 },
  { text: "callback", x: 55, y: 60, rotate: 6, size: "clamp(28px, 2.6vw, 44px)", fontWeight: "bold", color: "#F26A2E", opacity: 0.92, delay: 3.24 },
  { text: "home visit", x: -55, y: -50, rotate: -5, size: "clamp(28px, 2.7vw, 46px)", fontWeight: "600", color: "#333333", opacity: 0.88, delay: 3.36 },
  { text: "file upload", x: -65, y: 20, rotate: -7, size: "clamp(24px, 2.3vw, 40px)", fontWeight: "600", color: "#444444", opacity: 0.78, delay: 1.92 },
  { text: "archive", x: 65, y: -20, rotate: 8, size: "clamp(24px, 2.3vw, 40px)", fontWeight: "600", color: "#555555", opacity: 0.75, delay: 2.64 },
];

// Foreground words - high opacity, DOMINANT CENTER
const foregroundWords = [
  { text: "Documentation", x: -10, y: -12, rotate: -2, size: "clamp(48px, 4.8vw, 78px)", fontWeight: "bold", color: "#111111", opacity: 1, delay: 3.5 },
  { text: "Compliance", x: 18, y: 15, rotate: 3, size: "clamp(42px, 4.3vw, 70px)", fontWeight: "bold", color: "#222222", opacity: 1, delay: 3.7 },
  { text: "Meeting notes", x: -22, y: 8, rotate: -1, size: "clamp(37px, 3.9vw, 64px)", fontWeight: "600", color: "#333333", opacity: 0.98, delay: 3.9 },
  { text: "Deadline", x: 12, y: -18, rotate: 4, size: "clamp(46px, 4.5vw, 74px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 4.1 },
  { text: "Case plan", x: -16, y: 20, rotate: -3, size: "clamp(40px, 4.1vw, 68px)", fontWeight: "bold", color: "#222222", opacity: 1, delay: 4.3 },
  { text: "Review", x: 25, y: -8, rotate: 2, size: "clamp(37px, 3.9vw, 64px)", fontWeight: "600", color: "#333333", opacity: 0.96, delay: 4.5 },
  { text: "Update required", x: -8, y: 25, rotate: -1, size: "clamp(35px, 3.7vw, 60px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 4.7 },
  { text: "Report DUE", x: 28, y: 22, rotate: 5, size: "clamp(33px, 3.5vw, 58px)", fontWeight: "bold", color: "#F26A2E", opacity: 1, delay: 4.9 },
];

export const EmotionalOpeningSlide = ({ phase }: EmotionalOpeningSlideProps) => {
  const showQuote = phase === 0 || phase === 1;
  const showChaos = phase === 1;
  const quoteFading = phase === 1;
  const showProblem = phase === 2;

  return (
    <div 
      className="relative w-full min-h-screen overflow-y-auto overflow-x-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
      style={{ background: '#FEFEFE' }}
    >
      {/* Very subtle grain */}
      <div 
        className="absolute inset-0 opacity-[0.012] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)"/%3E%3C/svg%3E")' }}
      />

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        
        {/* Background words */}
        <AnimatePresence>
          {showChaos && (
            <motion.div 
              className="fixed inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
            >
              {backgroundWords.map((word) => (
                <motion.span
                  key={word.text}
                  className="absolute whitespace-nowrap select-none font-bold"
                  style={{
                    fontSize: word.size,
                    color: PITCH_COLORS.heading,
                    left: `calc(50% + ${word.x * 0.95}%)`,
                    top: `calc(50% + ${word.y * 0.95}%)`,
                    transform: `translate(-50%, -50%) rotate(${word.rotate}deg)`,
                    filter: 'blur(2px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: quoteFading ? word.opacity * 1.3 : word.opacity,
                    y: [0, -5, 0, 3, 0],
                  }}
                  transition={{ 
                    opacity: { delay: word.delay * 0.4, duration: 1.5, ease: "easeOut" },
                    y: { delay: word.delay * 0.4 + 1, duration: 10, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {word.text}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jennifer's intro - CENTERED */}
        <AnimatePresence>
          {showQuote && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: quoteFading ? 0.15 : 1,
                scale: quoteFading ? 0.97 : 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <div className="text-center max-w-5xl">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="font-black leading-[1.1] tracking-[-0.02em]"
                  style={{ 
                    fontSize: FONT_SIZES.h1,
                    color: PITCH_COLORS.heading,
                  }}
                >
                  When I was 15, I{" "}
                  <span style={{ color: PITCH_COLORS.accent }}>
                    ran away from home
                  </span>
                  .
                </motion.h1>
                {!quoteFading && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="font-medium mt-6 sm:mt-8"
                    style={{
                      fontSize: 'clamp(16px, 1.8vw, 26px)',
                      color: PITCH_COLORS.muted,
                      opacity: 0.7,
                    }}
                  >
                    I ended up in youth welfare.
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main chaos words */}
        <AnimatePresence>
          {showChaos && (
            <motion.div 
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              {chaosWords.map((word, index) => (
                <motion.span
                  key={word.text}
                  className="absolute whitespace-nowrap select-none"
                  style={{
                    fontSize: word.size,
                    fontWeight: word.fontWeight || 'normal',
                    color: word.color,
                    left: `calc(50% + ${word.x * 0.85}%)`,
                    top: `calc(50% + ${word.y * 0.85}%)`,
                    transform: `translate(-50%, -50%) rotate(${word.rotate}deg)`
                  }}
                  initial={{ opacity: 0, scale: 0.7, y: 25 }}
                  animate={{ 
                    opacity: quoteFading ? word.opacity : word.opacity * 0.85,
                    scale: 1,
                    y: index % 3 === 0 ? [0, -2, 0, 1, 0] : 0,
                  }}
                  transition={{ 
                    opacity: { delay: word.delay * 0.32, duration: 0.8, ease: "easeOut" },
                    scale: { delay: word.delay * 0.32, duration: 0.7, ease: "easeOut" },
                    y: { delay: word.delay * 0.32 + 0.7, duration: 6, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {word.text}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foreground words */}
        <AnimatePresence>
          {showChaos && (
            <motion.div 
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              {foregroundWords.map((word) => (
                <motion.span
                  key={word.text}
                  className="absolute whitespace-nowrap select-none"
                  style={{
                    fontSize: word.size,
                    fontWeight: word.fontWeight || 'normal',
                    color: word.color,
                    left: `calc(50% + ${word.x}%)`,
                    top: `calc(50% + ${word.y}%)`,
                    transform: `translate(-50%, -50%) rotate(${word.rotate}deg)`
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: quoteFading ? word.opacity : word.opacity * 0.75, scale: 1 }}
                  transition={{ 
                    opacity: { delay: word.delay * 0.28, duration: 0.9, ease: "easeOut" },
                    scale: { delay: word.delay * 0.28, duration: 0.8, ease: "easeOut" },
                  }}
                >
                  {word.text}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final problem statement - CENTERED */}
        <AnimatePresence>
          {showProblem && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9 }}
            >
              <div 
                className="text-center flex flex-col items-center justify-center"
                style={{ padding: 'clamp(32px, 5vw, 80px)', maxWidth: '90%' }}
              >
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.7 }}
                  className="font-black leading-[1.15] tracking-[-0.025em]"
                  style={{ 
                    fontSize: FONT_SIZES.h1,
                    color: PITCH_COLORS.heading,
                    textWrap: 'balance',
                  }}
                >
                  The people who care most{" "}
                  <br className="hidden sm:block" />
                  spend most of their day on{" "}
                  <span 
                    style={{ 
                      color: PITCH_COLORS.accent,
                      fontWeight: 900,
                      fontSize: '1.1em',
                    }}
                  >
                    paperwork
                  </span>
                  .
                </motion.h1>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmotionalOpeningSlide;
