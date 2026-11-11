import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

// Team photos
import jenniferPhoto from "@/assets/jennifer-team.jpg";
import danielPhoto from "@/assets/daniel-team.jpg";
import evaPhoto from "@/assets/eva-team.jpg";
import zanaPhoto from "@/assets/zana-team.jpg";

const teamMembers = [
  { 
    name: "Žana Kajganić", 
    role: "Operations & Intelligence", 
    detail: "Social Volunteer", 
    photo: zanaPhoto 
  },
  { 
    name: "Jennifer Nikolovic", 
    role: "Tech & Delivery", 
    detail: "Care Leaver", 
    photo: jenniferPhoto 
  },
  { 
    name: "Eva Feische", 
    role: "Product & Design", 
    detail: "Social Youth Work", 
    photo: evaPhoto 
  },
  { 
    name: "Daniel Genath", 
    role: "Sales & Finance", 
    detail: "Social Worker", 
    photo: danielPhoto 
  },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-16"
          >
            <p className="text-primary font-semibold text-xs md:text-sm tracking-wide uppercase mb-3 md:mb-4">
              Team
            </p>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-graphite mb-3 md:mb-4">
              Built for the complexities of social care
            </h1>
            <p className="text-base md:text-lg text-graphite/70 max-w-2xl mx-auto">
              Lived experience + engineering + design + domain expertise
            </p>
          </motion.div>

          {/* Team Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden mb-3 md:mb-4 shadow-md">
                  <img 
                    src={member.photo} 
                    alt={member.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-graphite mb-0.5 md:mb-1">
                  {member.name}
                </h3>
                
                <p className="text-xs sm:text-sm md:text-base font-medium text-graphite/80">
                  {member.role}
                </p>
                
                <p className="text-xs sm:text-sm text-graphite/60 italic">
                  {member.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
