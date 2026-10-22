"""OpenAI provider implementation."""

from __future__ import annotations

from typing import Any, Iterator

try:
    from openai import OpenAI

    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from .providers import ProviderAdapter


class OpenAIProvider(ProviderAdapter):
    """OpenAI provider implementation."""

    name = "openai"
    model = "gpt-4"

    # Pricing (per 1M tokens as of 2024)
    INPUT_COST_PER_1M_TOKENS = 30.0  # gpt-4
    OUTPUT_COST_PER_1M_TOKENS = 60.0  # gpt-4

    def __init__(self, api_key: str, model: str = "gpt-4"):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package not installed")
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def generate(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> dict[str, Any]:
        """Generate a complete response using OpenAI."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )

            content = response.choices[0].message.content
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            total_tokens = response.usage.total_tokens

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
        """Generate a streaming response using OpenAI."""
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )

            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield {
                        "type": "token",
                        "content": chunk.choices[0].delta.content,
                    }

            yield {"type": "done"}
        except Exception as e:
            yield {"type": "error", "error": str(e)}
