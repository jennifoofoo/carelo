"""Create default report templates."""
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlmodel import Session, select
from src.db.session import engine
from src.db.models import ReportTemplate, User

def create_default_templates():
    """Create default system report templates."""
    print("📋 Creating default report templates...")
    
    with Session(engine) as session:
        # Check if templates already exist
        existing = session.exec(select(ReportTemplate).where(ReportTemplate.is_system_template == True)).first()
        if existing:
            print("✅ Default templates already exist")
            return
        
        # Template 1: Jugendamt Hilfeplan
        template1 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Jugendamt Hilfeplan",
            category="youth_office",
            description="Formeller Hilfeplan für das Jugendamt gemäß SGB VIII",
            is_system_template=True,
            is_active=True
        )
        template1.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "client_name", "label": "Name des Klienten", "type": "text", "required": True},
                        {"name": "client_id", "label": "Aktenzeichen", "type": "text", "required": True},
                        {"name": "report_date", "label": "Datum", "type": "date", "required": True},
                        {"name": "social_worker", "label": "Bearbeiter/in", "type": "text", "required": True}
                    ]
                },
                {
                    "id": "situation",
                    "title": "Aktuelle Situation",
                    "required": True,
                    "fields": [
                        {"name": "current_situation", "label": "Beschreibung der aktuellen Situation", "type": "textarea", "required": True},
                        {"name": "family_structure", "label": "Familienstruktur", "type": "textarea", "required": False},
                        {"name": "living_situation", "label": "Wohnsituation", "type": "textarea", "required": False}
                    ]
                },
                {
                    "id": "goals",
                    "title": "Ziele",
                    "required": True,
                    "fields": [
                        {"name": "goals", "label": "Hilfeziele", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "measures",
                    "title": "Hilfemaßnahmen",
                    "required": True,
                    "fields": [
                        {"name": "measures", "label": "Geplante Maßnahmen", "type": "list", "required": True},
                        {"name": "duration", "label": "Zeitraum", "type": "text", "required": True}
                    ]
                },
                {
                    "id": "risks",
                    "title": "Risiken und Gefährdungen",
                    "required": False,
                    "fields": [
                        {"name": "risks", "label": "Identifizierte Risiken", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "resources",
                    "title": "Ressourcen und Schutzfaktoren",
                    "required": False,
                    "fields": [
                        {"name": "resources", "label": "Ressourcen", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "summary",
                    "title": "Zusammenfassung",
                    "required": True,
                    "fields": [
                        {"name": "summary", "label": "Zusammenfassung", "type": "textarea", "required": True}
                    ]
                }
            ]
        })
        template1.set_required_fields(["client_name", "current_situation", "goals", "measures", "summary"])
        session.add(template1)
        
        # Template 2: Gefährdungseinschätzung
        template2 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Gefährdungseinschätzung",
            category="youth_office",
            description="Gefährdungseinschätzung nach §8a SGB VIII",
            is_system_template=True,
            is_active=True
        )
        template2.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "client_name", "label": "Name des Kindes/Jugendlichen", "type": "text", "required": True},
                        {"name": "client_id", "label": "Aktenzeichen", "type": "text", "required": True},
                        {"name": "assessment_date", "label": "Datum der Einschätzung", "type": "date", "required": True}
                    ]
                },
                {
                    "id": "concern",
                    "title": "Anlass der Gefährdungsmeldung",
                    "required": True,
                    "fields": [
                        {"name": "concern_description", "label": "Beschreibung des Anlasses", "type": "textarea", "required": True},
                        {"name": "reporter", "label": "Meldende Person/Stelle", "type": "text", "required": False}
                    ]
                },
                {
                    "id": "assessment",
                    "title": "Einschätzung der Gefährdung",
                    "required": True,
                    "fields": [
                        {"name": "risk_level", "label": "Gefährdungsstufe", "type": "select", "options": ["keine", "latent", "akut", "kritisch"], "required": True},
                        {"name": "risk_factors", "label": "Risikofaktoren", "type": "list", "required": True},
                        {"name": "protective_factors", "label": "Schutzfaktoren", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "measures",
                    "title": "Eingeleitete Maßnahmen",
                    "required": True,
                    "fields": [
                        {"name": "immediate_measures", "label": "Sofortmaßnahmen", "type": "list", "required": False},
                        {"name": "planned_measures", "label": "Geplante Maßnahmen", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "conclusion",
                    "title": "Fazit",
                    "required": True,
                    "fields": [
                        {"name": "conclusion", "label": "Zusammenfassende Einschätzung", "type": "textarea", "required": True}
                    ]
                }
            ]
        })
        template2.set_required_fields(["client_name", "concern_description", "risk_level", "risk_factors", "planned_measures", "conclusion"])
        session.add(template2)
        
        # Template 3: Gerichtsbericht Sorgerecht
        template3 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Gerichtsbericht Sorgerecht",
            category="court",
            description="Stellungnahme für Familiengericht zum Sorgerecht",
            is_system_template=True,
            is_active=True
        )
        template3.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "court", "label": "Gericht", "type": "text", "required": True},
                        {"name": "case_number", "label": "Aktenzeichen", "type": "text", "required": True},
                        {"name": "client_name", "label": "Name des Kindes", "type": "text", "required": True},
                        {"name": "report_date", "label": "Datum", "type": "date", "required": True}
                    ]
                },
                {
                    "id": "family_situation",
                    "title": "Familienverhältnisse",
                    "required": True,
                    "fields": [
                        {"name": "parents", "label": "Eltern", "type": "textarea", "required": True},
                        {"name": "current_custody", "label": "Aktuelles Sorgerecht", "type": "textarea", "required": True},
                        {"name": "child_situation", "label": "Situation des Kindes", "type": "textarea", "required": True}
                    ]
                },
                {
                    "id": "assessment",
                    "title": "Fachliche Einschätzung",
                    "required": True,
                    "fields": [
                        {"name": "child_welfare", "label": "Kindeswohl", "type": "textarea", "required": True},
                        {"name": "parental_capability", "label": "Erziehungsfähigkeit", "type": "textarea", "required": True},
                        {"name": "bonding", "label": "Bindung", "type": "textarea", "required": True}
                    ]
                },
                {
                    "id": "recommendation",
                    "title": "Empfehlung",
                    "required": True,
                    "fields": [
                        {"name": "recommendation", "label": "Empfehlung zum Sorgerecht", "type": "textarea", "required": True},
                        {"name": "reasoning", "label": "Begründung", "type": "textarea", "required": True}
                    ]
                }
            ]
        })
        template3.set_required_fields(["client_name", "family_situation", "child_welfare", "recommendation"])
        session.add(template3)
        
        # Template 4: Quartalsbericht
        template4 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Quartalsbericht",
            category="quarterly",
            description="Vierteljährlicher Fortschrittsbericht",
            is_system_template=True,
            is_active=True
        )
        template4.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "client_name", "label": "Klient/in", "type": "text", "required": True},
                        {"name": "quarter", "label": "Quartal", "type": "text", "required": True},
                        {"name": "period", "label": "Zeitraum", "type": "text", "required": True}
                    ]
                },
                {
                    "id": "progress",
                    "title": "Fortschritte",
                    "required": True,
                    "fields": [
                        {"name": "achievements", "label": "Erreichte Ziele", "type": "list", "required": True},
                        {"name": "developments", "label": "Entwicklungen", "type": "textarea", "required": True}
                    ]
                },
                {
                    "id": "challenges",
                    "title": "Herausforderungen",
                    "required": False,
                    "fields": [
                        {"name": "challenges", "label": "Herausforderungen", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "next_steps",
                    "title": "Nächste Schritte",
                    "required": True,
                    "fields": [
                        {"name": "next_steps", "label": "Geplante Maßnahmen", "type": "list", "required": True}
                    ]
                }
            ]
        })
        template4.set_required_fields(["client_name", "quarter", "achievements", "developments", "next_steps"])
        session.add(template4)
        
        # Template 5: Übergabebrief
        template5 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Übergabebrief",
            category="handover",
            description="Übergabebrief für Fallübergabe",
            is_system_template=True,
            is_active=True
        )
        template5.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "client_name", "label": "Klient/in", "type": "text", "required": True},
                        {"name": "handover_date", "label": "Übergabedatum", "type": "date", "required": True},
                        {"name": "from_worker", "label": "Übergebende/r", "type": "text", "required": True},
                        {"name": "to_worker", "label": "Übernehmende/r", "type": "text", "required": True}
                    ]
                },
                {
                    "id": "case_history",
                    "title": "Fallhistorie",
                    "required": True,
                    "fields": [
                        {"name": "case_start", "label": "Fallbeginn", "type": "date", "required": True},
                        {"name": "key_events", "label": "Wichtige Ereignisse", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "current_status",
                    "title": "Aktueller Stand",
                    "required": True,
                    "fields": [
                        {"name": "current_situation", "label": "Aktuelle Situation", "type": "textarea", "required": True},
                        {"name": "active_measures", "label": "Laufende Maßnahmen", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "important_info",
                    "title": "Wichtige Informationen",
                    "required": True,
                    "fields": [
                        {"name": "important_notes", "label": "Wichtige Hinweise", "type": "textarea", "required": True},
                        {"name": "contacts", "label": "Wichtige Kontakte", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "next_steps",
                    "title": "Nächste Schritte",
                    "required": True,
                    "fields": [
                        {"name": "next_steps", "label": "Empfohlene nächste Schritte", "type": "list", "required": True}
                    ]
                }
            ]
        })
        template5.set_required_fields(["client_name", "handover_date", "current_situation", "active_measures", "important_notes", "next_steps"])
        session.add(template5)
        
        # Template 6: Help Plan (AI-generated)
        template6 = ReportTemplate(
            user_id=None,
            organization_id=None,
            name="Help Plan",
            category="help_plan",
            description="AI-generierter Hilfeplan mit Goals, Actions, Risks und Protective Factors",
            is_system_template=True,
            is_active=True
        )
        template6.set_structure({
            "sections": [
                {
                    "id": "header",
                    "title": "Kopfzeile",
                    "required": True,
                    "fields": [
                        {"name": "client_name", "label": "Name des Klienten", "type": "text", "required": True},
                        {"name": "period", "label": "Zeitraum", "type": "text", "required": True},
                        {"name": "report_date", "label": "Datum", "type": "date", "required": True}
                    ]
                },
                {
                    "id": "goals",
                    "title": "Ziele",
                    "required": True,
                    "fields": [
                        {"name": "goals", "label": "Hilfeziele", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "actions",
                    "title": "Maßnahmen",
                    "required": True,
                    "fields": [
                        {"name": "actions", "label": "Geplante Maßnahmen", "type": "list", "required": True}
                    ]
                },
                {
                    "id": "risks",
                    "title": "Risiken",
                    "required": False,
                    "fields": [
                        {"name": "risks", "label": "Identifizierte Risiken", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "protective_factors",
                    "title": "Schutzfaktoren",
                    "required": False,
                    "fields": [
                        {"name": "protectiveFactors", "label": "Schutzfaktoren", "type": "list", "required": False}
                    ]
                },
                {
                    "id": "summary",
                    "title": "Zusammenfassung",
                    "required": True,
                    "fields": [
                        {"name": "summary", "label": "Zusammenfassung", "type": "textarea", "required": True}
                    ]
                }
            ]
        })
        template6.set_required_fields(["client_name", "period", "goals", "actions", "summary"])
        session.add(template6)
        
        session.commit()
        print(f"✅ Created {6} default report templates")
        print("   - Jugendamt Hilfeplan")
        print("   - Gefährdungseinschätzung")
        print("   - Gerichtsbericht Sorgerecht")
        print("   - Quartalsbericht")
        print("   - Übergabebrief")
        print("   - Help Plan")

if __name__ == "__main__":
    create_default_templates()

