"""Provider factory for selecting AI provider based on configuration."""

import os
from typing import Any

from .providers import MockProvider

try:
    from .openai_provider import OpenAIProvider

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from .anthropic_provider import AnthropicProvider

    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


def get_provider() -> Any:
    """Get the configured AI provider based on environment variables."""
    provider_name = os.environ.get("AI_PROVIDER", "mock").lower()

    if provider_name == "mock":
        return MockProvider()

    if provider_name == "openai":
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Add 'openai' to requirements.txt")
        api_key = os.environ.get("AI_OPENAI_API_KEY")
        if not api_key:
            # Fall back to mock if no API key
            return MockProvider()
        return OpenAIProvider(api_key=api_key)

    if provider_name == "anthropic":
        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "Anthropic package not installed. Add 'anthropic' to requirements.txt"
            )
        api_key = os.environ.get("AI_ANTHROPIC_API_KEY")
        if not api_key:
            # Fall back to mock if no API key
            return MockProvider()
        return AnthropicProvider(api_key=api_key)

    # Default to mock for unknown providers
    return MockProvider()
