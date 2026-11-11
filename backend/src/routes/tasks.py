"""Task management routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from src.db.session import get_session
from src.db.models import User, Case, Task
from src.utils.auth_demo import get_current_user_demo as get_current_user

router = APIRouter()


# Request/Response models
class TaskCreate(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


class TaskBatchCreate(BaseModel):
    case_id: str
    tasks: List[dict]  # List of {title, description?, priority?, due_date?}


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    case_id: str
    title: str
    description: Optional[str]
    status: str
    priority: Optional[str]
    due_date: Optional[str]
    completed_at: Optional[str]
    created_at: str


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    request: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new task."""
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == request.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    # Parse due_date if provided
    due_date = None
    if request.due_date:
        try:
            due_date = datetime.fromisoformat(request.due_date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Create task
    task = Task(
        case_id=request.case_id,
        title=request.title,
        description=request.description,
        priority=request.priority,
        due_date=due_date,
    )
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    return TaskResponse(
        id=task.id,
        case_id=task.case_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date.isoformat() if task.due_date else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        created_at=task.created_at.isoformat(),
    )


@router.post("/batch", response_model=List[TaskResponse], status_code=status.HTTP_201_CREATED)
async def batch_create_tasks(
    request: TaskBatchCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Batch create multiple tasks for a case (for AI-generated task suggestions)."""
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == request.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found",
        )
    
    created_tasks = []
    
    for task_data in request.tasks:
        # Parse due_date if provided
        due_date = None
        if task_data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(task_data['due_date'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                pass
        
        # Create task
        task = Task(
            case_id=request.case_id,
            title=task_data.get('title', ''),
            description=task_data.get('description'),
            priority=task_data.get('priority', 'medium'),
            due_date=due_date,
        )
        
        session.add(task)
        created_tasks.append(task)
    
    session.commit()
    
    # Refresh all tasks to get IDs
    for task in created_tasks:
        session.refresh(task)
    
    print(f"✅ Batch created {len(created_tasks)} tasks for case {request.case_id[:8]}")
    
    return [
        TaskResponse(
            id=task.id,
            case_id=task.case_id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date.isoformat() if task.due_date else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None,
            created_at=task.created_at.isoformat(),
        )
        for task in created_tasks
    ]


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all tasks for a case."""
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
    
    # Get tasks
    statement = select(Task).where(Task.case_id == case_id)
    tasks = session.exec(statement.order_by(Task.created_at.desc())).all()
    
    return [
        TaskResponse(
            id=task.id,
            case_id=task.case_id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date.isoformat() if task.due_date else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None,
            created_at=task.created_at.isoformat(),
        )
        for task in tasks
    ]


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    request: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update a task."""
    statement = select(Task).where(Task.id == task_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == task.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Update fields
    if request.title is not None:
        task.title = request.title
    if request.description is not None:
        task.description = request.description
    if request.status is not None:
        task.status = request.status
        if request.status == "completed" and not task.completed_at:
            task.completed_at = datetime.utcnow()
    if request.priority is not None:
        task.priority = request.priority
    if request.due_date is not None:
        try:
            task.due_date = datetime.fromisoformat(request.due_date.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    task.updated_at = datetime.utcnow()
    
    session.add(task)
    session.commit()
    session.refresh(task)
    
    return TaskResponse(
        id=task.id,
        case_id=task.case_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date.isoformat() if task.due_date else None,
        completed_at=task.completed_at.isoformat() if task.completed_at else None,
        created_at=task.created_at.isoformat(),
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a task."""
    statement = select(Task).where(Task.id == task_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == task.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    session.delete(task)
    session.commit()
    
    return None

