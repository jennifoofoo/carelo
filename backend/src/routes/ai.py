"""AI action routes with Universal Agent."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json

from src.db.session import get_session
from src.db.models import User, Case, Note
from src.utils.auth_demo import get_current_user_demo as get_current_user
from src.ai.universal import run_universal_agent, run_universal_agent_sync, UniversalAgentError
from src.ai.anonymizer import Anonymizer
from src.utils.rate_limiter import rate_limit
from fastapi import Request

router = APIRouter()


class UniversalAgentRequest(BaseModel):
    """Request to run Universal AI Agent on a note."""
    regenerate: Optional[bool] = False


class UniversalAgentResponse(BaseModel):
    """Response from Universal AI Agent."""
    status: str  # "processing", "ready", "error"
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/generate-help-plan")
@rate_limit(max_requests=3, window_seconds=300)  # 3 help plans per 5 minutes per user
async def generate_help_plan(
    case_id: str = Query(..., description="Case ID to generate help plan for"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Generate a help plan for a case based on all notes.
    
    Query parameter: case_id
    Returns a HelpPlanResponse with generated content.
    """
    from src.routes.help_plans import HelpPlanResponse, HelpPlanCreate, save_help_plan_as_note
    from src.db.models import HelpPlanDraft
    from datetime import datetime
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # 🎬 DEMO MODE: Hardcoded Help Plan for Ali Serageldin (Client ID: 42)
    # For pitch video - always returns perfect, predictable help plan
    if case.client_id == "42":
        print(f"🎬 DEMO MODE: Returning hardcoded help plan for Ali Serageldin")
        
        # Create hardcoded demo help plan
        content = {
            "period": "December 2024 – June 2025",
            
            # Institution Header
            "institution_name": "Jugendhilfe München Süd",
            "institution_address": "Leopoldstraße 15, 80802 München",
            "institution_contact": "Tel: 089 / 456 789 12 | info@jugendhilfe-muc.de",
            
            # Structured Life Areas (showing Ali's real situation)
            "privateLife": [
                "Living in shared apartment near TUM campus (WG) - stable housing situation",
                "Financial support through scholarship and part-time work - manageable but tight",
                "Daily routine chaotic - often works until late night, irregular sleep patterns",
                "Physical health good, but reports frequent stress-related headaches"
            ],
            "socialLife": [
                "Strong professional network (500+ LinkedIn connections, START Munich community)",
                "Limited deep personal friendships in Munich - most connections are work-related",
                "Misses close friends and social life from Egypt",
                "Difficulty disconnecting from work - evenings spent networking or coding instead of socializing"
            ],
            "emotionalWellbeing": [
                "Reports feeling overwhelmed by multiple leadership responsibilities",
                "Struggles with work-life balance and saying 'no' to opportunities",
                "High achievement pressure - both self-imposed and from family expectations",
                "Beginning to recognize need for mental health support and self-care"
            ],
            "familyParents": [
                "Parents and family still in Cairo - regular video calls weekly",
                "Close relationship with family but feels pressure to succeed and make them proud",
                "Doesn't want to worry family about stress levels - tends to minimize struggles",
                "Cultural expectations around success and independence create additional pressure"
            ],
            "schoolEducation": [
                "Computer Science student at Technical University of Munich (TUM) - challenging program",
                "Strong academic background (1.2 Abitur from Deutsche Evangelische Oberschule Kairo)",
                "Focus on AI/Deep Learning - passionate about technology and innovation",
                "Balancing demanding coursework with leadership roles in START Munich"
            ],
            
            # Goals
            "goals": [
                "Establish healthier work-life boundaries and learn to say 'no' to non-essential commitments",
                "Build deeper personal friendships beyond professional networking",
                "Develop sustainable stress management strategies and self-care routines",
                "Maintain academic performance while reducing overwhelm"
            ],
            
            # Actions
            "actions": [
                "Weekly counseling sessions focused on stress management and boundary-setting",
                "Introduce time-blocking technique: dedicated 'no-work' evenings for social activities",
                "Connect Ali with TUM peer support group for international students",
                "Monthly check-ins to review workload and identify opportunities to delegate or decline",
                "Encourage joining one non-work social activity (sports club, hobby group) for authentic connections"
            ],
            
            # Risks
            "risks": [
                "Burnout risk due to over-commitment and difficulty setting boundaries",
                "Social isolation - professional network is strong but personal connections are limited",
                "Academic performance may suffer if stress and workload continue unchecked",
                "Mental health deterioration if current pace continues without intervention"
            ],
            
            # Protective Factors
            "protectiveFactors": [
                "Strong intrinsic motivation and clear career goals",
                "Excellent professional network and community (START Munich)",
                "Supportive family in Egypt (regular contact)",
                "Self-awareness - recognizes issues and is seeking help proactively",
                "High intelligence and problem-solving abilities",
                "Previous success with entrepreneurial ventures demonstrates resilience"
            ],
            
            # Summary
            "summary": "Ali is an 18-year-old tech entrepreneur and TUM Computer Science student facing challenges with work-life balance and social isolation. Despite strong professional networks and academic capabilities, he struggles with over-commitment and difficulty maintaining personal relationships. The help plan focuses on establishing boundaries, building authentic social connections, and developing sustainable stress management strategies. With his self-awareness and support system, prognosis for positive change is good.",
            
            # Highlighted sentences (empty for demo)
            "highlightedSentences": [],
            
            # Critical Risks (from Ali's case notes)
            "criticalRisks": [
                {
                    "title": "Burnout Risk",
                    "description": "Multiple leadership roles combined with demanding studies create high risk of burnout",
                    "severity": "critical"
                },
                {
                    "title": "Social Isolation",
                    "description": "Limited personal friendships despite extensive professional network",
                    "severity": "critical"
                }
            ]
        }
        
        # Mark existing plans as not current
        from src.db.models import HelpPlanDraft
        statement = select(HelpPlanDraft).where(
            HelpPlanDraft.case_id == case_id,
            HelpPlanDraft.is_current == True,
        )
        existing_plans = session.exec(statement).all()
        
        max_version = 0
        for plan in existing_plans:
            plan.is_current = False
            session.add(plan)
            if plan.version > max_version:
                max_version = plan.version
        
        # Create new help plan
        help_plan = HelpPlanDraft(
            case_id=case_id,
            version=max_version + 1,
            is_current=True,
        )
        help_plan.set_content(content)
        
        session.add(help_plan)
        session.commit()
        session.refresh(help_plan)
        
        print(f"✅ Demo help plan created: {help_plan.id}")
        
        # Return response
        return {
            "id": help_plan.id,
            "case_id": case_id,
            "version": help_plan.version,
            "content": content,
            "is_current": True,
            "created_at": help_plan.created_at.isoformat() if help_plan.created_at else None,
            "updated_at": help_plan.updated_at.isoformat() if help_plan.updated_at else None,
        }
    # END DEMO MODE
    
    # Get all notes for the case
    statement = select(Note).where(Note.case_id == case_id)
    notes = session.exec(statement.order_by(Note.created_at.desc())).all()
    
    if not notes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No notes found for this case. Please add notes first.",
        )
    
    # Get highlights (general category) for help plan
    from src.db.models import Highlight, Insight
    highlight_statement = select(Highlight).where(
        Highlight.case_id == case_id,
        Highlight.category == "general",  # All highlights are now general category
        Highlight.is_used == False,  # Only unused highlights
    )
    highlights = session.exec(highlight_statement.order_by(Highlight.created_at.desc())).all()
    
    # Get Critical Risks from AI Insights
    insight_statement = select(Insight).where(
        Insight.case_id == case_id,
        Insight.type == "risk",
        Insight.severity == "critical",
    )
    critical_risks = session.exec(insight_statement.order_by(Insight.created_at.desc()).limit(5)).all()
    
    # Combine all normalized note content
    combined_text = "\n\n".join([
        note.normalized or note.raw_content or ""
        for note in notes
        if note.normalized or note.raw_content
    ])
    
    # Build context with priority information at the top
    context_parts = []
    
    # 1. Critical Risks (highest priority)
    if critical_risks:
        risk_texts = "\n".join([
            f"- {risk.title or risk.get_content().get('description', 'Risk identified')}"
            for risk in critical_risks
        ])
        context_parts.append(f"CRITICAL RISKS IDENTIFIED BY AI (must address in help plan):\n{risk_texts}")
    
    # 2. Highlighted sentences (user-selected priority content)
    if highlights:
        highlighted_texts = "\n".join([
            f"- {h.text}"
            for h in highlights
        ])
        context_parts.append(f"IMPORTANT HIGHLIGHTED SENTENCES (include these in the help plan):\n{highlighted_texts}")
    
    # 3. Case notes
    context_parts.append(f"CASE NOTES:\n{combined_text}")
    
    # Combine all parts
    combined_text = "\n\n---\n\n".join(context_parts)
    
    if not combined_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No content found in notes. Please ensure notes are processed.",
        )
    
    # Generate help plan using Universal Agent
    try:
        print(f"🤖 Generating help plan for case {case_id[:8]}...")
        # Use async version since we're in an async endpoint
        result = await run_universal_agent(combined_text)
        result_dict = result.model_dump()
        
        # Extract help plan draft from result
        help_plan_content = result_dict.get('help_plan_draft', {})
        
        # Add highlighted sentences to actions/summary if they weren't already included
        highlighted_sentences = [h.text for h in highlights] if highlights else []
        
        # Create structured help plan content with all new fields
        content = {
            "period": f"{datetime.now().strftime('%B %Y')} – {datetime.now().replace(month=(datetime.now().month + 5) % 12 + 1).strftime('%B %Y')}",
            
            # Institution Header
            "institution_name": help_plan_content.get('institution_name', 'Jugendhilfe Horizont gGmbH'),
            "institution_address": help_plan_content.get('institution_address', 'Berliner Straße 42, 10715 Berlin'),
            "institution_contact": help_plan_content.get('institution_contact', 'Tel: 030 / 123 456 78 | horizont@jugendhilfe.de'),
            
            # Structured Life Areas
            "privateLife": help_plan_content.get('private_life', []),
            "socialLife": help_plan_content.get('social_life', []),
            "emotionalWellbeing": help_plan_content.get('emotional_wellbeing', []),
            "familyParents": help_plan_content.get('family_parents', []),
            "schoolEducation": help_plan_content.get('school_education', []),
            
            # Classic Fields (kept for compatibility)
            "goals": help_plan_content.get('goals', []) if isinstance(help_plan_content.get('goals'), list) else [],
            "actions": help_plan_content.get('actions', []) if isinstance(help_plan_content.get('actions'), list) else [],
            "risks": result_dict.get('risks', []) if isinstance(result_dict.get('risks'), list) else [],
            "protectiveFactors": help_plan_content.get('protective_factors', []) if isinstance(help_plan_content.get('protective_factors'), list) else [],
            "summary": help_plan_content.get('summary', result_dict.get('summary', '')) or "Generated help plan based on case notes.",
            "highlightedSentences": highlighted_sentences,  # Store highlighted sentences for reference
            
            # Include critical risks for reference
            "criticalRisks": [
                {
                    "title": risk.title,
                    "description": risk.get_content().get('description', ''),
                    "severity": risk.severity
                }
                for risk in critical_risks
            ] if critical_risks else []
        }
        
        # Mark highlights as used
        for highlight in highlights:
            highlight.is_used = True
            session.add(highlight)
        
        # Mark existing plans as not current
        statement = select(HelpPlanDraft).where(
            HelpPlanDraft.case_id == case_id,
            HelpPlanDraft.is_current == True,
        )
        existing_plans = session.exec(statement).all()
        
        max_version = 0
        for plan in existing_plans:
            plan.is_current = False
            session.add(plan)
            if plan.version > max_version:
                max_version = plan.version
        
        # Create new help plan
        help_plan = HelpPlanDraft(
            case_id=case_id,
            version=max_version + 1,
            is_current=True,
        )
        help_plan.set_content(content)
        
        session.add(help_plan)
        session.commit()
        session.refresh(help_plan)
        
        # Save as note in "Help Plans" category
        try:
            save_help_plan_as_note(session, case_id, content, help_plan.version)
        except Exception as e:
            print(f"⚠️ Warning: Could not save help plan as note: {e}")
            # Don't fail the request if note saving fails
        
        return HelpPlanResponse(
            id=help_plan.id,
            case_id=help_plan.case_id,
            content=help_plan.get_content(),
            version=help_plan.version,
            is_current=help_plan.is_current,
            created_at=help_plan.created_at.isoformat(),
        )
        
    except UniversalAgentError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}",
        )
    except Exception as e:
        print(f"❌ Error generating help plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate help plan: {str(e)}",
        )


