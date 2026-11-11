"""Extract risks action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for extracting risks from a note."""
    return f"""Analyze the following case note and identify any risks, concerns, or red flags that require attention.

Case Context:
- Client: {case.client_name or 'Unknown'}
- Case Status: {case.status}

Note Content:
{note.normalized}

Identify and categorize risks as:
- CRITICAL: Immediate safety concerns
- HIGH: Urgent issues requiring prompt attention
- MEDIUM: Important concerns to monitor
- LOW: Minor issues to be aware of

For each risk, provide:
1. Description
2. Severity level
3. Recommended action

Format your response clearly with risk levels and specific details."""

