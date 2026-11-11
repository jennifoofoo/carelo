"""Text normalization utilities."""
import re
from typing import Optional


def normalize_text(text: str) -> str:
    """
    Normalize extracted text by cleaning up common issues.
    
    - Remove excessive whitespace
    - Remove timestamps
    - Remove filler words/sounds
    - Remove duplicate lines
    - Fix common OCR errors
    - Standardize line breaks
    
    Args:
        text: Raw text to normalize
    
    Returns:
        Normalized text
    """
    if not text:
        return ""
    
    # Remove BOM and other invisible characters
    text = text.replace('\ufeff', '')
    text = text.replace('\u200b', '')
    
    # Remove timestamps (e.g., [00:12:34], (12:34), 00:12:34)
    text = re.sub(r'\[?\d{1,2}:\d{2}(?::\d{2})?\]?', '', text)
    text = re.sub(r'\(\d{1,2}:\d{2}(?::\d{2})?\)', '', text)
    
    # Remove common filler words/sounds (for transcriptions)
    fillers = [
        r'\b(um+|uh+|er+|ah+|hmm+|mhm+)\b',
        r'\b(like|you know|I mean|sort of|kind of)\b(?=.*\1)',  # repeated fillers
    ]
    for filler in fillers:
        text = re.sub(filler, '', text, flags=re.IGNORECASE)
    
    # Remove multiple spaces
    text = re.sub(r' +', ' ', text)
    
    # Remove spaces before punctuation
    text = re.sub(r' ([.,!?;:])', r'\1', text)
    
    # Fix common OCR errors
    ocr_fixes = {
        r'\bl\b': 'I',  # lowercase L to uppercase I
        r'([a-z])l([A-Z])': r'\1I\2',  # lowercase L to uppercase I in words
        r'\b0([A-Z])': r'O\1',  # Zero to O at word start
        r'([a-z])0([a-z])': r'\1o\2',  # Zero to o in words
    }
    for pattern, replacement in ocr_fixes.items():
        text = re.sub(pattern, replacement, text)
    
    # Normalize line breaks
    text = re.sub(r'\r\n', '\n', text)  # Windows to Unix
    text = re.sub(r'\r', '\n', text)    # Old Mac to Unix
    
    # Remove excessive line breaks (more than 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove duplicate consecutive lines
    lines = text.split('\n')
    deduplicated = []
    prev_line = None
    
    for line in lines:
        stripped = line.strip()
        if stripped and stripped != prev_line:
            deduplicated.append(line)
            prev_line = stripped
        elif not stripped:
            # Keep empty lines for paragraph breaks
            if deduplicated and deduplicated[-1].strip():
                deduplicated.append('')
    
    text = '\n'.join(deduplicated)
    
    # Remove leading/trailing whitespace from each line
    lines = [line.rstrip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Final cleanup
    text = text.strip()
    
    return text


def extract_metadata(text: str) -> dict:
    """
    Extract metadata from normalized text.
    
    Returns:
        Dictionary with metadata like word count, character count, etc.
    """
    if not text:
        return {
            "char_count": 0,
            "word_count": 0,
            "line_count": 0,
        }
    
    words = text.split()
    lines = text.split('\n')
    
    return {
        "char_count": len(text),
        "word_count": len(words),
        "line_count": len(lines),
        "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0,
    }

