"""Extract tasks action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for extracting action items/tasks from a note."""
    return f"""Extract all action items, tasks, and follow-up activities from the following case note.

Case Context:
- Client: {case.client_name or 'Unknown'}
- Case Status: {case.status}

Note Content:
{note.normalized}

For each task, provide:
- Task description (clear and actionable)
- Priority (High, Medium, Low)
- Suggested deadline (if applicable)
- Responsible party (if mentioned)

Format as a numbered list of actionable tasks."""

