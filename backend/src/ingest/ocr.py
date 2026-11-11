"""OCR processing utilities using Gemini Vision."""
import os
import base64
from pathlib import Path
from typing import List
from src.config import settings
from src.utils.ai_client import get_chat_client


def image_to_text(file_path: str) -> str:
    """
    Extract text from image using Gemini Vision.

    Supports: png, jpg, jpeg, gif, webp

    Args:
        file_path: Path to the image file

    Returns:
        Extracted text

    Raises:
        Exception: If OCR fails
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Image file not found: {file_path}")

    try:
        client = get_chat_client()

        # Read and encode image
        with open(file_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")

        # Determine image type
        extension = Path(file_path).suffix.lower().lstrip('.')
        mime_type = f"image/{extension}" if extension in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else "image/jpeg"

        # Call Vision API (Gemini Flash is natively multimodal)
        response = client.chat.completions.create(
            model=settings.GEMINI_CHAT_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this image. Return only the extracted text without any additional commentary. If there is no text, return 'No text found'."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000,
        )
        
        text = response.choices[0].message.content.strip()
        
        if text == "No text found" or not text:
            return ""
        
        return text
        
    except Exception as e:
        raise Exception(f"Failed to perform OCR: {str(e)}")


def pdf_to_text_ocr(file_path: str) -> str:
    """
    Extract text from scanned PDF using OCR.
    
    Converts PDF pages to images and runs OCR on each page.
    
    Args:
        file_path: Path to the PDF file
    
    Returns:
        Extracted text
    
    Raises:
        Exception: If OCR fails
    """
    try:
        # This would require pdf2image library and poppler
        # For now, we'll use a simplified approach
        
        # Note: In production, you'd want to:
        # 1. Convert PDF to images using pdf2image
        # 2. Run OCR on each image
        # 3. Combine results
        
        # Simplified implementation: just indicate it's a scanned PDF
        raise Exception(
            "PDF appears to be scanned. Please convert to images and upload as image files for OCR."
        )
        
    except Exception as e:
        raise Exception(f"Failed to perform OCR on PDF: {str(e)}")


def batch_image_to_text(file_paths: List[str]) -> str:
    """
    Extract text from multiple images and combine.
    
    Args:
        file_paths: List of image file paths
    
    Returns:
        Combined extracted text
    """
    text_parts = []
    
    for i, file_path in enumerate(file_paths):
        try:
            text = image_to_text(file_path)
            if text:
                text_parts.append(f"--- Page {i + 1} ---\n{text}")
        except Exception as e:
            print(f"Failed to OCR {file_path}: {e}")
            continue
    
    return "\n\n".join(text_parts)

