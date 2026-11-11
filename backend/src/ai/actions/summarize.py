"""Summarize action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for summarizing a note."""
    return f"""Summarize the following case note in a clear, concise manner. Focus on key points, important details, and action items.

Case Context:
- Client: {case.client_name or 'Unknown'}
- Case Status: {case.status}

Note Content:
{note.normalized}

Provide a professional summary suitable for social work documentation."""

