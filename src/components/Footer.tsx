import { Link } from "react-router-dom";

export const Footer = () => {
  const legalLinks = [
    { label: "Imprint", href: "/impressum" },
    { label: "Privacy", href: "/datenschutz" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <footer className="py-12 px-5 md:px-8 border-t border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="text-center md:text-left">
            <Link to="/" className="text-xl font-bold text-graphite">
              Carelo
            </Link>
            <p className="text-sm text-graphite/60 mt-1">
              AI documentation for child welfare.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {legalLinks.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-graphite/60 hover:text-graphite transition-colors"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-graphite/60 hover:text-graphite transition-colors"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-graphite/50">
            © 2025 Carelo
          </p>
        </div>
      </div>
    </footer>
  );
};
