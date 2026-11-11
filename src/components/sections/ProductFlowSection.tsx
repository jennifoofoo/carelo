import { motion } from "framer-motion";
import { Inbox, Sparkles, Wand2, UserCheck, Layers, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Inbox,
    label: "Capture",
    description: "Voice, text, and photos instantly captured",
    highlight: false,
  },
  {
    icon: Sparkles,
    label: "Understand",
    description: "AI turns raw inputs into case-ready intelligence",
    highlight: false,
  },
  {
    icon: Wand2,
    label: "Generate",
    description: "Summaries, chronologies, early warnings, draft reports",
    highlight: false,
  },
  {
    icon: UserCheck,
    label: "Human-in-the-loop",
    description: "You verify critical signals and add nuance",
    highlight: true,
  },
  {
    icon: Layers,
    label: "Manage",
    description: "One unified timeline for every note and event",
    highlight: false,
  },
];

export const ProductFlowSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-4"
        >
          <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-4">
            Carelo
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-graphite leading-tight">
            <span className="text-primary">Carelo</span> makes this possible.
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-graphite/70 text-lg md:text-xl mb-12"
        >
          AI Case Intelligence that captures everything.
        </motion.p>

        {/* Horizontal Flow Steps - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-3 mb-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-stretch"
            >
              <div className={`flex-1 rounded-xl p-5 flex flex-col items-center text-center ${
                step.highlight 
                  ? 'bg-white border-2 border-primary shadow-sm' 
                  : 'bg-card border border-border'
              }`}>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                  step.highlight 
                    ? 'bg-primary/10' 
                    : 'bg-muted'
                }`}>
                  <step.icon className={`w-7 h-7 ${
                    step.highlight ? 'text-primary' : 'text-graphite/50'
                  }`} strokeWidth={1.5} />
                </div>
                <h3 className={`text-base font-bold mb-2 ${
                  step.highlight ? 'text-primary' : 'text-graphite'
                }`}>
                  {step.label}
                </h3>
                <p className="text-graphite/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow between cards */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center w-6 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-border" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Flow Steps - Mobile (vertical) */}
        <div className="lg:hidden space-y-3 mb-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl p-5 flex items-center gap-4 ${
                step.highlight 
                  ? 'bg-white border-2 border-primary shadow-sm' 
                  : 'bg-card border border-border'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                step.highlight 
                  ? 'bg-primary/10' 
                  : 'bg-muted'
              }`}>
                <step.icon className={`w-6 h-6 ${
                  step.highlight ? 'text-primary' : 'text-graphite/50'
                }`} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className={`text-base font-bold mb-0.5 ${
                  step.highlight ? 'text-primary' : 'text-graphite'
                }`}>
                  {step.label}
                </h3>
                <p className="text-graphite/60 text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 text-sm"
        >
          <span className="text-graphite/70 font-medium">Human-first</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-graphite/70 font-medium">No information loss</span>
          <span className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium">
            GDPR compliant · EU-hosted
          </span>
        </motion.div>
      </div>
    </section>
  );
};
