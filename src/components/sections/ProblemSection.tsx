import { motion } from "framer-motion";
import { Layers, Copy, AlertTriangle, Clock, FileText, Heart } from "lucide-react";

const painPoints = [
  {
    icon: Layers,
    text: "Notes scattered across 2–5 incompatible tools",
  },
  {
    icon: Copy,
    text: "Same info entered 3–5× for different reports",
  },
  {
    icon: AlertTriangle,
    text: "Critical signals get buried → missed risks",
  },
  {
    icon: Clock,
    text: "40–70% of day spent on documentation",
  },
  {
    icon: FileText,
    text: "Reports written from memory at day's end",
  },
  {
    icon: Heart,
    text: "Admin overload → burnout & turnover",
  },
];

export const ProblemSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mb-12"
        >
          <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-6">
            The Problem
          </p>
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-graphite leading-snug">
            Youth welfare workers spend <span className="text-primary">40–70%</span> of their day on documentation.
          </h2>
        </motion.div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <point.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-graphite font-medium leading-snug pt-2">
                {point.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom insight */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-primary font-semibold mt-12 text-lg"
        >
          Details get lost. Mental load rises. Kids fall through the cracks.
        </motion.p>
      </div>
    </section>
  );
};
