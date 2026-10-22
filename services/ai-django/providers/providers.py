"""Provider adapters for AI models."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Iterator


class ProviderAdapter(ABC):
    """Interface implemented by all AI providers."""

    name = "base-provider"
    model = "base-model"

    @abstractmethod
    def generate(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def generate_stream(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> Iterator[dict[str, Any]]:
        raise NotImplementedError


class MockProvider(ProviderAdapter):
    """Deterministic mock provider used for tests and local development."""

    name = "mock-provider"
    model = "mock-model"

    def generate(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> dict[str, Any]:
        # Mock token counting based on prompt length
        input_tokens = len(prompt) // 4  # Rough estimate: 1 token ≈ 4 characters
        output_tokens = 100  # Fixed mock output token count
        total_tokens = input_tokens + output_tokens

        return {
            "provider": self.name,
            "model": self.model,
            "content": {
                "summary": "Mock response generated from the supplied context.",
                "facts": [
                    "Context was validated before generation.",
                    "No external provider was called.",
                ],
                "prompt": prompt[:250],
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "estimated_cost": 0.0,  # Mock provider has no cost
        }

    def generate_stream(
        self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2
    ) -> Iterator[dict[str, Any]]:
        """Mock streaming - yields a few tokens then done."""
        yield {"type": "token", "content": "Mock "}
        yield {"type": "token", "content": "streaming "}
        yield {"type": "token", "content": "response"}
        yield {"type": "done"}
