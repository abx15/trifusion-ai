"""URL configuration for TriFusion AI Django Service."""
from django.urls import path

from ai_service.views import health_check, ready_check

urlpatterns = [
    path('health', health_check, name='health_check'),
    path('health/', health_check, name='health_check_slash'),
    path('ready', ready_check, name='ready_check'),
    path('ready/', ready_check, name='ready_check_slash'),
]
