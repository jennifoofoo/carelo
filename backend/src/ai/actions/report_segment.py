"""Generate report segment action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for creating a formal report segment."""
    return f"""Convert the following case note into a formal report segment suitable for official documentation.

Case Context:
- Client: {case.client_name or 'Unknown'}
- Case Status: {case.status}

Note Content:
{note.normalized}

Transform this into professional report language:
- Use third-person perspective
- Follow social work documentation standards
- Be objective and factual
- Include relevant dates, observations, and actions
- Maintain confidentiality standards

Provide a well-structured report segment."""

