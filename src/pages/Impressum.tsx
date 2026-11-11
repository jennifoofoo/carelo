import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Page Title */}
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Impressum
          </h1>
          <p className="text-muted-foreground mb-12">
            Angaben gemäß § 5 TMG und § 55 RStV
          </p>

          <div className="space-y-10">
            {/* Anbieter */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Angaben zum Diensteanbieter
              </h2>
              <div className="space-y-3 text-foreground/90">
                <p>
                  <span className="text-muted-foreground text-sm block">Name</span>
                  Jennifer Nikolovic
                </p>
                <p>
                  <span className="text-muted-foreground text-sm block">Rechtsform</span>
                  Einzelunternehmen
                </p>
              </div>
            </section>

            {/* Adresse */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Postanschrift
              </h2>
              <address className="not-italic space-y-1 text-foreground/90">
                <p>Steinickeweg 7</p>
                <p>80798 München</p>
                <p>Deutschland</p>
              </address>
            </section>

            {/* Kontakt */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Kontakt
              </h2>
              <div className="space-y-2 text-foreground/90">
                <p>
                  <span className="text-muted-foreground text-sm">E-Mail: </span>
                  <a href="mailto:jennifer@carelo.org" className="hover:text-primary transition-colors">
                    jennifer@carelo.org
                  </a>
                </p>
                <p>
                  <span className="text-muted-foreground text-sm">Telefon: </span>
                  <a href="tel:+491626967900" className="hover:text-primary transition-colors">
                    +49 162 6967900
                  </a>
                </p>
              </div>
            </section>

            {/* Vertretungsberechtigte */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Vertretungsberechtigte Person
              </h2>
              <div className="space-y-2 text-foreground/90">
                <p>
                  <span className="text-muted-foreground text-sm block">Inhaberin</span>
                  Jennifer Nikolovic
                </p>
              </div>
            </section>

            {/* Umsatzsteuer */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Umsatzsteuer
              </h2>
              <p className="text-foreground/90">
                Nicht umsatzsteuerpflichtig gemäß § 19 UStG (Kleinunternehmerregelung)
              </p>
            </section>

            {/* Inhaltlich Verantwortlicher */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Inhaltlich Verantwortliche gemäß § 55 Abs. 2 RStV
              </h2>
              <div className="space-y-1 text-foreground/90">
                <p>Jennifer Nikolovic</p>
                <p>Steinickeweg 7</p>
                <p>80798 München</p>
              </div>
            </section>

            {/* Haftungsausschluss */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                Haftungsausschluss
              </h2>
              
              <div className="space-y-6 text-foreground/80 text-sm leading-relaxed">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Haftung für Inhalte</h3>
                  <p>
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
                    Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten 
                    nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
                    Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                    Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                    Tätigkeit hinweisen.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Haftung für Links</h3>
                  <p>
                    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
                    Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                    Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
                    Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf 
                    mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der 
                    Verlinkung nicht erkennbar.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Urheberrecht</h3>
                  <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                    dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
                    der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
                    Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind 
                    nur für den privaten, nicht kommerziellen Gebrauch gestattet.
                  </p>
                </div>
              </div>
            </section>

            {/* Streitschlichtung */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                EU-Streitschlichtung
              </h2>
              <p className="text-foreground/80 text-sm leading-relaxed">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a 
                  href="https://ec.europa.eu/consumers/odr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                <br />
                Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder verpflichtet, 
                an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground mt-16 pt-6 border-t border-border">
            Stand: Dezember 2024
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Impressum;
