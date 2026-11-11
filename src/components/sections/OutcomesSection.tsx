import { motion } from "framer-motion";
import { Clock, LayoutGrid, Shield, Heart } from "lucide-react";

const outcomes = [
  {
    icon: Clock,
    label: "DOCUMENTATION TIME",
    value: "~50% less",
    description: "Based on early tests with Fachkräfte. Review a draft instead of writing from memory.",
  },
  {
    icon: LayoutGrid,
    label: "NOTHING FALLS THROUGH",
    value: "One timeline",
    description: "Every voice note, photo, and PDF lands in the right case. No more searching across tools.",
  },
  {
    icon: Shield,
    label: "RISK SIGNALS",
    value: "Flagged early",
    description: "The AI highlights patterns in your notes. You decide what matters.",
  },
  {
    icon: Heart,
    label: "MORE TIME FOR KIDS",
    value: "The actual point",
    description: "If documentation takes less time, you can spend more of your shift with the people you're there for.",
  },
];

export const OutcomesSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-graphite leading-tight mb-6">
            What changes
          </h2>
          <p className="text-graphite/70 text-xl">
            When documentation stops fighting you.
          </p>
        </motion.div>

        {/* Outcomes Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {outcomes.map((outcome, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-soft-warm/70 rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <outcome.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-graphite/50 text-xs tracking-widest uppercase mb-1">
                        {outcome.label}
                      </p>
                      <p className="font-heading text-xl md:text-2xl font-bold text-graphite mb-2">
                        {outcome.value}
                      </p>
                      <div className="w-8 h-0.5 bg-primary/30 mb-2" />
                      <p className="text-graphite/60 text-sm">
                        {outcome.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
