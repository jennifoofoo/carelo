import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, AlertTriangle, Camera, CheckCircle, FileText, Sparkles, CheckCircle2 } from "lucide-react";

const tabs = [
  { id: "capture", label: "Capture", icon: Mic },
  { id: "intelligence", label: "Intelligence", icon: Sparkles },
  { id: "reports", label: "Reports", icon: FileText },
];

const tabContent = {
  capture: {
    title: "Record it however you want",
    features: [
      "Voice notes during home visits or calls",
      "Photos of handwritten notes from the field",
      "Upload existing PDFs and documents",
      "AI transcribes and sorts it into the right case",
    ],
    highlight: "No typing. No double entry.",
    insights: [
      "Voice transcribed",
      "Documents scanned",
      "Sorted into case files",
    ],
  },
  intelligence: {
    title: "Built for § 8a and Hilfepläne",
    features: [
      "Risk signals flagged based on youth welfare criteria",
      "Follow-up tasks pulled from your notes",
      "Patterns across a case timeline surfaced",
      "§ 8a compliance checks built in",
    ],
    highlight: "Not generic AI. Trained on Jugendhilfe documentation.",
    insights: [
      "Risks flagged",
      "Tasks extracted",
      "Timeline updated",
    ],
  },
  reports: {
    title: "Reports you review, not rewrite",
    features: [
      "All notes from one case pulled together",
      "Hilfeplan and report templates pre-filled",
      "You edit and approve before anything goes out",
      "Works with how your Träger already reports",
    ],
    highlight: "Draft in minutes. Not hours.",
    insights: [
      "Data consolidated",
      "Report drafted",
      "Ready for your review",
    ],
  },
};

export const DemoSection = () => {
  const [activeTab, setActiveTab] = useState("capture");
  const content = tabContent[activeTab as keyof typeof tabContent];

  return (
    <section id="demo" className="py-20 md:py-28 bg-background">
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-graphite leading-tight mb-6">
            How it works
          </h2>
          <p className="text-graphite/70 text-xl mb-3">
            Three steps: capture it, let AI structure it, review the report.
          </p>
          <p className="text-sm text-graphite/60">
            Built for Jugendhilfe workflows. Knows what a Hilfeplan needs, what &sect; 8a requires, how Tr&auml;ger actually work.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-graphite shadow-sm border border-border"
                  : "text-graphite/60 hover:text-graphite hover:bg-soft-warm"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : ""}`} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="h-1 bg-soft-warm rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary/40 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(tabs.findIndex(t => t.id === activeTab) + 1) * (100 / tabs.length)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-2xl border border-border p-8 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-2 gap-8 md:gap-12"
              >
                {/* Left side - Features */}
                <div>
                  <h3 className="font-heading text-2xl md:text-3xl font-bold text-graphite mb-6">
                    {content.title}
                  </h3>
                  
                  <ul className="space-y-4 mb-8">
                    {content.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-graphite/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-graphite">{content.highlight}</span>
                  </div>
                </div>

                {/* Right side - Visual */}
                <div className="space-y-4">
                  {/* Waveform visualization - fixed height to prevent layout shifts */}
                  <div className="bg-primary/10 rounded-xl p-6 flex items-center justify-center h-[80px]">
                    <div className="flex items-end justify-center gap-1 h-[32px]">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-primary/40 rounded-full"
                          style={{ height: 8 }}
                          animate={{
                            height: [8, Math.random() * 24 + 8, 8],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.05,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Insight cards */}
                  {content.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-soft-warm rounded-xl p-4 flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-graphite/80 text-sm">{insight}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
