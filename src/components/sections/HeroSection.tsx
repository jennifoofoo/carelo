import { MessageCircle, FileText, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[auto] lg:min-h-[85vh] flex items-center pt-24 pb-24 md:pt-28 md:pb-16 bg-background overflow-hidden">
      <div className="section-container-wide relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Content - Wide Column */}
          <div className="lg:col-span-5 order-1 lg:order-1 text-center lg:text-left">
            {/* Section Label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-3 md:mb-4"
            >
              <span className="text-section-label text-xs md:text-sm">Documentation tool for youth welfare teams</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.25rem] font-semibold leading-[1.15] tracking-tight text-foreground mb-3 md:mb-4"
            >
              More time for the children.
              <br />
              <span className="text-primary">Less time on paperwork.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mb-2 md:mb-3 max-w-md mx-auto lg:mx-0"
            >
              Record a voice note. Upload a photo. Carelo turns it into structured case documentation. You review it instead of writing it from scratch.
            </motion.p>

            {/* Target Audience Clarity */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.17 }}
              className="text-xs sm:text-sm text-muted-foreground/70 mb-4 md:mb-5 max-w-md mx-auto lg:mx-0"
            >
              For Fachkr&auml;fte in der Jugendhilfe. Not a generic note-taking app.
            </motion.p>

            {/* Metrics Row - Prominent KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-3 gap-2 md:gap-3 mb-5 md:mb-6 py-3 md:py-4 px-3 md:px-4 bg-muted/40 rounded-lg md:rounded-xl border border-border/50 max-w-md mx-auto lg:mx-0"
            >
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">40–70%</div>
                <div className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-tight">of day on docs</div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">3–5×</div>
                <div className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-tight">duplicate entry</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">~50%</div>
                <div className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-tight">saved in early tests</div>
              </div>
            </motion.div>

            {/* CTAs - Close to KPIs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-6 md:mb-8"
            >
              {/* Calendly CTA */}
              <CalendlyEmbed 
                url="https://calendly.com/jennifer-carelo/30min"
                type="popup"
                buttonText="Book a Demo"
              />
              
              {/* Email CTA */}
              <a 
                href="mailto:hello@carelo.org" 
                className="group inline-flex items-center justify-center gap-2 text-foreground font-medium text-sm sm:text-base px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Talk to us</span>
              </a>
            </motion.div>

            {/* Social Proof Quote - Reduced prominence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pl-3 md:pl-4 border-l-2 border-primary/30 text-left mx-auto lg:mx-0 max-w-xs lg:max-w-none"
            >
              <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                "Most of my day goes into paperwork. The kids deserve better."
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">Youth welfare worker</p>
            </motion.div>
          </div>

          {/* Right: Visual Mock - Before/After (Cleaner) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-7 order-2 lg:order-2 relative hidden sm:block"
          >
            <div className="relative flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
              {/* Before Card: Messy Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="w-44 sm:w-52 md:w-60 lg:w-72 bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border border-border relative"
              >
                {/* Before Label */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-muted-foreground">Before</span>
                </div>
                
                {/* Messy notes content */}
                <div className="space-y-3">
                  <div className="text-xs text-foreground/60 leading-relaxed font-mono">
                    Home visit 14:30 - family stressed, M. quiet...
                  </div>
                  <div className="h-px bg-border" />
                  <div className="text-xs text-foreground/50 leading-relaxed font-mono line-through">
                    Follow up teacher??
                  </div>
                  <div className="text-xs text-foreground/50 leading-relaxed font-mono">
                    Report still TODO
                  </div>
                </div>
                
                {/* Time indicator */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Documentation</span>
                  <span className="text-xs font-semibold text-destructive">4+ hrs/day</span>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="hidden md:block"
              >
                <div className="w-8 h-px bg-border" />
              </motion.div>

              {/* After Card: Clean Carelo UI */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="w-48 sm:w-60 md:w-72 lg:w-80 bg-white rounded-xl shadow-xl p-4 sm:p-5 md:p-6 border border-primary/20 relative"
              >
                {/* After Label */}
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">With Carelo</span>
                </div>
                
                {/* Clean structured content */}
                <div className="space-y-3">
                  {/* AI Summary */}
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <div className="text-xs font-medium text-foreground mb-2">AI Summary</div>
                    <div className="space-y-1.5">
                      <div className="h-2 bg-primary/20 rounded-full w-full" />
                      <div className="h-2 bg-primary/15 rounded-full w-4/5" />
                    </div>
                  </div>
                  
                  {/* Tasks */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-foreground/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Risks detected</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Tasks suggested</span>
                    </div>
                  </div>
                </div>
                
                {/* Time saved badge */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Documentation</span>
                  <span className="text-xs font-semibold text-primary">~50% saved</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subtle Background Gradients */}
      <div className="absolute top-1/4 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gradient-radial from-primary/[0.04] via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-gradient-radial from-secondary-accent/[0.06] via-transparent to-transparent blur-3xl pointer-events-none" />
    </section>
  );
};
