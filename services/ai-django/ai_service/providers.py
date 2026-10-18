"""Provider adapters for AI models."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class ProviderAdapter(ABC):
    """Interface implemented by all AI providers."""

    name = "base-provider"
    model = "base-model"

    @abstractmethod
    def generate(self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> dict[str, Any]:
        raise NotImplementedError


class MockProvider(ProviderAdapter):
    """Deterministic mock provider used for tests and local development."""

    name = "mock-provider"
    model = "mock-model"

    def generate(self, *, prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> dict[str, Any]:
        return {
            "provider": self.name,
            "model": self.model,
            "content": {
                "summary": "Mock response generated from the supplied context.",
                "facts": ["Context was validated before generation.", "No external provider was called."],
                "prompt": prompt[:250],
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
        }
