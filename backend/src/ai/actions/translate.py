"""Translate action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for translating a note to English."""
    return f"""Translate the following text to English. Maintain the original meaning, tone, and context. If the text is already in English, return it as is.

Text to translate:
{note.normalized}

Provide only the translation without explanations or commentary."""

