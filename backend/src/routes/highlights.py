"""Highlights routes for marking important sentences."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from src.db.session import get_session
from src.db.models import User, Case, Note, Highlight
from src.utils.auth_demo import get_current_user_demo as get_current_user

router = APIRouter()


class HighlightCreate(BaseModel):
    note_id: str
    text: str
    start_index: Optional[int] = None
    end_index: Optional[int] = None
    category: Optional[str] = None  # "help_plan", "monthly_report", "general"


class HighlightResponse(BaseModel):
    id: str
    note_id: str
    case_id: str
    text: str
    start_index: Optional[int] = None
    end_index: Optional[int] = None
    category: Optional[str] = None
    is_used: bool
    created_at: datetime


@router.post("", response_model=HighlightResponse, status_code=status.HTTP_201_CREATED)
async def create_highlight(
    request: HighlightCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a highlight from selected text in a note."""
    # Verify note exists
    statement = select(Note).where(Note.id == request.note_id)
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
    
    # Create highlight
    highlight = Highlight(
        note_id=request.note_id,
        case_id=note.case_id,
        text=request.text.strip(),
        start_index=request.start_index,
        end_index=request.end_index,
        category=request.category or "general",
        is_used=False,
        created_at=datetime.now(timezone.utc),
    )
    
    session.add(highlight)
    session.commit()
    session.refresh(highlight)
    
    return HighlightResponse(
        id=highlight.id,
        note_id=highlight.note_id,
        case_id=highlight.case_id,
        text=highlight.text,
        start_index=highlight.start_index,
        end_index=highlight.end_index,
        category=highlight.category,
        is_used=highlight.is_used,
        created_at=highlight.created_at,
    )


@router.get("", response_model=List[HighlightResponse])
async def list_highlights(
    case_id: Optional[str] = None,
    note_id: Optional[str] = None,
    category: Optional[str] = None,
    is_used: Optional[bool] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """List highlights, optionally filtered by case, note, category, or usage status."""
    statement = select(Highlight)
    
    # Filter by case_id if provided
    if case_id:
        # Verify case belongs to user
        case_statement = select(Case).where(
            Case.id == case_id,
            Case.user_id == current_user.id,
        )
        case = session.exec(case_statement).first()
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found",
            )
        statement = statement.where(Highlight.case_id == case_id)
    
    # Filter by note_id if provided
    if note_id:
        statement = statement.where(Highlight.note_id == note_id)
    
    # Filter by category if provided
    if category:
        statement = statement.where(Highlight.category == category)
    
    # Filter by is_used if provided
    if is_used is not None:
        statement = statement.where(Highlight.is_used == is_used)
    
    highlights = session.exec(statement.order_by(Highlight.created_at.desc())).all()
    
    return [
        HighlightResponse(
            id=h.id,
            note_id=h.note_id,
            case_id=h.case_id,
            text=h.text,
            start_index=h.start_index,
            end_index=h.end_index,
            category=h.category,
            is_used=h.is_used,
            created_at=h.created_at,
        )
        for h in highlights
    ]


@router.delete("/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_highlight(
    highlight_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a highlight."""
    statement = select(Highlight).where(Highlight.id == highlight_id)
    highlight = session.exec(statement).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == highlight.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    session.delete(highlight)
    session.commit()
    
    return None


@router.patch("/{highlight_id}/mark-used", response_model=HighlightResponse)
async def mark_highlight_used(
    highlight_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Mark a highlight as used (e.g., added to help plan)."""
    statement = select(Highlight).where(Highlight.id == highlight_id)
    highlight = session.exec(statement).first()
    
    if not highlight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Highlight not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == highlight.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    
    highlight.is_used = True
    session.add(highlight)
    session.commit()
    session.refresh(highlight)
    
    return HighlightResponse(
        id=highlight.id,
        note_id=highlight.note_id,
        case_id=highlight.case_id,
        text=highlight.text,
        start_index=highlight.start_index,
        end_index=highlight.end_index,
        category=highlight.category,
        is_used=highlight.is_used,
        created_at=highlight.created_at,
    )

