"""AI Pipeline for running modular actions."""
from typing import Tuple, List
from src.config import settings
from src.db.models import Note, Case
from src.utils.tokenizer import count_tokens, calculate_cost
from src.utils.ai_client import get_chat_client


class AIPipeline:
    """Central AI pipeline for running modular actions."""

    def __init__(self):
        self.client = get_chat_client()
        self.model = settings.GEMINI_CHAT_MODEL
    
    def run_action(self, action: str, note: Note, case: Case) -> Tuple[str, int, float]:
        """
        Run a specific AI action on a note.
        
        Args:
            action: Action name (summarize, extract_risks, etc.)
            note: Note object
            case: Case object
        
        Returns:
            Tuple of (result, tokens_used, cost)
        """
        # Load action module
        action_module = self._load_action(action)
        
        # Get prompt from action module
        prompt = action_module.get_prompt(note, case)
        
        # Run completion
        result, tokens, cost = self._run_completion(prompt)
        
        return result, tokens, cost
    
    def _load_action(self, action: str):
        """Dynamically load action module."""
        try:
            if action == "summarize":
                from src.ai.actions import summarize
                return summarize
            elif action == "extract_risks":
                from src.ai.actions import extract_risks
                return extract_risks
            elif action == "help_plan":
                from src.ai.actions import help_plan
                return help_plan
            elif action == "tasks":
                from src.ai.actions import tasks
                return tasks
            elif action == "report_segment":
                from src.ai.actions import report_segment
                return report_segment
            elif action == "translate":
                from src.ai.actions import translate
                return translate
            elif action == "fix_grammar":
                from src.ai.actions import fix_grammar
                return fix_grammar
            else:
                raise ValueError(f"Unknown action: {action}")
        except ImportError as e:
            raise ValueError(f"Action module not found: {action}") from e
    
    def _run_completion(self, prompt: str) -> Tuple[str, int, float]:
        """
        Run OpenAI completion.
        
        Args:
            prompt: The prompt to send
        
        Returns:
            Tuple of (result, tokens_used, cost)
        """
        # Count input tokens
        input_tokens = count_tokens(prompt, self.model)
        
        # Run completion
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        result = response.choices[0].message.content
        
        # Calculate tokens and cost
        output_tokens = count_tokens(result, self.model)
        total_tokens = input_tokens + output_tokens
        cost = calculate_cost(input_tokens, output_tokens, self.model)
        
        return result, total_tokens, cost
    
    def generate_help_plan(self, case: Case, notes: List[Note]) -> dict:
        """
        Generate a comprehensive help plan for a case.
        
        Args:
            case: Case object
            notes: List of Note objects
        
        Returns:
            Dictionary with help plan structure
        """
        # Combine all note content
        combined_content = "\n\n".join([
            f"Note {i+1} ({note.source}):\n{note.normalized}"
            for i, note in enumerate(notes)
            if note.normalized
        ])
        
        prompt = f"""Based on the following case notes for a social work case, generate a comprehensive help plan.

Case Information:
- Client: {case.client_name or 'Unknown'}
- Case ID: {case.client_id or 'N/A'}
- Status: {case.status}

Case Notes:
{combined_content}

Generate a structured help plan with the following sections:
1. Assessment Summary
2. Identified Needs
3. Goals
4. Action Items
5. Resources
6. Timeline
7. Follow-up Plan

Return the response as a JSON object with these keys."""
        
        result, _, _ = self._run_completion(prompt)
        
        # Try to parse as JSON, fallback to structured dict
        import json
        try:
            plan = json.loads(result)
        except json.JSONDecodeError:
            # Fallback structure
            plan = {
                "assessment_summary": result,
                "identified_needs": [],
                "goals": [],
                "action_items": [],
                "resources": [],
                "timeline": "",
                "follow_up_plan": ""
            }
        
        return plan

