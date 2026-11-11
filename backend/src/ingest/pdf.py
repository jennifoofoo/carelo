"""PDF processing utilities."""
import os
from pathlib import Path
from typing import Optional
import PyPDF2
import pdfplumber


def pdf_to_text(file_path: str, use_ocr_fallback: bool = True) -> str:
    """
    Extract text from PDF file.
    
    Tries multiple methods:
    1. pdfplumber (best for text-based PDFs)
    2. PyPDF2 (fallback)
    3. OCR via Vision API (for scanned PDFs)
    
    Args:
        file_path: Path to the PDF file
        use_ocr_fallback: Whether to use OCR if text extraction fails
    
    Returns:
        Extracted text
    
    Raises:
        Exception: If extraction fails
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    text = ""
    
    # Method 1: Try pdfplumber first (best results)
    try:
        text = _extract_with_pdfplumber(file_path)
        if text and len(text.strip()) > 50:  # Reasonable amount of text
            return text
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
    
    # Method 2: Try PyPDF2
    try:
        text = _extract_with_pypdf2(file_path)
        if text and len(text.strip()) > 50:
            return text
    except Exception as e:
        print(f"PyPDF2 extraction failed: {e}")
    
    # Method 3: OCR fallback for scanned PDFs
    if use_ocr_fallback:
        try:
            from src.ingest.ocr import pdf_to_text_ocr
            text = pdf_to_text_ocr(file_path)
            if text:
                return text
        except Exception as e:
            print(f"OCR fallback failed: {e}")
    
    # If all methods fail
    if not text or len(text.strip()) < 10:
        raise Exception("Could not extract text from PDF. File may be empty or corrupted.")
    
    return text


def _extract_with_pdfplumber(file_path: str) -> str:
    """Extract text using pdfplumber."""
    text_parts = []
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    
    return "\n\n".join(text_parts)


def _extract_with_pypdf2(file_path: str) -> str:
    """Extract text using PyPDF2."""
    text_parts = []
    
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    
    return "\n\n".join(text_parts)


def get_pdf_metadata(file_path: str) -> dict:
    """
    Get PDF metadata.
    
    Args:
        file_path: Path to the PDF file
    
    Returns:
        Dictionary with metadata
    """
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            metadata = {
                "page_count": len(pdf_reader.pages),
                "title": None,
                "author": None,
                "subject": None,
            }
            
            if pdf_reader.metadata:
                metadata["title"] = pdf_reader.metadata.get("/Title")
                metadata["author"] = pdf_reader.metadata.get("/Author")
                metadata["subject"] = pdf_reader.metadata.get("/Subject")
            
            return metadata
    except Exception:
        return {"page_count": 0}

