"""Pydantic schemas for Universal Agent validation."""
from pydantic import BaseModel, Field
from typing import List


class HelpPlanDraft(BaseModel):
    """Help plan draft structure."""
    # Institutionsdaten (Header)
    institution_name: str = Field(description="Name of the institution", default="Jugendhilfe Horizont gGmbH")
    institution_address: str = Field(description="Institution address", default="Berliner Straße 42, 10715 Berlin")
    institution_contact: str = Field(description="Contact information", default="Tel: 030 / 123 456 78 | horizont@jugendhilfe.de")
    
    # Strukturierte Lebensbereiche
    private_life: List[str] = Field(description="Privates / Persönliche Situation", default=[])
    social_life: List[str] = Field(description="Soziales Umfeld", default=[])
    emotional_wellbeing: List[str] = Field(description="Gefühlswelt / Emotionale Lage", default=[])
    family_parents: List[str] = Field(description="Eltern / Familie", default=[])
    school_education: List[str] = Field(description="Schule / Ausbildung", default=[])
    
    # Klassische Felder (bleiben für Kompatibilität)
    goals: List[str] = Field(description="Overall help plan goals", default=[])
    actions: List[str] = Field(description="Recommended actions", default=[])


class UniversalAgentResult(BaseModel):
    """Universal AI Agent result structure."""
    summary: str = Field(description="Concise summary of the note")
    risks: List[str] = Field(description="Identified risks and concerns")
    keyFacts: List[str] = Field(description="Key factual points")
    reportSegment: str = Field(description="Professional report-ready text")
    helpPlanDraft: HelpPlanDraft = Field(description="Help plan recommendations")
    grammarFix: str = Field(description="Grammar-corrected version of text")

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "Emma berichtete über Isolation in der Schule und Konflikte mit Mitschülern.",
                "risks": ["Soziale Isolation", "Schulprobleme"],
                "keyFacts": ["Emma, 14 Jahre", "Konflikte in der Pause", "Rückzugsverhalten"],
                "reportSegment": "Die Klientin berichtet von zunehmender sozialer Isolation im schulischen Umfeld.",
                "helpPlanDraft": {
                    "goals": ["Verbesserung der sozialen Integration", "Stärkung des Selbstwertgefühls"],
                    "actions": ["Wöchentliche Gespräche mit Schulpsychologen", "Integration in Gruppenaktivitäten"]
                },
                "grammarFix": "Emma teilte ihre Sorgen über das Gefühl der Isolation in der Schule mit."
            }
        }

