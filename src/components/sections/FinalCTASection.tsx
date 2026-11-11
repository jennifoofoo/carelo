import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { CalendlyEmbed } from "@/components/CalendlyEmbed";

export const FinalCTASection = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="section-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Headline */}
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-graphite leading-tight mb-8">
            Try it with your own case notes.
          </h2>
          
          <p className="text-xl text-graphite/70 mb-12">
            See how your documentation looks when AI does the structuring and you just review.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
          <a 
            href="/dashboard" 
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold text-lg px-10 py-5 rounded-md hover:bg-primary-light transition-colors"
          >
            <span>Try Carelo</span>
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </a>

            <CalendlyEmbed 
              url="https://calendly.com/jennifer-carelo/30min"
              type="popup"
              buttonText="Talk to Founders"
              buttonClassName="inline-flex items-center justify-center gap-2 bg-white text-graphite border-2 border-graphite/20 font-semibold text-lg px-10 py-5 rounded-md hover:bg-graphite/5 hover:border-graphite/30 transition-all"
            />
          </div>

          {/* CTA Helper Text */}
          <p className="text-xs text-graphite/50 mb-6">
            15-minute call. We show you the tool, you tell us if it fits.
          </p>

          {/* Product Stage */}
          <p className="text-sm text-graphite/60 mb-3">
            Currently in early pilots with youth welfare teams.
          </p>

          {/* Trust note */}
          <p className="text-sm text-graphite/50">
            Start for free • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
};
