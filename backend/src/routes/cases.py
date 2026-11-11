"""Case management routes."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional

from src.db.session import get_session
from src.db.models import User, Case
from src.utils.auth_demo import get_current_user_demo as get_current_user

router = APIRouter()


# Request/Response models
class CaseCreate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    client_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str]
    client_name: Optional[str]
    client_id: Optional[str]
    status: str
    priority: Optional[str]
    description: Optional[str]
    created_at: str
    updated_at: str


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    request: CaseCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new case."""
    case = Case(
        user_id=current_user.id,
        title=request.title,
        client_name=request.client_name,
        client_id=request.client_id,
        description=request.description,
        priority=request.priority,
    )
    
    session.add(case)
    session.commit()
    session.refresh(case)
    
    return CaseResponse(
        id=case.id,
        user_id=case.user_id,
        title=case.title,
        client_name=case.client_name,
        client_id=case.client_id,
        status=case.status,
        priority=case.priority,
        description=case.description,
        created_at=case.created_at.isoformat(),
        updated_at=case.updated_at.isoformat(),
    )


@router.get("", response_model=List[CaseResponse])
async def list_cases(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    status_filter: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by client name or title"),
):
    """List all cases for the current user. Optionally search by client name or title."""
    statement = select(Case).where(Case.user_id == current_user.id)
    
    if status_filter:
        statement = statement.where(Case.status == status_filter)
    
    if search:
        # Search in client_name or title (case-insensitive)
        from sqlmodel import or_
        statement = statement.where(
            or_(
                Case.client_name.ilike(f"%{search}%"),
                Case.title.ilike(f"%{search}%"),
            )
        )
    
    cases = session.exec(statement.order_by(Case.created_at.desc())).all()
    
    return [
        CaseResponse(
            id=case.id,
            user_id=case.user_id,
            title=case.title,
            client_name=case.client_name,
            client_id=case.client_id,
            status=case.status,
            priority=case.priority,
            description=case.description,
            created_at=case.created_at.isoformat(),
            updated_at=case.updated_at.isoformat(),
        )
        for case in cases
    ]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a specific case."""
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
    
    return CaseResponse(
        id=case.id,
        user_id=case.user_id,
        title=case.title,
        client_name=case.client_name,
        client_id=case.client_id,
        status=case.status,
        priority=case.priority,
        description=case.description,
        created_at=case.created_at.isoformat(),
        updated_at=case.updated_at.isoformat(),
    )


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    request: CaseUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a case."""
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
    
    # Update fields
    if request.title is not None:
        case.title = request.title
    if request.client_name is not None:
        case.client_name = request.client_name
    if request.client_id is not None:
        case.client_id = request.client_id
    if request.description is not None:
        case.description = request.description
    if request.status is not None:
        case.status = request.status
    if request.priority is not None:
        case.priority = request.priority
    
    from datetime import datetime
    case.updated_at = datetime.utcnow()
    
    session.add(case)
    session.commit()
    session.refresh(case)
    
    return CaseResponse(
        id=case.id,
        user_id=case.user_id,
        title=case.title,
        client_name=case.client_name,
        client_id=case.client_id,
        status=case.status,
        priority=case.priority,
        description=case.description,
        created_at=case.created_at.isoformat(),
        updated_at=case.updated_at.isoformat(),
    )


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a case."""
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
    
    session.delete(case)
    session.commit()
    
    return None

