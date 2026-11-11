import { motion } from "framer-motion";

const quotes = [
  {
    text: "Everything gets collected again, and for the help plan, each piece has to be",
    highlight: "rewritten",
    rest: "separately.",
    role: "Social Worker",
    location: "Bavaria",
  },
  {
    text: "We run around all day, and then suddenly a problem lands on the table that wasn't even on the",
    highlight: "to-do list.",
    rest: "",
    role: "Field Social Worker",
    location: "Munich",
  },
  {
    text: "The biggest problem? Everything is somewhere, but nothing is where I need it when it",
    highlight: "matters.",
    rest: "",
    role: "Team Lead, Youth Welfare",
    location: "Bavaria",
  },
];

export const TestimonialSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-4">
            Voices from the field
          </p>
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-graphite leading-snug">
            What social workers told us. <span className="text-primary italic">Unfiltered.</span>
          </h2>
        </motion.div>

        {/* Quotes */}
        <div className="space-y-8 max-w-4xl">
          {quotes.map((quote, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border-l-4 border-primary/30 pl-6"
            >
              <p className="text-xl md:text-2xl text-graphite font-medium leading-relaxed mb-3">
                "{quote.text} <span className="text-primary font-bold">{quote.highlight}</span>{quote.rest ? ` ${quote.rest}` : ""}"
              </p>
              <p className="text-graphite/60 text-sm font-medium">
                {quote.role}, {quote.location}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
