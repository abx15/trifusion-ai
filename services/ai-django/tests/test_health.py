"""Tests for ai-django health endpoints and correlation ID."""

import os

import pytest
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ai_service.settings")


@pytest.fixture
def client():
    return Client()


def test_health_check_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai-django"
    assert "timestamp" in data
    assert "X-Request-Id" in response.headers


def test_correlation_id_propagates(client):
    custom_id = "test-corr-id-12345"
    response = client.get("/health", HTTP_X_REQUEST_ID=custom_id)
    assert response.status_code == 200
    assert response.headers.get("X-Request-Id") == custom_id


def test_ready_check_returns_200(client):
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "dependencies" in data
