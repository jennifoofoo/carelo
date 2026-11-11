"""AI-powered anonymization service for social work documents."""
import json
import re
from typing import Dict, Any, List, Tuple
from src.config import settings
from src.utils.ai_client import get_chat_client

class Anonymizer:
    """Service for anonymizing/pseudonymizing social work documents.

    Uses Gemini Flash for context-aware, DSGVO-compliant anonymization.
    Preserves professional content while replacing all personal identifiers.
    """

    def __init__(self):
        """Initialize Anonymizer with Gemini client."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured. Please set it in environment variables.")

        self.client = get_chat_client()
        self.model = settings.GEMINI_CHAT_MODEL
    
    def anonymize_text(
        self,
        text: str,
        preserve_context: bool = True
    ) -> Dict[str, Any]:
        """
        Anonymize text by replacing personal information with pseudonyms.
        
        Args:
            text: Original text to anonymize
            preserve_context: Whether to preserve contextual information (age, gender, etc.)
            
        Returns:
            Dictionary with:
            - anonymized_text: The anonymized version
            - replacements: Mapping of original -> pseudonym
            - detected_entities: List of detected personal information
        """
        if not text or len(text.strip()) < 10:
            return {
                "anonymized_text": text,
                "replacements": {},
                "detected_entities": []
            }
        
        prompt = self._build_anonymization_prompt(text, preserve_context)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a data protection specialist for social work documentation in Germany (DSGVO-compliant).
Your task is to anonymize documents while preserving ALL professional and contextual information.

CRITICAL RULES (DSGVO-compliant anonymization):
1. Replace ALL personal names (first and last names) with consistent generic placeholders:
   - Clients: "Client A", "Client B", etc.
   - Parents/Guardians: "Parent 1", "Parent 2", etc.
   - Children: "Child 1", "Child 2", etc.
   - Professionals: "Professional A", "Professional B", etc.
   - Use SAME placeholder for SAME person throughout the document

2. Replace ALL addresses with generic locations:
   - Specific addresses → "Address in City X", "Street Y in District Z"
   - Keep general city names only if not identifying the client

3. Replace ALL specific institutions with generic terms:
   - Schools → "School A", "School B"
   - Hospitals → "Hospital A", "Medical Facility B"
   - Organizations → "Organization A", "Institution B"

4. Replace ALL contact information:
   - Phone numbers → "Phone 1", "Phone 2"
   - Email addresses → "email1@example.com", "email2@example.com"

5. Replace ALL case numbers and file references:
   - Case IDs → "Case #XXX", "Case #YYY"
   - File numbers → "File #XXX"

6. Replace dates of birth with age ranges:
   - "born in 1990" → "born in the 1990s" or "age 30-35"
   - Keep event dates but anonymize birth dates

7. PRESERVE (DO NOT CHANGE):
   - All professional content, assessments, observations
   - All recommendations and action items
   - Professional terminology and social work language
   - General time references (dates of events, meetings)
   - Age ranges (but not exact birth dates)
   - Professional relationships and dynamics
   - All factual information about the case (without identifiers)

8. Maintain readability and professional tone throughout

9. Use consistent pseudonyms: if "Emma Schmidt" appears 5 times, always use "Client A" for all 5 occurrences

Return JSON with:
{
  "anonymized_text": "the fully anonymized text with all personal identifiers replaced",
  "replacements": {
    "Original Name": "Client A",
    "Original Address": "Address in City X",
    "Original Institution": "School A"
  },
  "detected_entities": [
    {"type": "name", "original": "Emma Schmidt", "replacement": "Client A"},
    {"type": "address", "original": "Hauptstraße 15, Berlin", "replacement": "Address in City X"},
    {"type": "institution", "original": "Grundschule am Park", "replacement": "School A"}
  ]
}"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "anonymized_text": result.get("anonymized_text", text),
                "replacements": result.get("replacements", {}),
                "detected_entities": result.get("detected_entities", [])
            }
            
        except Exception as e:
            print(f"❌ Error anonymizing text: {e}")
            # Fallback: Basic anonymization using regex
            return self._basic_anonymize(text)
    
    def _build_anonymization_prompt(self, text: str, preserve_context: bool) -> str:
        """Build the prompt for DSGVO-compliant anonymization."""
        return f"""Anonymize the following social work document according to German data protection standards (DSGVO/BDSG).

Original text:
{text}

CRITICAL REQUIREMENTS:
1. Replace ALL personal identifiers while preserving professional context
2. Use CONSISTENT pseudonyms throughout (same person = same placeholder)
3. Preserve ALL professional content, assessments, observations, recommendations
4. Maintain professional tone and readability
5. Keep general time references but anonymize birth dates
6. Replace specific institutions with generic terms
7. Ensure the document remains useful for professional purposes after anonymization

The anonymized version must:
- Be safe to share externally (no personal data)
- Retain all professional insights and recommendations
- Maintain the same structure and flow as the original
- Use consistent pseudonyms (e.g., "Emma Schmidt" → "Client A" everywhere)

Return the anonymized version as JSON with replacements mapping."""
    
    def _basic_anonymize(self, text: str) -> Dict[str, Any]:
        """Basic anonymization using regex patterns (fallback)."""
        replacements = {}
        anonymized = text
        
        # Pattern for names (capitalized words that might be names)
        # This is a simple fallback - AI is much better
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        
        # Pattern for email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        # Pattern for phone numbers (German format)
        phone_pattern = r'(\+49|0)[1-9]\d{1,4}[\s-]?\d{1,14}'
        
        # Replace emails
        emails = re.findall(email_pattern, anonymized)
        for i, email in enumerate(emails):
            replacement = f"email{i+1}@example.com"
            replacements[email] = replacement
            anonymized = anonymized.replace(email, replacement)
        
        # Replace phone numbers
        phones = re.findall(phone_pattern, anonymized)
        for i, phone in enumerate(phones):
            replacement = f"Phone {i+1}"
            replacements[phone] = replacement
            anonymized = anonymized.replace(phone, replacement)
        
        return {
            "anonymized_text": anonymized,
            "replacements": replacements,
            "detected_entities": []
        }

