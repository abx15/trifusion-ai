import pytest

from providers.factory import get_provider
from providers.providers import MockProvider


def test_mock_provider_remains_available_in_development(monkeypatch):
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("AI_PROVIDER", "mock")

    assert isinstance(get_provider(), MockProvider)


def test_mock_provider_is_rejected_in_production(monkeypatch):
    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.setenv("AI_PROVIDER", "mock")

    with pytest.raises(RuntimeError, match="not permitted in production"):
        get_provider()


def test_unknown_provider_is_rejected(monkeypatch):
    monkeypatch.setenv("NODE_ENV", "development")
    monkeypatch.setenv("AI_PROVIDER", "unknown-provider")

    with pytest.raises(ValueError, match="Unsupported AI_PROVIDER"):
        get_provider()
