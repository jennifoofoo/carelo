"""AI-powered Case Matcher - Finds the correct case based on note content."""
from typing import Optional, List
from sqlmodel import Session, select
from src.config import settings
from src.db.models import Case, User
from src.utils.ai_client import get_chat_client


class CaseMatcher:
    """Matches notes to cases by extracting client names from text."""

    def __init__(self, session: Session):
        self.session = session
        self.client = get_chat_client()
        self.model = settings.GEMINI_CHAT_MODEL
    
    def extract_client_name(self, text: str) -> Optional[str]:
        """
        Extract client/child name from note text using AI.
        
        Args:
            text: The note content
            
        Returns:
            Extracted client name or None if not found
        """
        if not text or len(text.strip()) < 10:
            return None
        
        prompt = f"""Du bist ein Assistent für Sozialarbeiter in Deutschland. 
Analysiere den folgenden Text und extrahiere den Namen des Kindes/Klienten, über den gesprochen wird.

WICHTIG:
- Extrahiere nur den Vornamen oder vollständigen Namen des Kindes/Klienten
- Ignoriere Namen von Erwachsenen (Eltern, Betreuern, etc.)
- Wenn kein Kindesname gefunden wird, antworte mit "KEIN_NAME"
- Antworte NUR mit dem Namen, ohne weitere Erklärungen

Text:
{text[:2000]}

Name des Kindes/Klienten:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Du bist ein präziser Assistent, der Namen aus Texten extrahiert. Antworte nur mit dem Namen oder 'KEIN_NAME'."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,  # Very low temperature for consistent extraction
                max_tokens=50,
            )
            
            extracted_name = response.choices[0].message.content.strip()
            
            # Clean up the response
            extracted_name = extracted_name.replace('"', '').replace("'", '').strip()
            
            if extracted_name.upper() == "KEIN_NAME" or not extracted_name:
                return None
            
            # Remove common prefixes/suffixes
            extracted_name = extracted_name.replace("Name des Kindes:", "").replace("Name:", "").strip()
            
            return extracted_name if len(extracted_name) > 1 else None
            
        except Exception as e:
            print(f"Error extracting client name: {e}")
            return None
    
    def find_matching_case(
        self, 
        client_name: str, 
        user_id: str,
        threshold: float = 0.7
    ) -> Optional[Case]:
        """
        Find the best matching case for a client name.
        
        Args:
            client_name: The extracted client name
            user_id: The user ID to filter cases
            threshold: Similarity threshold (0-1)
            
        Returns:
            Matching Case or None
        """
        if not client_name:
            return None
        
        # Get all cases for the user
        statement = select(Case).where(Case.user_id == user_id)
        all_cases = self.session.exec(statement).all()
        
        if not all_cases:
            return None
        
        # Simple exact match first
        client_name_lower = client_name.lower().strip()
        for case in all_cases:
            if case.client_name:
                case_name_lower = case.client_name.lower().strip()
                # Exact match
                if case_name_lower == client_name_lower:
                    return case
                # Partial match (name contains or is contained)
                if client_name_lower in case_name_lower or case_name_lower in client_name_lower:
                    return case
        
        # If no exact match, use AI to find best match
        return self._ai_match_case(client_name, all_cases)
    
    def _ai_match_case(self, client_name: str, cases: List[Case]) -> Optional[Case]:
        """Use AI to find the best matching case."""
        if not cases:
            return None
        
        # Create case list for AI
        case_list = "\n".join([
            f"- {case.client_name or case.title or 'Unnamed'} (ID: {case.id[:8]}...)"
            for case in cases[:20]  # Limit to 20 cases for token efficiency
        ])
        
        prompt = f"""Du bist ein Assistent für Sozialarbeiter. 
Finde den passenden Case für den Namen "{client_name}".

Verfügbare Cases:
{case_list}

Antworte NUR mit der Case-ID (die ersten 8 Zeichen) oder "KEIN_MATCH" wenn kein passender Case gefunden wird.

Case-ID:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Du findest den passenden Case basierend auf dem Namen. Antworte nur mit der Case-ID oder 'KEIN_MATCH'."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=20,
            )
            
            result = response.choices[0].message.content.strip()
            
            if result.upper() == "KEIN_MATCH":
                return None
            
            # Find case by partial ID match
            for case in cases:
                if case.id.startswith(result):
                    return case
            
            return None
            
        except Exception as e:
            print(f"Error in AI case matching: {e}")
            return None

