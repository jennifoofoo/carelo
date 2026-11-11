"""Universal AI Agent Service - Core Intelligence for CareLo."""
import json
from typing import Optional
from src.config import settings
from src.ai.universal.prompt import get_universal_prompt
from src.ai.universal.schemas import UniversalAgentResult
from src.utils.openai_fallback import graceful_openai_fallback
from src.utils.ai_client import get_chat_client

# Configure Gemini client (via OpenAI-compatible endpoint)
client = get_chat_client()


class UniversalAgentError(Exception):
    """Custom exception for Universal Agent errors."""
    pass


async def run_universal_agent(
    normalized_text: str,
    retry: bool = True
) -> UniversalAgentResult:
    """
    Run Universal AI Agent on normalized text.
    
    Returns structured analysis with:
    - Summary
    - Risks
    - Key Facts
    - Report Segment
    - Help Plan Draft
    - Grammar Fix
    
    Args:
        normalized_text: The cleaned/normalized note text
        retry: Whether to retry once on JSON parse error
        
    Returns:
        UniversalAgentResult with all analysis fields
        
    Raises:
        UniversalAgentError: If analysis fails after retry
    """
    if not normalized_text or len(normalized_text.strip()) < 10:
        raise UniversalAgentError("Text too short for analysis")
    
    if not settings.GEMINI_API_KEY:
        raise UniversalAgentError("GEMINI_API_KEY not configured")
    
    # Generate prompt
    prompt = get_universal_prompt(normalized_text)
    
    try:
        # Call OpenAI Chat Completion
        response = client.chat.completions.create(
            model=settings.GEMINI_CHAT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional AI assistant for social workers in Germany. You provide structured analysis in JSON format only. Be concise."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,  # Lower temperature for faster, more consistent output
            max_tokens=1500,  # Reduced from 2000 for faster responses
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        # Extract content
        content = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            result_dict = json.loads(content)
        except json.JSONDecodeError as e:
            if retry:
                print(f"⚠️  JSON parse error, retrying: {e}")
                # Retry with explicit JSON fix prompt
                return await _retry_with_json_fix(content, normalized_text)
            else:
                raise UniversalAgentError(f"Invalid JSON after retry: {e}")
        
        # Validate with Pydantic
        result = UniversalAgentResult(**result_dict)
        
        print(f"✅ Universal Agent completed: {len(result.risks)} risks, {len(result.keyFacts)} facts")
        return result
        
    except RateLimitError as e:
        print(f"⚠️  OpenAI Rate Limit Error: {e}")
        raise UniversalAgentError(
            "AI service is currently experiencing high demand. Please try again in a few minutes."
        )
    except APIError as e:
        print(f"⚠️  OpenAI API Error: {e}")
        raise UniversalAgentError(
            "AI service is temporarily unavailable. Please try again later."
        )
    except OpenAIError as e:
        print(f"⚠️  OpenAI Error: {e}")
        raise UniversalAgentError(
            "AI service error occurred. Please try again later."
        )
    except Exception as e:
        print(f"❌ Universal Agent error: {e}")
        raise UniversalAgentError(f"Analysis failed: {str(e)}")


async def _retry_with_json_fix(
    broken_json: str,
    original_text: str
) -> UniversalAgentResult:
    """Retry with JSON repair prompt."""
    repair_prompt = f"""The following JSON is malformed. Please fix it and return valid JSON:

{broken_json}

Return ONLY valid JSON in the exact structure required."""
    
    response = client.chat.completions.create(
        model=settings.GEMINI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": "You fix malformed JSON. Return only valid JSON."},
            {"role": "user", "content": repair_prompt}
        ],
        temperature=0,
        max_tokens=2000,
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content.strip()
    result_dict = json.loads(content)
    return UniversalAgentResult(**result_dict)


def run_universal_agent_sync(normalized_text: str) -> UniversalAgentResult:
    """Synchronous wrapper for Universal Agent."""
    import asyncio
    try:
        # Try to get the current event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, we can't use asyncio.run()
            # Instead, we need to use a different approach
            # For now, raise an error suggesting to use the async version
            raise RuntimeError(
                "Cannot use run_universal_agent_sync in an async context. "
                "Use await run_universal_agent() instead."
            )
        else:
            # No running loop, safe to use asyncio.run()
            return asyncio.run(run_universal_agent(normalized_text))
    except RuntimeError:
        # No event loop exists, safe to use asyncio.run()
        return asyncio.run(run_universal_agent(normalized_text))

