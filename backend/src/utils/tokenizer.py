"""Token counting and cost calculation utilities."""
import tiktoken


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """
    Count the number of tokens in a text string.
    
    Args:
        text: The text to count tokens for
        model: The model name to use for encoding
    
    Returns:
        Number of tokens
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    
    return len(encoding.encode(text))


def calculate_cost(
    input_tokens: int,
    output_tokens: int,
    model: str = "gpt-4-turbo-preview"
) -> float:
    """
    Calculate the cost of an OpenAI API call.
    
    Pricing (as of 2024):
        GPT-4 Turbo: $0.01 / 1K input tokens, $0.03 / 1K output tokens
        GPT-3.5 Turbo: $0.0005 / 1K input tokens, $0.0015 / 1K output tokens
    
    Args:
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model: The model used
    
    Returns:
        Cost in USD
    """
    pricing = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    }
    
    # Default to GPT-4 Turbo pricing
    rates = pricing.get(model, pricing["gpt-4-turbo"])
    
    input_cost = (input_tokens / 1000) * rates["input"]
    output_cost = (output_tokens / 1000) * rates["output"]
    
    return round(input_cost + output_cost, 6)

