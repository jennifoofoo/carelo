"""File upload and management routes."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List

from src.db.session import get_session
from src.db.models import User, Case, File
from src.utils.auth_demo import get_current_user_demo as get_current_user
from src.utils.file_storage import file_storage
from src.queue.tasks import process_file_ingest

router = APIRouter()


# Response models
class FileResponse(BaseModel):
    id: str
    case_id: str
    filename: str
    original_filename: str
    mimetype: str
    size: int
    processing_status: str
    created_at: str


@router.post("", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    case_id: str,
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Upload a file to a case."""
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
    
    # Save file to storage
    storage_path, unique_filename = file_storage.save_file(
        file.file,
        file.filename or "unnamed"
    )
    
    # Create file record
    file_record = File(
        case_id=case_id,
        filename=unique_filename,
        original_filename=file.filename or "unnamed",
        mimetype=file.content_type or "application/octet-stream",
        size=file.size or 0,
        storage_path=storage_path,
        processing_status="pending",
    )
    
    session.add(file_record)
    session.commit()
    session.refresh(file_record)
    
    # Queue processing
    process_file_ingest.delay(file_record.id)
    
    return FileResponse(
        id=file_record.id,
        case_id=file_record.case_id,
        filename=file_record.filename,
        original_filename=file_record.original_filename,
        mimetype=file_record.mimetype,
        size=file_record.size,
        processing_status=file_record.processing_status,
        created_at=file_record.created_at.isoformat(),
    )


@router.get("", response_model=List[FileResponse])
async def list_files(
    case_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """List all files for a case."""
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
    
    # Get files
    statement = select(File).where(File.case_id == case_id)
    files = session.exec(statement.order_by(File.created_at.desc())).all()
    
    return [
        FileResponse(
            id=f.id,
            case_id=f.case_id,
            filename=f.filename,
            original_filename=f.original_filename,
            mimetype=f.mimetype,
            size=f.size,
            processing_status=f.processing_status,
            created_at=f.created_at.isoformat(),
        )
        for f in files
    ]


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get file metadata."""
    statement = select(File).where(File.id == file_id)
    file = session.exec(statement).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == file.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    
    return FileResponse(
        id=file.id,
        case_id=file.case_id,
        filename=file.filename,
        original_filename=file.original_filename,
        mimetype=file.mimetype,
        size=file.size,
        processing_status=file.processing_status,
        created_at=file.created_at.isoformat(),
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a file."""
    statement = select(File).where(File.id == file_id)
    file = session.exec(statement).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    
    # Verify case belongs to user
    statement = select(Case).where(
        Case.id == file.case_id,
        Case.user_id == current_user.id,
    )
    case = session.exec(statement).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    
    # Delete from storage
    file_storage.delete_file(file.storage_path)
    
    # Delete record
    session.delete(file)
    session.commit()
    
    return None

