import { motion } from "framer-motion";
import { Shield, Server, Lock } from "lucide-react";

const trustBadges = [
  { 
    icon: Shield, 
    label: "Art. 9 DSGVO",
    description: "Built for special-category data. Case notes, risk assessments, personal information of minors."
  },
  { 
    icon: Server, 
    label: "EU servers only",
    description: "Your data stays in the EU. No US cloud, no exceptions."
  },
  { 
    icon: Lock, 
    label: "No model training",
    description: "Nothing you write is used to train AI models. Ever."
  },
];

export const TrustSection = () => {
  return (
    <section className="py-24 md:py-32 bg-gray-50">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4 text-graphite">
              You work with data about children. We know what that means.
            </h2>
            <p className="text-graphite/70 text-base md:text-lg max-w-2xl mx-auto">
              Youth welfare documentation contains some of the most sensitive data there is. Carelo is built around that reality.
            </p>
          </motion.div>

          {/* Trust Badges */}
          <div className="grid md:grid-cols-3 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <badge.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="font-semibold text-graphite text-lg mb-2">
                  {badge.label}
                </p>
                <p className="text-graphite/60 text-sm leading-relaxed">
                  {badge.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
