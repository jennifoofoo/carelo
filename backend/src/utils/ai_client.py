"""Central AI client factory for Gemini via OpenAI-compatible endpoint."""
from openai import OpenAI
from src.config import settings


def get_chat_client() -> OpenAI:
    """Return an OpenAI client configured to use Google Gemini via the OpenAI-compatible endpoint."""
    return OpenAI(
        api_key=settings.GEMINI_API_KEY,
        base_url=settings.GEMINI_BASE_URL,
    )
