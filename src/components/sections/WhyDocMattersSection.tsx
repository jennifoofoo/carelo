import { motion } from "framer-motion";
import { Scale, FileWarning, Clock, Heart } from "lucide-react";

const points = [
  {
    icon: Scale,
    title: "Legal requirement",
    description: "Youth welfare regulations require complete documentation. Incomplete records mean legal risk.",
  },
  {
    icon: FileWarning,
    title: "Information loss",
    description: "Important details get lost when documentation happens under time pressure. That can have consequences for children.",
  },
  {
    icon: Clock,
    title: "Time pressure",
    description: "Reports often get written at the end of the day from memory. Details fade, gaps appear.",
  },
  {
    icon: Heart,
    title: "Impact on children",
    description: "Every hour spent on documentation is an hour missing from direct work with families.",
  },
];

export const WhyDocMattersSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left - Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-32"
          >
            <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-4">
              Domain Expertise
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-graphite leading-tight mb-6">
              Why documentation in youth welfare matters so much.
            </h2>
            <p className="text-graphite/70 text-lg leading-relaxed">
              Carelo was built for youth welfare. Not adapted from a generic tool.
              Built by people who know how Tr&auml;ger and Fachkr&auml;fte actually work.
            </p>
          </motion.div>

          {/* Right - Points */}
          <div className="space-y-6">
            {points.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-graphite text-base mb-2">
                      {point.title}
                    </h3>
                    <p className="text-graphite/60 text-sm leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
