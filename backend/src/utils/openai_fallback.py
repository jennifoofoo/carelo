"""Graceful degradation for AI API failures."""
from typing import Any, Callable, Dict
from functools import wraps
from openai import APIError
from fastapi import HTTPException, status


class AIFallbackError(Exception):
    """Custom exception for AI fallback scenarios."""
    pass


# Keep old name as alias for backward compatibility with existing imports
OpenAIFallbackError = AIFallbackError


def graceful_openai_fallback(
    fallback_value: Any = None,
    fallback_message: str = "AI service is temporarily unavailable. Please try again later.",
    log_error: bool = True,
):
    """
    Decorator for graceful degradation when the AI API fails.

    Args:
        fallback_value: Value to return on error (if None, raises HTTPException)
        fallback_message: Error message to show user
        log_error: Whether to log the error
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except APIError as e:
                if log_error:
                    print(f"⚠️  AI API Error: {e}")
                if fallback_value is not None:
                    return fallback_value
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "error": "AI service error",
                        "message": fallback_message,
                        "retry_after": 30,
                    },
                )
            except Exception as e:
                if log_error:
                    print(f"⚠️  Unexpected error in AI call: {e}")
                if fallback_value is not None:
                    return fallback_value
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": "Internal server error",
                        "message": "An unexpected error occurred. Please try again later.",
                    },
                )

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except APIError as e:
                if log_error:
                    print(f"⚠️  AI API Error: {e}")
                if fallback_value is not None:
                    return fallback_value
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={
                        "error": "AI service error",
                        "message": fallback_message,
                        "retry_after": 30,
                    },
                )
            except Exception as e:
                if log_error:
                    print(f"⚠️  Unexpected error in AI call: {e}")
                if fallback_value is not None:
                    return fallback_value
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail={
                        "error": "Internal server error",
                        "message": "An unexpected error occurred. Please try again later.",
                    },
                )

        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def check_ai_available() -> bool:
    """Check if the Gemini AI API is reachable."""
    from src.config import settings
    from src.utils.ai_client import get_chat_client

    if not settings.GEMINI_API_KEY:
        return False

    try:
        client = get_chat_client()
        client.models.list()
        return True
    except Exception:
        return False


# Backward-compatible alias
check_openai_available = check_ai_available


def get_fallback_insight_message() -> Dict[str, Any]:
    """Get fallback message for insights when AI is unavailable."""
    return {
        "type": "info",
        "title": "AI Service Unavailable",
        "description": "AI insights are temporarily unavailable. Please try again later.",
        "severity": "low",
        "category": "system",
    }
