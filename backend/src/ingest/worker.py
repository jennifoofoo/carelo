"""Ingest worker for processing notes and files."""
from sqlmodel import Session
from datetime import datetime
from typing import Optional

from src.db.models import Note, File
from src.ingest.audio import audio_to_text
from src.ingest.pdf import pdf_to_text, get_pdf_metadata
from src.ingest.ocr import image_to_text
from src.ingest.normalize import normalize_text, extract_metadata
from src.utils.file_storage import file_storage


class IngestWorker:
    """Worker for processing notes and files through the ingest pipeline."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def process_text_note(self, note: Note) -> None:
        """
        Process a text note.
        
        Args:
            note: Note object to process
        """
        if not note.raw_content:
            raise ValueError("Text note has no content")
        
        # Normalize text
        normalized = normalize_text(note.raw_content)
        
        # Extract metadata
        metadata = extract_metadata(normalized)
        note.set_metadata(metadata)
        
        # Update note
        note.normalized = normalized
        note.updated_at = datetime.utcnow()
        
        self.session.add(note)
        self.session.commit()
    
    def process_audio_note(self, note: Note) -> None:
        """
        Process an audio note.
        
        Args:
            note: Note object with audio file reference
        """
        # Get file path from raw_content (stores file path for non-text notes)
        file_path = note.raw_content
        
        if not file_path:
            raise ValueError("Audio note has no file path")
        
        # Transcribe audio
        transcribed_text = audio_to_text(file_path)
        
        # Normalize text
        normalized = normalize_text(transcribed_text)
        
        # Extract metadata
        metadata = extract_metadata(normalized)
        metadata["source_type"] = "audio"
        metadata["transcription_method"] = "whisper"
        note.set_metadata(metadata)
        
        # Update note
        note.normalized = normalized
        note.updated_at = datetime.utcnow()
        
        self.session.add(note)
        self.session.commit()
    
    def process_pdf_note(self, note: Note) -> None:
        """
        Process a PDF note.
        
        Args:
            note: Note object with PDF file reference
        """
        # Get file path from raw_content
        file_path = note.raw_content
        
        if not file_path:
            raise ValueError("PDF note has no file path")
        
        # Extract text from PDF
        extracted_text = pdf_to_text(file_path, use_ocr_fallback=True)
        
        # Normalize text
        normalized = normalize_text(extracted_text)
        
        # Extract metadata
        metadata = extract_metadata(normalized)
        metadata["source_type"] = "pdf"
        
        # Get PDF metadata
        try:
            pdf_meta = get_pdf_metadata(file_path)
            metadata.update(pdf_meta)
        except Exception:
            pass
        
        note.set_metadata(metadata)
        
        # Update note
        note.normalized = normalized
        note.updated_at = datetime.utcnow()
        
        self.session.add(note)
        self.session.commit()
    
    def process_image_note(self, note: Note) -> None:
        """
        Process an image note using OCR.
        
        Args:
            note: Note object with image file reference
        """
        # Get file path from raw_content
        file_path = note.raw_content
        
        if not file_path:
            raise ValueError("Image note has no file path")
        
        # Extract text using OCR
        extracted_text = image_to_text(file_path)
        
        # Normalize text
        normalized = normalize_text(extracted_text)
        
        # Extract metadata
        metadata = extract_metadata(normalized)
        metadata["source_type"] = "image"
        metadata["ocr_method"] = "openai_vision"
        note.set_metadata(metadata)
        
        # Update note
        note.normalized = normalized
        note.updated_at = datetime.utcnow()
        
        self.session.add(note)
        self.session.commit()
    
    def process_file(self, file: File) -> None:
        """
        Process a file and extract text.
        
        Args:
            file: File object to process
        """
        file_path = file.storage_path
        
        if not file_path:
            raise ValueError("File has no storage path")
        
        extracted_text = ""
        
        # Determine processing method based on mimetype
        if file.mimetype.startswith("audio/"):
            extracted_text = audio_to_text(file_path)
        elif file.mimetype == "application/pdf":
            extracted_text = pdf_to_text(file_path, use_ocr_fallback=True)
        elif file.mimetype.startswith("image/"):
            extracted_text = image_to_text(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file.mimetype}")
        
        # Normalize text
        normalized = normalize_text(extracted_text)
        
        # Update file
        file.text = normalized
        file.updated_at = datetime.utcnow()
        
        self.session.add(file)
        self.session.commit()

