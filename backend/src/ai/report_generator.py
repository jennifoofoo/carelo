"""AI Report Generator Service."""
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlmodel import Session, select

from src.config import settings
from src.db.models import Case, Note, Task, HelpPlanDraft, Insight, ReportTemplate, Highlight
from src.utils.ai_client import get_chat_client


class ReportGenerator:
    """Service for generating professional reports using AI."""

    def __init__(self, session: Session):
        self.session = session
        self.client = get_chat_client()
        self.model = settings.GEMINI_CHAT_MODEL
    
    def generate_report(
        self,
        case: Case,
        template: ReportTemplate,
        custom_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a report for a case using a template.
        
        Args:
            case: Case object
            template: ReportTemplate object
            custom_data: Optional custom data to include
            
        Returns:
            Dictionary with generated report content
        """
        # Collect all case data
        case_data = self._collect_case_data(case)
        
        # Get template structure
        template_structure = template.get_structure()
        required_fields = template.get_required_fields()
        
        # Generate report using AI
        report_content = self._generate_with_ai(
            case=case,
            case_data=case_data,
            template_structure=template_structure,
            template_name=template.name,
            template_category=template.category,
            required_fields=required_fields,
            custom_data=custom_data or {}
        )
        
        return report_content
    
    def _collect_case_data(self, case: Case) -> Dict[str, Any]:
        """Collect all relevant data for a case."""
        # Get notes
        notes = self.session.exec(
            select(Note).where(Note.case_id == case.id)
            .order_by(Note.created_at.desc())
        ).all()
        
        # Get tasks
        tasks = self.session.exec(
            select(Task).where(Task.case_id == case.id)
        ).all()
        
        # Get help plans
        help_plans = self.session.exec(
            select(HelpPlanDraft).where(
                HelpPlanDraft.case_id == case.id,
                HelpPlanDraft.is_current == True
            )
        ).all()
        
        # Get insights
        insights = self.session.exec(
            select(Insight).where(Insight.case_id == case.id)
            .order_by(Insight.created_at.desc())
        ).all()
        
        # Get highlights (general category, unused)
        highlights = self.session.exec(
            select(Highlight).where(
                Highlight.case_id == case.id,
                Highlight.category == "general",
                Highlight.is_used == False
            ).order_by(Highlight.created_at.desc())
        ).all()
        
        # Combine notes content
        notes_content = []
        for note in notes[:50]:  # Last 50 notes
            if note.normalized or note.raw_content:
                notes_content.append({
                    "date": note.created_at.isoformat(),
                    "content": note.normalized or note.raw_content,
                    "source": note.source
                })
        
        # Format tasks
        tasks_list = []
        for task in tasks:
            tasks_list.append({
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "created_at": task.created_at.isoformat()
            })
        
        # Format help plans
        help_plans_list = []
        for plan in help_plans:
            help_plans_list.append(plan.get_content())
        
        # Format insights
        insights_list = []
        for insight in insights[:20]:  # Last 20 insights
            content = insight.get_content()
            insights_list.append({
                "type": insight.type,
                "title": insight.title,
                "severity": insight.severity,
                "content": content
            })
        
        # Format highlights
        highlights_list = [h.text for h in highlights]
        
        return {
            "case": {
                "client_name": case.client_name,
                "client_id": case.client_id,
                "title": case.title,
                "status": case.status,
                "priority": case.priority,
                "description": case.description,
                "created_at": case.created_at.isoformat(),
                "updated_at": case.updated_at.isoformat()
            },
            "notes": notes_content,
            "tasks": tasks_list,
            "help_plans": help_plans_list,
            "insights": insights_list,
            "highlights": highlights_list,
            "statistics": {
                "total_notes": len(notes),
                "open_tasks": len([t for t in tasks if t.status == "open"]),
                "completed_tasks": len([t for t in tasks if t.status == "completed"]),
                "help_plans_count": len(help_plans),
                "insights_count": len(insights)
            }
        }
    
    def _generate_with_ai(
        self,
        case: Case,
        case_data: Dict[str, Any],
        template_structure: Dict[str, Any],
        template_name: str,
        template_category: str,
        required_fields: List[str],
        custom_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate report content using AI."""
        
        # Build prompt based on template category
        prompt = self._build_prompt(
            case=case,
            case_data=case_data,
            template_structure=template_structure,
            template_name=template_name,
            template_category=template_category,
            required_fields=required_fields,
            custom_data=custom_data
        )
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(template_category)
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"❌ Error generating report: {e}")
            raise Exception(f"Failed to generate report: {str(e)}")
    
    def _get_system_prompt(self, category: str) -> str:
        """Get system prompt based on report category."""
        prompts = {
            "youth_office": """You are a professional social work report writer specializing in youth office documentation in Germany.
You create formal, structured reports for Jugendamt (Youth Office) including Hilfepläne (Help Plans) and Gefährdungseinschätzungen (Risk Assessments).
Your reports must be:
- Professional and objective
- Fact-based and evidence-supported
- Compliant with German social work standards
- Clear and structured
- Suitable for official documentation""",
            
            "court": """You are a professional social work report writer specializing in court documentation in Germany.
You create formal reports for family courts (Familiengericht) regarding custody (Sorgerecht) and visitation (Umgang) matters.
Your reports must be:
- Legally appropriate and objective
- Fact-based with clear evidence
- Professional and neutral
- Structured for court proceedings
- Compliant with German legal standards""",
            
            "quarterly": """You are a professional social work report writer creating quarterly progress reports.
You summarize case progress, achievements, challenges, and next steps over a three-month period.
Your reports must be:
- Comprehensive yet concise
- Highlighting key developments
- Professional and clear
- Suitable for internal and external stakeholders""",
            
            "handover": """You are a professional social work report writer creating case handover reports.
You create comprehensive summaries for transferring cases between social workers or organizations.
Your reports must be:
- Complete and detailed
- Clear about current status
- Highlighting important history
- Actionable for the receiving party""",
            
            "custom": """You are a professional social work report writer.
You create customized reports based on specific template requirements.
Your reports must be:
- Professional and appropriate
- Fact-based and evidence-supported
- Clear and well-structured
- Tailored to the specific requirements"""
        }
        
        return prompts.get(category, prompts["custom"])
    
    def _build_prompt(
        self,
        case: Case,
        case_data: Dict[str, Any],
        template_structure: Dict[str, Any],
        template_name: str,
        template_category: str,
        required_fields: List[str],
        custom_data: Dict[str, Any]
    ) -> str:
        """Build the AI prompt for report generation."""
        
        # Format case data for prompt
        notes_text = "\n\n".join([
            f"[{n['date'][:10]}] {n['content']}"
            for n in case_data["notes"][:30]  # Last 30 notes
        ])
        
        tasks_text = "\n".join([
            f"- {t['title']} ({t['status']}, {t['priority'] or 'no priority'})"
            for t in case_data["tasks"]
        ])
        
        help_plan_text = ""
        if case_data["help_plans"]:
            plan = case_data["help_plans"][0]
            help_plan_text = f"""
Current Help Plan:
- Goals: {', '.join(plan.get('goals', []))}
- Actions: {', '.join(plan.get('actions', []))}
- Risks: {', '.join(plan.get('risks', []))}
- Summary: {plan.get('summary', 'N/A')}
"""
        
        insights_text = "\n".join([
            f"- [{i['type']}] {i['title']}: {json.dumps(i.get('content', {}))}"
            for i in case_data["insights"][:10]
        ])
        
        highlights_text = ""
        if case_data.get("highlights"):
            highlights_text = f"""
IMPORTANT HIGHLIGHTED SENTENCES (MUST be included in the report):
{chr(10).join([f"- {h}" for h in case_data["highlights"]])}
"""
        
        prompt = f"""Generate a professional {template_name} report for the following case.

CASE INFORMATION:
Client: {case.client_name or 'N/A'}
Case ID: {case.client_id or case.id[:8]}
Status: {case.status}
Priority: {case.priority or 'N/A'}
Description: {case.description or 'N/A'}

CASE NOTES (Most Recent):
{notes_text[:5000] if len(notes_text) > 5000 else notes_text}

TASKS:
{tasks_text if tasks_text else "No tasks recorded"}

{help_plan_text if help_plan_text else ""}

AI INSIGHTS:
{insights_text if insights_text else "No insights available"}

{highlights_text if highlights_text else ""}

STATISTICS:
- Total Notes: {case_data['statistics']['total_notes']}
- Open Tasks: {case_data['statistics']['open_tasks']}
- Completed Tasks: {case_data['statistics']['completed_tasks']}

TEMPLATE STRUCTURE:
{json.dumps(template_structure, indent=2)}

REQUIRED FIELDS:
{', '.join(required_fields) if required_fields else 'All standard fields'}

CUSTOM DATA:
{json.dumps(custom_data, indent=2) if custom_data else 'None'}

Generate a complete report following the template structure. Return as JSON with the following format:
{{
  "title": "Report Title",
  "sections": [
    {{
      "section_title": "Section Name",
      "content": "Section content...",
      "subsections": []
    }}
  ],
  "metadata": {{
    "generated_at": "ISO timestamp",
    "case_id": "case ID",
    "template_used": "template name"
  }}
}}

Ensure the report is:
1. Professional and appropriate for {template_category} context
2. Fact-based and evidence-supported
3. Well-structured and easy to read
4. Complete with all required fields
5. Suitable for official documentation
6. MUST include all highlighted sentences naturally within the report content"""
        
        return prompt

