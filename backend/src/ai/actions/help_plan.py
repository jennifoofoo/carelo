"""Help plan generation action."""
from src.db.models import Note, Case


def get_prompt(note: Note, case: Case) -> str:
    """Generate prompt for creating a help plan from a note."""
    return f"""Based on the following case note, create a structured help plan for the client.

Case Context:
- Client: {case.client_name or 'Unknown'}
- Case Status: {case.status}

Note Content:
{note.normalized}

Create a help plan with:
1. Assessment: What are the client's current needs?
2. Goals: What outcomes should we work toward?
3. Action Items: Specific steps to take
4. Resources: Services, programs, or support available
5. Timeline: Suggested timeframe for actions

Be specific, actionable, and client-centered."""

