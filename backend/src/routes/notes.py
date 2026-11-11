"""Notes routes with frontend-ready responses."""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form
from fastapi.responses import StreamingResponse, FileResponse
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from io import BytesIO
from datetime import datetime
import os
import re
import json
import mimetypes

from src.db.session import get_session
from src.db.models import User, Case, Note
from src.utils.auth_demo import get_current_user_demo as get_current_user
from src.utils.file_storage import file_storage

# Celery is DISABLED in demo mode - direct processing instead
CELERY_AVAILABLE = False
process_note_ingest = None
print("⚠️  Celery DISABLED - Using direct processing for demo mode")
from src.config import settings

router = APIRouter()


# Request models
class TextNoteRequest(BaseModel):
    case_id: Optional[str] = None  # Optional - will be auto-detected if not provided
    content: str


# Response models (frontend-ready)
class NoteCreateResponse(BaseModel):
    note_id: str
    status: str  # "processing"
    case_id: Optional[str] = None  # Included if auto-detected


class NoteStatusResponse(BaseModel):
    id: str
    status: str  # "processing" | "ready" | "failed"
    normalized: Optional[str] = None


@router.post("/text", response_model=NoteCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_text_note(
    request: TextNoteRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a text note.
    
    If case_id is not provided, AI will automatically detect the case based on client name in the text.
    
    Frontend expects: {"note_id": "...", "status": "processing", "case_id": "..."}
    """
    case = None
    auto_detected = False
    
    # If case_id provided, verify it belongs to user
    if request.case_id:
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
    else:
        # Auto-detect case using AI
        from src.ai.case_matcher import CaseMatcher
        matcher = CaseMatcher(session)
        
        # Extract client name from text
        client_name = matcher.extract_client_name(request.content)
        
        if client_name:
            # Find matching case
            case = matcher.find_matching_case(client_name, current_user.id)
            auto_detected = True
            
            if not case:
                # No matching case found - create a new one
                case = Case(
                    user_id=current_user.id,
                    title=f"Case - {client_name}",
                    client_name=client_name,
                    status="active",
                    priority="medium",
                    description=f"Auto-created case for {client_name}",
                )
                session.add(case)
                session.commit()
                session.refresh(case)
                print(f"✅ Auto-created case for {client_name}: {case.id}")
        
        if not case:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine case. Please select a case or mention the client name in your note.",
            )
    
    # Create note
    note = Note(
        case_id=case.id,  # Use detected/verified case
        source="text",
        raw_content=request.content,
        processing_status="processing",
    )
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    # Direct processing (no Celery in demo mode)
    if note.source == "text":
        note.processing_status = "ready"
        note.normalized = note.raw_content
        session.add(note)
        session.commit()
        session.refresh(note)
    
    response = NoteCreateResponse(
        note_id=note.id,
        status=note.processing_status,
    )
    
    # Add case_id to response if auto-detected
    if auto_detected:
        response.case_id = case.id  # type: ignore
    
    return response


@router.post("/audio", response_model=NoteCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_audio_note(
    case_id: Optional[str] = Form(None),  # Optional - will be auto-detected after transcription
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create an audio note from uploaded file.
    
    If case_id is not provided, AI will automatically detect the case after transcription.
    
    Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
    Frontend expects: {"note_id": "...", "status": "processing", "case_id": "..."}
    """
    case = None
    auto_detected = False
    
    # If case_id provided, verify it belongs to user
    if case_id and case_id.strip():  # Check for non-empty string
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
    else:
        # No case_id provided - will auto-detect after transcription
        case_id = None  # Ensure it's None, not empty string
    
    # Validate file type
    allowed_types = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/wav", "audio/webm", "audio/m4a"]
    if file.content_type and not any(file.content_type.startswith(t) for t in ["audio/"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be an audio file.",
        )
    
    # Save file to storage
    storage_path, unique_filename = file_storage.save_file(
        file.file,
        file.filename or "audio.mp3"
    )
    
    # Create note with file path in raw_content
    # If no case_id, we'll set it after transcription
    # Use a temporary placeholder case_id if not provided (will be updated after transcription)
    temp_case_id = case_id if case_id else "00000000-0000-0000-0000-000000000000"  # Placeholder UUID
    
    note = Note(
        case_id=temp_case_id,  # Temporary - will be set after transcription if auto-detecting
        source="audio",
        raw_content=storage_path,  # Store file path for processing
        processing_status="processing",
    )
    note.set_metadata({
        "original_filename": file.filename,
        "mimetype": file.content_type,
        "size": file.size,
    })
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    # Direct processing (no Celery in demo mode)
    # Transcribe audio to text automatically
    try:
        from src.ingest.audio import audio_to_text
        from src.ingest.normalize import normalize_text
        
        print(f"🎤 Transcribing audio file: {storage_path}")
        transcribed_text = audio_to_text(storage_path)
        
        # Normalize the transcribed text
        normalized_text = normalize_text(transcribed_text)
        
        # If no case_id was provided, try to auto-detect from transcribed text
        if not case_id and normalized_text:
            from src.ai.case_matcher import CaseMatcher
            matcher = CaseMatcher(session)
            
            # Extract client name from transcribed text
            client_name = matcher.extract_client_name(normalized_text)
            
            if client_name:
                # Find matching case
                detected_case = matcher.find_matching_case(client_name, current_user.id)
                auto_detected = True
                
                if not detected_case:
                    # No matching case found - create a new one
                    detected_case = Case(
                        user_id=current_user.id,
                        title=f"Case - {client_name}",
                        client_name=client_name,
                        status="active",
                        priority="medium",
                        description=f"Auto-created case for {client_name}",
                    )
                    session.add(detected_case)
                    session.commit()
                    session.refresh(detected_case)
                    print(f"✅ Auto-created case for {client_name}: {detected_case.id}")
                
                # Update note with detected case
                if detected_case:
                    case = detected_case
                    note.case_id = case.id
                    session.add(note)
                    session.commit()
        
        # Update note with transcribed text
        note.normalized = normalized_text
        note.processing_status = "ready"
        
        # Update metadata with transcription info
        metadata = note.get_metadata()
        metadata["transcription_method"] = "whisper"
        metadata["transcription_status"] = "completed"
        note.set_metadata(metadata)
        
        session.add(note)
        session.commit()
        session.refresh(note)
        
        print(f"✅ Audio transcribed successfully. Text length: {len(normalized_text)} characters")
        
    except Exception as e:
        # If transcription fails, keep note in processing status
        # Frontend can check status and retry or show error
        print(f"⚠️ Audio transcription failed: {str(e)}")
        note.processing_status = "failed"
        
        # Update metadata with error info
        metadata = note.get_metadata()
        metadata["transcription_error"] = str(e)
        metadata["transcription_status"] = "failed"
        note.set_metadata(metadata)
        
        session.add(note)
        session.commit()
        session.refresh(note)
    
    response = NoteCreateResponse(
        note_id=note.id,
        status=note.processing_status,
    )
    
    # Add case_id to response if auto-detected
    if auto_detected and case:
        response.case_id = case.id  # type: ignore
    
    return response


@router.post("/pdf", response_model=NoteCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_pdf_note(
    case_id: str = Form(...),
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a PDF note from uploaded file.
    
    Frontend expects: {"note_id": "...", "status": "processing"}
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
    
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be a PDF file.",
        )
    
    # Save file to storage
    storage_path, unique_filename = file_storage.save_file(
        file.file,
        file.filename or "document.pdf"
    )
    
    # Create note with file path in raw_content
    note = Note(
        case_id=case_id,
        source="pdf",
        raw_content=storage_path,  # Store file path for processing
        processing_status="processing",
    )
    note.set_metadata({
        "original_filename": file.filename,
        "mimetype": file.content_type,
        "size": file.size,
    })
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    # Direct processing (no Celery in demo mode)
    if note.source == "text":
        note.processing_status = "ready"
        note.normalized = note.raw_content
        session.add(note)
        session.commit()
        session.refresh(note)
    
    return NoteCreateResponse(
        note_id=note.id,
        status=note.processing_status,
    )


@router.post("/text-file", response_model=NoteCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_text_file_note(
    case_id: str = Form(...),
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a text note from uploaded TXT file.
    
    Reads the file content and creates a text note.
    Frontend expects: {"note_id": "...", "status": "processing"}
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
    
    # Validate file type
    allowed_types = ["text/plain", "text/txt"]
    if file.content_type and file.content_type not in allowed_types:
        # Also check file extension
        if not (file.filename and file.filename.lower().endswith(('.txt', '.text'))):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Must be a TXT file.",
            )
    
    # Read file content
    content = await file.read()
    try:
        text_content = content.decode('utf-8')
    except UnicodeDecodeError:
        # Try with different encodings
        try:
            text_content = content.decode('latin-1')
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not decode file. Please ensure it's a valid text file.",
            )
    
    # Create note as text note
    note = Note(
        case_id=case_id,
        source="text",
        raw_content=text_content,
        processing_status="processing",
    )
    note.set_metadata({
        "original_filename": file.filename,
        "mimetype": file.content_type or "text/plain",
        "size": file.size,
        "uploaded_as_file": True,
    })
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    # Direct processing (no Celery in demo mode)
    note.processing_status = "ready"
    note.normalized = note.raw_content
    session.add(note)
    session.commit()
    session.refresh(note)
    
    return NoteCreateResponse(
        note_id=note.id,
        status=note.processing_status,
    )


@router.post("/image", response_model=NoteCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_image_note(
    case_id: str = Form(...),
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create an image note from uploaded file (OCR).
    
    Supported formats: png, jpg, jpeg, gif, webp
    Frontend expects: {"note_id": "...", "status": "processing"}
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
    
    # Validate file type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Must be an image file.",
        )
    
    # Save file to storage
    storage_path, unique_filename = file_storage.save_file(
        file.file,
        file.filename or "image.jpg"
    )
    
    # Create note with file path in raw_content
    note = Note(
        case_id=case_id,
        source="image",
        raw_content=storage_path,  # Store file path for processing
        processing_status="processing",
    )
    note.set_metadata({
        "original_filename": file.filename,
        "mimetype": file.content_type,
        "size": file.size,
    })
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    # Direct processing (no Celery in demo mode)
    if note.source == "text":
        note.processing_status = "ready"
        note.normalized = note.raw_content
        session.add(note)
        session.commit()
        session.refresh(note)
    
    return NoteCreateResponse(
        note_id=note.id,
        status=note.processing_status,
    )


# List notes for a case
@router.get("", response_model=list[dict])
async def list_notes(
    case_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all notes for a specific case."""
    # Verify case ownership
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
    
    # Get all notes for this case
    statement = select(Note).where(Note.case_id == case_id).order_by(Note.created_at.desc())
    notes = session.exec(statement).all()
    
    # Return as dict list
    return [
        {
            "id": note.id,
            "case_id": note.case_id,
            "source": note.source,
            "raw_content": note.raw_content,
            "normalized": note.normalized,
            "processing_status": note.processing_status,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }
        for note in notes
    ]


@router.post("/{note_id}/transcribe", response_model=NoteStatusResponse)
async def transcribe_audio_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Manually transcribe an audio note (retry transcription if failed).
    
    This endpoint can be used to retry transcription for audio notes
    that failed or are still in processing status.
    """
    # Get note
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Only transcribe audio notes
    if note.source != "audio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note is not an audio note",
        )
    
    # Get file path from raw_content
    file_path = note.raw_content
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file not found",
        )
    
    # Transcribe audio
    try:
        from src.ingest.audio import audio_to_text
        from src.ingest.normalize import normalize_text
        
        print(f"🎤 Retrying transcription for audio note: {note_id}")
        transcribed_text = audio_to_text(file_path)
        
        # Normalize the transcribed text
        normalized_text = normalize_text(transcribed_text)
        
        # Update note with transcribed text
        note.normalized = normalized_text
        note.processing_status = "ready"
        
        # Update metadata with transcription info
        metadata = note.get_metadata()
        metadata["transcription_method"] = "whisper"
        metadata["transcription_status"] = "completed"
        if "transcription_error" in metadata:
            del metadata["transcription_error"]
        note.set_metadata(metadata)
        
        session.add(note)
        session.commit()
        session.refresh(note)
        
        print(f"✅ Audio transcribed successfully. Text length: {len(normalized_text)} characters")
        
        return NoteStatusResponse(
            id=note.id,
            status=note.processing_status,
            normalized=note.normalized,
        )
        
    except Exception as e:
        # Update note with error status
        print(f"⚠️ Audio transcription failed: {str(e)}")
        note.processing_status = "failed"
        
        # Update metadata with error info
        metadata = note.get_metadata()
        metadata["transcription_error"] = str(e)
        metadata["transcription_status"] = "failed"
        note.set_metadata(metadata)
        
        session.add(note)
        session.commit()
        session.refresh(note)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )


@router.get("/{note_id}/status", response_model=NoteStatusResponse)
async def get_note_status(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get note processing status.
    
    Frontend polls this endpoint until status="ready".
    
    Returns:
        {
            "id": "...",
            "status": "processing" | "ready" | "failed",
            "normalized": string | null
        }
    """
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Map internal status to frontend status
    status_map = {
        "pending": "processing",
        "processing": "processing",
        "completed": "ready",
        "failed": "failed",
    }
    
    frontend_status = status_map.get(note.processing_status, "processing")
    
    return NoteStatusResponse(
        id=note.id,
        status=frontend_status,
        normalized=note.normalized if frontend_status == "ready" else None,
    )


# Legacy endpoint for backward compatibility
@router.get("/{note_id}")
async def get_note_details(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get full note details (backward compatibility)."""
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    return {
        "id": note.id,
        "case_id": note.case_id,
        "source": note.source,
        "normalized": note.normalized,
        "processing_status": note.processing_status,
        "metadata": note.get_metadata(),
        "created_at": note.created_at.isoformat(),
    }


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file system usage."""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 100:
        filename = filename[:100]
    return filename


@router.get("/{note_id}/export/pdf")
async def export_note_pdf(
    note_id: str,
    session: Session = Depends(get_session),
    # No auth required for demo mode
):
    """Export a note (especially anonymized) as PDF. No authentication required."""
    statement = select(Note).where(Note.id == note_id)
    note = session.exec(statement).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Check if note is anonymized
    metadata = note.get_metadata()
    is_anonymized = metadata.get('anonymized', False)
    
    # Get text content
    text_content = note.normalized or note.raw_content or ""
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note has no content to export",
        )
    
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.enums import TA_LEFT, TA_CENTER
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.lib.colors import HexColor
        
        # Create buffer
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=HexColor('#264636'),
            spaceAfter=12,
            alignment=TA_CENTER,
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['BodyText'],
            fontSize=11,
            textColor=HexColor('#4A4A4A'),
            leading=16,
            alignment=TA_LEFT,
        )
        
        # Title
        title_text = "Anonymized Document" if is_anonymized else "Document"
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Metadata info
        if is_anonymized:
            story.append(Paragraph(
                f"<b>Status:</b> Anonymized for sharing<br/>"
                f"<b>Created:</b> {note.created_at.strftime('%B %d, %Y at %H:%M') if note.created_at else 'N/A'}<br/>"
                f"<b>Original Note ID:</b> {metadata.get('original_note_id', 'N/A')[:8]}",
                styles['Normal']
            ))
            story.append(Spacer(1, 0.3*inch))
        
        # Content
        # Split text into paragraphs
        paragraphs = text_content.split('\n\n')
        for para in paragraphs:
            if para.strip():
                # Escape HTML special characters
                para_escaped = para.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                story.append(Paragraph(para_escaped, body_style))
                story.append(Spacer(1, 0.15*inch))
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}"
        if is_anonymized:
            footer_text += " | Anonymized Document"
        story.append(Paragraph(
            f'<font size="9" color="#999999">{footer_text}</font>',
            styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Generate filename
        case_statement = select(Case).where(Case.id == note.case_id)
        case = session.exec(case_statement).first()
        safe_name = sanitize_filename(case.client_name or 'case') if case else 'document'
        filename = f"anonymized_document_{safe_name}_{note.id[:8]}.pdf" if is_anonymized else f"document_{safe_name}_{note.id[:8]}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
        
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF export not available. Please install reportlab.",
        )
    except Exception as e:
        print(f"❌ Error exporting PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF export failed: {str(e)}",
        )


@router.get("/{note_id}/export/docx")
async def export_note_docx(
    note_id: str,
    session: Session = Depends(get_session),
    # No auth required for demo mode
):
    """Export a note (especially anonymized) as Word document. No authentication required."""
    statement = select(Note).where(Note.id == note_id)
    note = session.exec(statement).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Check if note is anonymized
    metadata = note.get_metadata()
    is_anonymized = metadata.get('anonymized', False)
    
    # Get text content
    text_content = note.normalized or note.raw_content or ""
    if not text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note has no content to export",
        )
    
    try:
        from docx import Document
        from docx.shared import RGBColor, Pt
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        
        # Create document
        doc = Document()
        
        # Title
        title = doc.add_heading('Anonymized Document' if is_anonymized else 'Document', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title.runs[0]
        title_run.font.color.rgb = RGBColor(38, 70, 54)  # #264636
        
        # Metadata
        if is_anonymized:
            meta_para = doc.add_paragraph()
            meta_para.add_run('Status: ').bold = True
            meta_para.add_run('Anonymized for sharing')
            meta_para = doc.add_paragraph()
            meta_para.add_run('Created: ').bold = True
            meta_para.add_run(note.created_at.strftime('%B %d, %Y at %H:%M') if note.created_at else 'N/A')
            meta_para = doc.add_paragraph()
            meta_para.add_run('Original Note ID: ').bold = True
            meta_para.add_run(metadata.get('original_note_id', 'N/A')[:8])
            doc.add_paragraph()
        
        # Content
        paragraphs = text_content.split('\n\n')
        for para in paragraphs:
            if para.strip():
                doc.add_paragraph(para.strip())
        
        # Footer
        doc.add_paragraph()
        footer_para = doc.add_paragraph()
        footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        footer_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}"
        if is_anonymized:
            footer_text += " | Anonymized Document"
        footer_run = footer_para.add_run(footer_text)
        footer_run.font.size = Pt(10)
        footer_run.font.color.rgb = RGBColor(153, 153, 153)  # Gray
        
        # Save to buffer
        buffer = BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        # Generate filename
        case_statement = select(Case).where(Case.id == note.case_id)
        case = session.exec(case_statement).first()
        safe_name = sanitize_filename(case.client_name or 'case') if case else 'document'
        filename = f"anonymized_document_{safe_name}_{note.id[:8]}.docx" if is_anonymized else f"document_{safe_name}_{note.id[:8]}.docx"
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
        
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Word export not available. Please install python-docx.",
        )
    except Exception as e:
        print(f"❌ Error exporting Word: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Word export failed: {str(e)}",
        )


@router.get("/{note_id}/audio")
async def get_audio_file(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Stream audio file for a voice note.
    
    Returns the audio file as a stream for playback in the browser.
    """
    # Get note and verify ownership
    statement = select(Note).join(Case).where(
        Note.id == note_id,
        Case.user_id == current_user.id,
    )
    note = session.exec(statement).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )
    
    # Verify it's an audio note
    if note.source != "audio":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This note is not an audio note",
        )
    
    # Get file path from raw_content
    storage_path = note.raw_content
    
    if not storage_path or not os.path.exists(storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found",
        )
    
    # Determine MIME type
    metadata = note.get_metadata()
    mime_type = metadata.get("mimetype", "audio/webm")
    
    # If mime_type is not set, guess from filename
    if not mime_type or mime_type == "application/octet-stream":
        guessed_type, _ = mimetypes.guess_type(storage_path)
        mime_type = guessed_type or "audio/webm"
    
    # Return file response for streaming
    return FileResponse(
        storage_path,
        media_type=mime_type,
        filename=metadata.get("original_filename", "audio.webm"),
    )


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Delete a note and its associated file (if any).
    
    Returns: {"success": true, "deleted_note_id": "..."}
    """
    from src.db.models import Highlight, AIActionLog
    import traceback
    
    try:
        # Get note and verify ownership
        statement = select(Note).join(Case).where(
            Note.id == note_id,
            Case.user_id == current_user.id,
        )
        note = session.exec(statement).first()
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found",
            )
        
        # Delete associated records (to avoid foreign key constraints)
        # 1. Delete Highlights
        try:
            highlights = session.exec(select(Highlight).where(Highlight.note_id == note_id)).all()
            for highlight in highlights:
                session.delete(highlight)
            if highlights:
                print(f"🗑️  Deleted {len(highlights)} highlights for note {note_id}")
        except Exception as e:
            print(f"⚠️  Error deleting highlights: {str(e)}")
            traceback.print_exc()
        
        # 2. Delete AIActionLogs
        try:
            action_logs = session.exec(select(AIActionLog).where(AIActionLog.note_id == note_id)).all()
            for log in action_logs:
                session.delete(log)
            if action_logs:
                print(f"🗑️  Deleted {len(action_logs)} AI action logs for note {note_id}")
        except Exception as e:
            print(f"⚠️  Error deleting action logs: {str(e)}")
            traceback.print_exc()
        
        # Delete associated file if it exists
        if note.raw_content and note.source in ["audio", "pdf", "image"]:
            storage_path = note.raw_content
            try:
                file_storage.delete_file(storage_path)
                print(f"🗑️  Deleted file: {storage_path}")
            except Exception as e:
                print(f"⚠️  Failed to delete file {storage_path}: {str(e)}")
                # Continue with note deletion even if file deletion fails
        
        # Delete note from database
        session.delete(note)
        session.commit()
        
        print(f"✅ Deleted note: {note_id}")
        
        return {
            "success": True,
            "deleted_note_id": note_id,
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        # Log the full error and return a proper error response
        print(f"❌ Error deleting note {note_id}: {str(e)}")
        traceback.print_exc()
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}",
        )
