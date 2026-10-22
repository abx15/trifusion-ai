"""Anthropic provider implementation."""

from __future__ import annotations

from typing import Any, Iterator

try:
    from anthropic import Anthropic

    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

from .providers import ProviderAdapter


class AnthropicProvider(ProviderAdapter):
    """Anthropic provider implementation."""

    name = "anthropic"
    model = "claude-3-opus-20240229"

    # Pricing (per 1M tokens as of 2024)
    INPUT_COST_PER_1M_TOKENS = 15.0  # claude-3-opus
    OUTPUT_COST_PER_1M_TOKENS = 75.0  # claude-3-opus

    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229"):
        if not ANTHROPIC_AVAILABLE:
            raise ImportError("Anthropic package not installed")
        self.client = Anthropic(api_key=api_key)
        self.model = model

    def generate(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> dict[str, Any]:
        """Generate a complete response using Anthropic."""
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            )

            content = response.content[0].text
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            total_tokens = input_tokens + output_tokens

            # Calculate estimated cost
            input_cost = (input_tokens / 1_000_000) * self.INPUT_COST_PER_1M_TOKENS
            output_cost = (output_tokens / 1_000_000) * self.OUTPUT_COST_PER_1M_TOKENS
            estimated_cost = input_cost + output_cost

            return {
                "provider": self.name,
                "model": self.model,
                "content": content,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "estimated_cost": estimated_cost,
            }
        except Exception as e:
            return {
                "provider": self.name,
                "model": self.model,
                "error": str(e),
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "estimated_cost": 0,
            }

    def generate_stream(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> Iterator[dict[str, Any]]:
        """Generate a streaming response using Anthropic."""
        try:
            with self.client.messages.stream(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt},
                ],
            ) as stream:
                for text in stream.text_stream:
                    yield {
                        "type": "token",
                        "content": text,
                    }

            yield {"type": "done"}
        except Exception as e:
            yield {"type": "error", "error": str(e)}
