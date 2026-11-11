import { useEffect } from "react";
import { Calendar } from "lucide-react";

interface CalendlyEmbedProps {
  /** Your Calendly username (e.g., "jennifer-carelo") */
  url: string;
  /** Inline embed (full height) or Popup button */
  type?: "inline" | "popup";
  /** Button text for popup type */
  buttonText?: string;
  /** Custom button className */
  buttonClassName?: string;
}

/**
 * Calendly Embed Component
 * 
 * Usage Examples:
 * 
 * 1. INLINE (Full page embed):
 * <CalendlyEmbed 
 *   url="https://calendly.com/jennifer-carelo/30min" 
 *   type="inline" 
 * />
 * 
 * 2. POPUP (Button opens modal):
 * <CalendlyEmbed 
 *   url="https://calendly.com/jennifer-carelo/30min" 
 *   type="popup" 
 *   buttonText="Book a Demo"
 * />
 */
export const CalendlyEmbed = ({ 
  url, 
  type = "popup", 
  buttonText = "Schedule Meeting",
  buttonClassName 
}: CalendlyEmbedProps) => {
  
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    // Load Calendly CSS
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const openCalendlyPopup = (e: React.MouseEvent) => {
    e.preventDefault();
    // @ts-ignore - Calendly global object
    if (window.Calendly) {
      // @ts-ignore
      window.Calendly.initPopupWidget({ url });
    }
  };

  if (type === "inline") {
    return (
      <div 
        className="calendly-inline-widget" 
        data-url={url}
        style={{ minWidth: "320px", height: "700px" }}
      />
    );
  }

  // Popup type
  const defaultClassName = "inline-flex items-center justify-center gap-2 bg-white text-graphite border-2 border-graphite/20 font-medium text-sm sm:text-base px-5 sm:px-7 py-3 sm:py-3.5 rounded-lg hover:bg-graphite/5 hover:border-graphite/30 transition-all duration-200";
  
  return (
    <button
      onClick={openCalendlyPopup}
      className={buttonClassName || defaultClassName}
    >
      <Calendar className="w-4 h-4" />
      <span>{buttonText}</span>
    </button>
  );
};
