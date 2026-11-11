import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FounderSection } from "@/components/sections/FounderSection";
import { DemoSection } from "@/components/sections/DemoSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* 1. Hero - Problem + Solution */}
      <HeroSection />
      
      {/* 2. How it works - Interactive Demo */}
      <DemoSection />
      
      {/* 3. Real Impact - Outcomes */}
      <OutcomesSection />
      
      {/* 4. Why We Exist - Founder Story */}
      <FounderSection />
      
      {/* 5. Trust & Security */}
      <TrustSection />
      
      {/* 6. Final CTA */}
      <FinalCTASection />
      
      <Footer />
    </div>
  );
};

export default Index;
