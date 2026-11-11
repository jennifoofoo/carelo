import { motion } from 'framer-motion';
import { PitchSlideWrapper, PitchHeaderBlock, PITCH_COLORS, PITCH_SPACING } from './PitchSlideWrapper';

// Business Model Canvas Slide - Appendix - Responsive with horizontal scroll
const BusinessModelCanvasSlide = () => {
  return (
    <PitchSlideWrapper>
      <div className="flex flex-col items-center w-full flex-1">
        {/* Unified Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-7xl"
        >
          <PitchHeaderBlock 
            badge="Appendix" 
            title="Business Model Canvas"
            badgeVariant="appendix"
          />
        </motion.div>

        {/* Canvas Grid - Horizontal scroll on small screens */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-7xl overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          <div 
            className="border-2 min-w-[800px]"
            style={{ 
              borderColor: PITCH_COLORS.heading,
            }}
          >
          <div className="grid grid-cols-10 grid-rows-[auto_auto]">
            {/* Top Row */}
            <div 
              className="col-span-2 border-r-2 border-b-2 p-3 sm:p-4 lg:p-5"
              style={{ borderColor: PITCH_COLORS.heading }}
            >
              <h3 
                className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                style={{ color: PITCH_COLORS.accent }}
              >
                Key Partners
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                <li>○ <strong>Lighthouse customers</strong></li>
                <li>○ <strong>Social care homes</strong> as customers and development partners</li>
                <li>○ <strong>Regulators</strong> to ensure compliance</li>
                <li>○ <strong>Social care workers</strong> themselves to gain trust</li>
                <li>○ <strong>Organisations</strong> to gain access to and trust from the social homes</li>
                <li>○ Secure <strong>cloud hoster</strong></li>
                <li>○ Potentially system vendors for API integration</li>
              </ul>
            </div>

            <div className="col-span-2 border-r-2 flex flex-col" style={{ borderColor: PITCH_COLORS.heading }}>
              <div className="border-b-2 flex-1 p-3 sm:p-4 lg:p-5" style={{ borderColor: PITCH_COLORS.heading }}>
                <h3 
                  className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                  style={{ color: PITCH_COLORS.accent }}
                >
                  Key Activities
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                  <li>○ <strong>Field sales</strong></li>
                  <li>○ <strong>Technical development</strong> (and enhancement)</li>
                  <li>○ <strong>Customer Success</strong> Mgmt</li>
                  <li>○ Data security</li>
                </ul>
              </div>
              <div className="border-b-2 flex-1 p-3 sm:p-4 lg:p-5" style={{ borderColor: PITCH_COLORS.heading }}>
                <h3 
                  className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                  style={{ color: PITCH_COLORS.accent }}
                >
                  Key Resources
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                  <li>○ <strong>Execution</strong> capabilities</li>
                  <li>○ Personal <strong>know-how and experience</strong> of sector</li>
                  <li>○ <strong>AI</strong> knowledge</li>
                  <li>○ Proprietary reports</li>
                </ul>
              </div>
            </div>

            <div 
              className="col-span-2 border-r-2 border-b-2 flex items-center justify-center p-3 sm:p-4 lg:p-5"
              style={{ borderColor: PITCH_COLORS.heading }}
            >
              <div className="text-center">
                <h3 
                  className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                  style={{ color: PITCH_COLORS.accent }}
                >
                  Value Proposition
                </h3>
                <p className="italic leading-relaxed text-xs sm:text-sm lg:text-base">
                  <span className="font-semibold" style={{ color: PITCH_COLORS.accent }}>Carelo</span> is automating patient documentation and care plans for social care homes to decrease time spent on reporting.
                </p>
              </div>
            </div>

            <div className="col-span-2 border-r-2 flex flex-col" style={{ borderColor: PITCH_COLORS.heading }}>
              <div className="border-b-2 flex-1 p-3 sm:p-4 lg:p-5" style={{ borderColor: PITCH_COLORS.heading }}>
                <h3 
                  className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                  style={{ color: PITCH_COLORS.accent }}
                >
                  Customer Relationships
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                  <li>○ Regular <strong>in-person</strong> exchanges</li>
                  <li>○ Treat as <strong>development partners</strong></li>
                  <li>○ <strong>Customer Success</strong> Mgmt</li>
                </ul>
              </div>
              <div className="border-b-2 flex-1 p-3 sm:p-4 lg:p-5" style={{ borderColor: PITCH_COLORS.heading }}>
                <h3 
                  className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                  style={{ color: PITCH_COLORS.accent }}
                >
                  Main Channels
                </h3>
                <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                  <li>○ <strong>In-person visits</strong></li>
                  <li>○ <strong>Industry conferences</strong></li>
                  <li>○ <strong>Inbound website</strong> channel (E-)mails, calls</li>
                  <li>○ Social media for workers</li>
                </ul>
              </div>
            </div>

            <div 
              className="col-span-2 border-b-2 p-3 sm:p-4 lg:p-5"
              style={{ borderColor: PITCH_COLORS.heading }}
            >
              <h3 
                className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                style={{ color: PITCH_COLORS.accent }}
              >
                Customer Segments
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                <li>○ Main target customer is <strong>stationary social care homes</strong>, specifically <span className="underline decoration-[#B71C1C]">Jugendheime</span> and <span className="underline decoration-[#B71C1C]">Eingliederungshilfe</span></li>
                <li>○ Reporting need is very similar: Documentation and <span className="underline decoration-[#B71C1C]">"Hilfepläne"</span></li>
                <li>○ Very specific niche</li>
                <li>○ We focus on privately owned institutions, not publicly owned, as incentives are different</li>
                <li>○ Secondary segments are other social occupations</li>
              </ul>
            </div>

            {/* Bottom Row */}
            <div 
              className="col-span-5 border-r-2 p-3 sm:p-4 lg:p-5"
              style={{ borderColor: PITCH_COLORS.heading }}
            >
              <h3 
                className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                style={{ color: PITCH_COLORS.accent }}
              >
                Cost Structures
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                <li>○ Initial product development costs – financed by EXIST</li>
                <li>○ Field sales & regulation lobbying</li>
                <li>○ Compliance consultant / knowledge and certification renewals</li>
                <li>○ Operational costs, incl. cloud hosting, cybersecurity, support</li>
              </ul>
            </div>

            <div 
              className="col-span-5 p-3 sm:p-4 lg:p-5"
            >
              <h3 
                className="font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3"
                style={{ color: PITCH_COLORS.accent }}
              >
                Revenue Streams
              </h3>
              <ul className="space-y-1 text-xs sm:text-sm lg:text-base leading-relaxed">
                <li>○ B2B SaaS sales 10 EUR / month / seat</li>
                <li>○ Capped at no of reports, if this no is bigger, pay-per-usage (per report)</li>
                <li>○ Pay-per-seat model</li>
                <li>○ Additional revenue streams to be developed: AI compliance audit, Enterprise KPI Dashboards, ...</li>
              </ul>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </PitchSlideWrapper>
  );
};

export default BusinessModelCanvasSlide;