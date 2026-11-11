"""Insights routes."""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from src.db.session import get_session
from src.db.models import User, Case, Insight
from src.utils.auth_demo import get_current_user_demo as get_current_user
from src.ai.insights_engine import InsightsEngine
from src.utils.rate_limiter import rate_limit

router = APIRouter()


# Response models
class InsightResponse(BaseModel):
    id: str
    case_id: str
    type: str
    title: Optional[str]
    content: Dict[str, Any]
    severity: Optional[str]
    is_read: bool
    created_at: str


@router.get("", response_model=List[InsightResponse])
async def list_insights(
    case_id: str,
    insight_type: Optional[str] = None,
    prioritize_risks: bool = False,
    max_risks: int = 5,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    List all insights for a case.
    
    If prioritize_risks=true and insight_type=risk, returns LLM-prioritized risks.
    """
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
    
    # If prioritizing risks, use LLM to get top risks
    if prioritize_risks and insight_type == "risk":
        try:
            engine = InsightsEngine(session)
            prioritized_risks = engine.prioritize_risks(case, max_risks=max_risks)
            return [
                InsightResponse(
                    id=insight.id,
                    case_id=insight.case_id,
                    type=insight.type,
                    title=insight.title,
                    content=insight.get_content(),
                    severity=insight.severity,
                    is_read=insight.is_read,
                    created_at=insight.created_at.isoformat(),
                )
                for insight in prioritized_risks
            ]
        except Exception as e:
            print(f"⚠️ Error prioritizing risks: {e}")
            # Fallback to normal listing
    
    # Get insights normally
    statement = select(Insight).where(Insight.case_id == case_id)
    
    if insight_type:
        statement = statement.where(Insight.type == insight_type)
    
    insights = session.exec(statement.order_by(Insight.created_at.desc())).all()
    
    return [
        InsightResponse(
            id=insight.id,
            case_id=insight.case_id,
            type=insight.type,
            title=insight.title,
            content=insight.get_content(),
            severity=insight.severity,
            is_read=insight.is_read,
            created_at=insight.created_at.isoformat(),
        )
        for insight in insights
    ]


@router.post("/generate")
@rate_limit(max_requests=5, window_seconds=300)  # 5 insight generations per 5 minutes per user
async def trigger_insight_generation(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Generate insights for a case (direct execution, no Celery)."""
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
    
    try:
        # Generate insights directly (no Celery in demo mode)
        print(f"🤖 Generating insights for case {case_id[:8]}...")
        engine = InsightsEngine(session)
        insights = await asyncio.to_thread(engine.generate_insights_for_case, case)
        
        print(f"✅ Generated {len(insights)} insights for case {case_id[:8]}")
        
        return {
            "message": "Insights generated successfully",
            "case_id": case_id,
            "insights_count": len(insights),
        }
    except Exception as e:
        print(f"❌ Error generating insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}",
        )


@router.patch("/{insight_id}/read")
async def mark_insight_as_read(
    insight_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Mark an insight as read."""
    statement = select(Insight).where(Insight.id == insight_id)
    insight = session.exec(statement).first()
    
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == insight.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )
    
    insight.is_read = True
    session.add(insight)
    session.commit()
    
    return {"message": "Insight marked as read"}


@router.delete("/{insight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insight(
    insight_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete an insight."""
    statement = select(Insight).where(Insight.id == insight_id)
    insight = session.exec(statement).first()
    
    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == insight.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insight not found",
        )
    
    session.delete(insight)
    session.commit()
    
    return None

