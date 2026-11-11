"""Fix grammar action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for fixing grammar and spelling."""
    return f"""Fix all grammar, spelling, and punctuation errors in the following text. Maintain the original meaning and tone. Improve clarity where needed.

Text to fix:
{note.normalized}

Return the corrected text without explanations."""

