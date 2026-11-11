import { motion } from "framer-motion";

export const FounderSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header - Matches Real Impact Alignment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-graphite leading-tight">
            Why Carelo exists
          </h2>
        </motion.div>

        {/* Content - Left-Aligned with Vertical Orange Accent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="border-l-2 border-primary pl-6 md:pl-8 space-y-4">
            <p className="text-base md:text-lg text-graphite leading-relaxed">
              I grew up in youth welfare. For years, I watched social workers try to help kids like me while drowning in paperwork.
            </p>

            <p className="text-base md:text-lg text-graphite/80 leading-relaxed">
              They'd come to a visit, scribble notes, then go back to the office and spend hours typing everything into three different systems. By the time the report was done, details were already fuzzy. Risk signals got buried. Follow-ups fell through the cracks.
            </p>

            <p className="text-base md:text-lg text-graphite/80 leading-relaxed">
              These were good people doing critical work. The tools just made it impossibly slow.
            </p>

            <p className="text-base md:text-lg font-semibold text-primary leading-relaxed">
              Carelo started as a question: what if the documentation worked for you instead of against you?
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
