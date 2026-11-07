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
    node_env = os.environ.get("NODE_ENV", "development").lower()

    if provider_name == "mock":
        if node_env == "production":
            raise RuntimeError(
                "AI_PROVIDER=mock is not permitted in production. "
                "Configure AI_PROVIDER=openai or AI_PROVIDER=anthropic."
            )
        return MockProvider()

    if provider_name == "openai":
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed. Add 'openai' to requirements.txt")
        api_key = os.environ.get("AI_OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("AI_PROVIDER=openai requires AI_OPENAI_API_KEY or OPENAI_API_KEY")
        return OpenAIProvider(api_key=api_key)

    if provider_name == "anthropic":
        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "Anthropic package not installed. Add 'anthropic' to requirements.txt"
            )
        api_key = os.environ.get("AI_ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "AI_PROVIDER=anthropic requires "
                "AI_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY"
            )
        return AnthropicProvider(api_key=api_key)

    raise ValueError(f"Unsupported AI_PROVIDER: {provider_name}")
