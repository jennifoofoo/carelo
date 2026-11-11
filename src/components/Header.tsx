import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How it works", href: "/#demo" },
    { label: "About us", href: "/about" },
  ];

  return (
    <>
      {/* Orange top strip */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary" />
      
      {/* Main header */}
      <header className="fixed top-1 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <a href="/" className="group">
              <span className="font-heading text-2xl font-bold tracking-tight text-primary">
                Carelo
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[13px] font-medium text-graphite/70 tracking-wide hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {/* Desktop CTA */}
              <a 
                href="/dashboard" 
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium tracking-wide rounded-md hover:bg-primary-light transition-colors"
              >
                <span>Try Demo</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 -mr-2 text-graphite hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-graphite/10 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-[68px] left-0 right-0 z-50 bg-white border-b border-border md:hidden">
            <nav className="flex flex-col py-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-6 py-3 text-[14px] font-medium text-graphite tracking-wide hover:bg-muted hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              {/* Mobile CTA in menu */}
              <div className="px-6 py-4 border-t border-border mt-2">
                <a 
                  href="/dashboard" 
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white text-[14px] font-medium tracking-wide rounded-md hover:bg-primary-light transition-colors"
                >
                  <span>Try Demo</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};
