"""Audio processing utilities using Gemini multimodal."""
import os
import base64
import mimetypes
from pathlib import Path
import google.generativeai as genai
from src.config import settings


def audio_to_text(file_path: str) -> str:
    """
    Convert audio file to text using Gemini multimodal.

    Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    Max file size: 20MB (inline) — Gemini limit for inline audio.

    Args:
        file_path: Path to the audio file

    Returns:
        Transcribed text

    Raises:
        Exception: If transcription fails
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    file_size = os.path.getsize(file_path)
    max_size = 20 * 1024 * 1024  # 20MB

    if file_size > max_size:
        raise ValueError(f"Audio file too large: {file_size} bytes (max {max_size} bytes)")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Detect MIME type from file extension
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type or not mime_type.startswith("audio/"):
            ext = Path(file_path).suffix.lower()
            mime_map = {
                ".mp3": "audio/mpeg",
                ".mp4": "audio/mp4",
                ".m4a": "audio/mp4",
                ".wav": "audio/wav",
                ".webm": "audio/webm",
                ".ogg": "audio/ogg",
            }
            mime_type = mime_map.get(ext, "audio/wav")

        audio_b64 = base64.b64encode(Path(file_path).read_bytes()).decode()

        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([
            "Transcribe this audio accurately. Return only the transcription text, no commentary or formatting.",
            {"inline_data": {"data": audio_b64, "mime_type": mime_type}},
        ])

        return response.text.strip()

    except Exception as e:
        raise Exception(f"Failed to transcribe audio: {str(e)}")


def get_audio_duration(file_path: str) -> float:
    """
    Get audio file duration in seconds.

    Args:
        file_path: Path to the audio file

    Returns:
        Duration in seconds
    """
    try:
        import wave
        import contextlib

        with contextlib.closing(wave.open(file_path, 'r')) as f:
            frames = f.getnframes()
            rate = f.getframerate()
            return frames / float(rate)
    except Exception:
        # Fallback: estimate based on file size at ~128kbps
        file_size = os.path.getsize(file_path)
        return file_size / (128 * 1024 / 8)