@router.post("/notes/{note_id}/universal", response_model=UniversalAgentResponse)
async def run_universal_analysis(
    note_id: str,
    request: UniversalAgentRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Run Universal AI Agent on a note.
    
    Returns structured analysis:
    - Summary
    - Risks
    - Key Facts  
    - Report Segment
    - Help Plan Draft
    - Grammar Fix
    
    If regenerate=False and ai_result exists, returns cached result.
    If regenerate=True, forces new analysis.
    """
    # Fetch note
    statement = select(Note).where(Note.id == note_id)
    note = session.exec(statement).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == note.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Check if normalized text exists
    if not note.normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note not yet processed. Normalized text missing.",
        )
    
    # Return cached result if exists and not regenerating
    if note.note_metadata and not request.regenerate:
        try:
            metadata = eval(note.note_metadata) if isinstance(note.note_metadata, str) else note.note_metadata
            if isinstance(metadata, dict) and 'ai_result' in metadata:
                return UniversalAgentResponse(
                    status="ready",
                    result=metadata['ai_result']
                )
        except:
            pass
    
    # Run Universal Agent (async - would be Celery task in production)
    try:
        print(f"🤖 Running Universal Agent on note {note_id[:8]}...")
        
        # Use async version since we're in an async endpoint
        result = await run_universal_agent(note.normalized)
        result_dict = result.model_dump()
        
        # Save result to note metadata
        metadata = {}
        if note.note_metadata:
            try:
                metadata = eval(note.note_metadata) if isinstance(note.note_metadata, str) else {}
            except:
                metadata = {}
        
        metadata['ai_result'] = result_dict
        metadata['ai_status'] = 'ready'
        
        note.note_metadata = str(metadata)
        session.add(note)
        session.commit()
        
        print(f"✅ Universal Agent completed for note {note_id[:8]}")
        
        return UniversalAgentResponse(
            status="ready",
            result=result_dict
        )
        
    except UniversalAgentError as e:
        print(f"❌ Universal Agent error: {e}")
        return UniversalAgentResponse(
            status="error",
            error=str(e)
        )
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return UniversalAgentResponse(
            status="error",
            error="Analysis failed"
        )


@router.get("/notes/{note_id}/analysis", response_model=UniversalAgentResponse)
async def get_note_analysis(
    note_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get cached Universal Agent analysis for a note."""
    # Fetch note
    statement = select(Note).where(Note.id == note_id)
    note = session.exec(statement).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Verify access
    statement = select(Case).where(
        Case.id == note.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Check for cached result
    if note.note_metadata:
        try:
            metadata = eval(note.note_metadata) if isinstance(note.note_metadata, str) else note.note_metadata
            if isinstance(metadata, dict) and 'ai_result' in metadata:
                return UniversalAgentResponse(
                    status=metadata.get('ai_status', 'ready'),
                    result=metadata['ai_result']
                )
        except:
            pass
    
    return UniversalAgentResponse(
        status="not_analyzed",
        error="No analysis available. Run /ai/notes/{id}/universal first."
    )


class AnonymizeResponse(BaseModel):
    """Response for anonymization."""
    status: str  # "ready", "error"
    anonymized_note_id: Optional[str] = None
    anonymized_text: Optional[str] = None
    replacements: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


@router.post("/notes/{note_id}/anonymize", response_model=AnonymizeResponse)
@rate_limit(max_requests=5, window_seconds=300)  # 5 anonymizations per 5 minutes per user
async def anonymize_note(
    note_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Anonymize a note by creating an anonymized version.
    
    Creates a new note with anonymized content that can be safely shared.
    """
    from src.db.models import Note as NoteModel
    
    # Fetch original note
    statement = select(Note).where(Note.id == note_id)
    original_note = session.exec(statement).first()
    
    if not original_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == original_note.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    # Check if normalized text exists
    text_to_anonymize = original_note.normalized or original_note.raw_content
    if not text_to_anonymize:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note has no content to anonymize.",
        )
    
    try:
        print(f"🔒 Anonymizing note {note_id[:8]}...")
        
        # Anonymize text
        anonymizer = Anonymizer()
        result = anonymizer.anonymize_text(text_to_anonymize, preserve_context=True)
        
        # Create new anonymized note
        anonymized_note = NoteModel(
            case_id=original_note.case_id,
            source="text",
            raw_content=result["anonymized_text"],
            normalized=result["anonymized_text"],
            processing_status="completed",
            note_metadata=json.dumps({
                "anonymized": True,
                "original_note_id": note_id,
                "replacements": result.get("replacements", {}),
                "detected_entities": result.get("detected_entities", []),
                "category": "Anonymized Reports"
            })
        )
        
        session.add(anonymized_note)
        session.commit()
        session.refresh(anonymized_note)
        
        print(f"✅ Anonymized note created: {anonymized_note.id[:8]}")
        
        return AnonymizeResponse(
            status="ready",
            anonymized_note_id=anonymized_note.id,
            anonymized_text=result["anonymized_text"],
            replacements=result.get("replacements", {})
        )
        
    except Exception as e:
        print(f"❌ Error anonymizing note: {e}")
        import traceback
        traceback.print_exc()
        return AnonymizeResponse(
            status="error",
            error=str(e)
        )


class CaseOverviewResponse(BaseModel):
    """Response for case AI overview."""
    summary: str
    statistics: Dict[str, Any]
    trends: List[Dict[str, Any]]
    risks: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    help_plan_progress: Optional[Dict[str, Any]] = None


@router.get("/cases/{case_id}/overview", response_model=CaseOverviewResponse)
async def get_case_overview(
    case_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generate comprehensive AI overview for a case.
    
    Returns:
    - AI-generated summary
    - Statistics (notes count, tasks, risk level, last update)
    - Trends and patterns
    - Active risks
    - AI recommendations
    - Help plan progress
    """
    from src.db.models import Task, Insight, HelpPlanDraft
    from datetime import datetime, timedelta, timezone
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Get all data for the case
    notes = session.exec(select(Note).where(Note.case_id == case_id).order_by(Note.created_at.desc())).all()
    tasks = session.exec(select(Task).where(Task.case_id == case_id)).all()
    insights = session.exec(select(Insight).where(Insight.case_id == case_id).order_by(Insight.created_at.desc())).all()
    help_plans = session.exec(select(HelpPlanDraft).where(HelpPlanDraft.case_id == case_id, HelpPlanDraft.is_current == True)).all()
    
    # Calculate statistics
    total_notes = len(notes)
    open_tasks = len([t for t in tasks if t.status == "open"])
    completed_tasks = len([t for t in tasks if t.status == "completed"])
    
    # Determine risk level from insights
    high_risks = [i for i in insights if i.type == "risk" and i.severity == "high"]
    medium_risks = [i for i in insights if i.type == "risk" and i.severity == "medium"]
    if high_risks:
        risk_level = "High"
    elif medium_risks:
        risk_level = "Medium"
    else:
        risk_level = "Low"
    
    # Last update time
    last_update = None
    if notes:
        last_update = notes[0].created_at
    elif tasks:
        last_update = max([t.updated_at for t in tasks])
    elif case.updated_at:
        last_update = case.updated_at
    
    if last_update:
        now = datetime.now(timezone.utc)
        if last_update.tzinfo is None:
            last_update_utc = last_update.replace(tzinfo=timezone.utc)
        else:
            last_update_utc = last_update
        time_diff = now - last_update_utc
        if time_diff < timedelta(hours=1):
            last_update_str = f"{int(time_diff.total_seconds() / 60)}m"
        elif time_diff < timedelta(days=1):
            last_update_str = f"{int(time_diff.total_seconds() / 3600)}h"
        else:
            last_update_str = f"{int(time_diff.days)}d"
    else:
        last_update_str = "Never"
    
    # Combine recent notes for AI analysis
    recent_notes = notes[:20]  # Last 20 notes
    combined_text = "\n\n".join([
        f"Note from {note.created_at.strftime('%Y-%m-%d')}:\n{note.normalized or note.raw_content or ''}"
        for note in recent_notes
        if note.normalized or note.raw_content
    ])
    
    # Generate AI summary using Universal Agent
    summary = "No summary available. Please add notes to generate insights."
    trends = []
    recommendations = []
    
    if combined_text.strip():
        try:
            print(f"🤖 Generating AI overview for case {case_id[:8]}...")
            result = await run_universal_agent(combined_text)
            result_dict = result.model_dump()
            
            # Extract summary
            summary = result_dict.get('summary', '') or f"Case overview for {case.client_name or 'client'}. {total_notes} notes recorded, {open_tasks} open tasks."
            
            # Generate trends from notes (simplified - could be enhanced with time-series analysis)
            if total_notes > 0:
                now = datetime.now(timezone.utc)
                recent_count = len([
                    n for n in notes 
                    if (now - (n.created_at.replace(tzinfo=timezone.utc) if n.created_at.tzinfo is None else n.created_at)).days < 7
                ])
                trends = [
                    {
                        "label": "Recent Activity",
                        "value": min(100, int((recent_count / max(1, total_notes)) * 100)),
                        "trend": "up" if recent_count > total_notes / 4 else "stable",
                        "description": f"{recent_count} notes in last week"
                    }
                ]
            
            # Generate recommendations from AI analysis
            risks_list = result_dict.get('risks', [])
            if risks_list:
                recommendations.append({
                    "title": "Review Risk Assessment",
                    "reason": f"{len(risks_list)} risks identified in recent analysis",
                    "priority": "high"
                })
            
            if open_tasks > 0:
                recommendations.append({
                    "title": "Review Open Tasks",
                    "reason": f"{open_tasks} tasks require attention",
                    "priority": "medium" if open_tasks < 5 else "high"
                })
            
            if not help_plans:
                recommendations.append({
                    "title": "Generate Help Plan",
                    "reason": "No current help plan available",
                    "priority": "medium"
                })
            
        except Exception as e:
            print(f"⚠️  Error generating AI overview: {e}")
            summary = f"Case overview for {case.client_name or 'client'}. {total_notes} notes recorded, {open_tasks} open tasks."
    
    # Format risks from insights
    formatted_risks = []
    for insight in insights[:5]:  # Top 5 risks
        if insight.type == "risk":
            content = insight.get_content() if hasattr(insight, 'get_content') else {}
            analysis = content.get('analysis', '') if isinstance(content, dict) else ''
            formatted_risks.append({
                "title": insight.title,
                "severity": insight.severity or "medium",
                "mentions": 1,  # Could count mentions across notes
                "lastSeen": "Recently"  # Could calculate from insight.created_at
            })
    
    # Help plan progress
    help_plan_progress = None
    if help_plans:
        plan = help_plans[0]
        content = plan.get_content() if hasattr(plan, 'get_content') else {}
        goals = content.get('goals', []) if isinstance(content, dict) else []
        actions = content.get('actions', []) if isinstance(content, dict) else []
        
        # Calculate progress (simplified - could be enhanced)
        completed_actions = len([a for a in actions if isinstance(a, str) and 'completed' in a.lower()])
        total_actions = len(actions) if actions else 1
        
        help_plan_progress = {
            "goals": [
                {
                    "goal": goal if isinstance(goal, str) else str(goal),
                    "progress": 50,  # Simplified
                    "status": "on-track"
                }
                for goal in goals[:3]
            ]
        }
    
    return CaseOverviewResponse(
        summary=summary,
        statistics={
            "total_notes": total_notes,
            "open_tasks": open_tasks,
            "completed_tasks": completed_tasks,
            "risk_level": risk_level,
            "last_update": last_update_str
        },
        trends=trends if trends else [
            {
                "label": "Activity",
                "value": 50,
                "trend": "stable",
                "description": "Normal activity level"
            }
        ],
        risks=formatted_risks if formatted_risks else [],
        recommendations=recommendations if recommendations else [
            {
                "title": "Add More Notes",
                "reason": "More data needed for comprehensive analysis",
                "priority": "low"
            }
        ],
        help_plan_progress=help_plan_progress
    )
