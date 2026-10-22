"""Serializers for AI service requests and responses."""

from __future__ import annotations

from rest_framework import serializers


class BaseAIRequestSerializer(serializers.Serializer):
    workspace_id = serializers.CharField(required=True)
    user_id = serializers.CharField(required=True)
    request_id = serializers.CharField(required=False, allow_blank=True, default="")
    tool = serializers.CharField(required=False, allow_blank=True, default="")
    data = serializers.JSONField(required=False, default=dict)


class ProjectSummaryRequestSerializer(BaseAIRequestSerializer):
    project_id = serializers.CharField(required=True)
    tasks = serializers.ListField(required=False, child=serializers.DictField(), default=list)
    activity = serializers.ListField(required=False, child=serializers.DictField(), default=list)


class WeeklyReportRequestSerializer(BaseAIRequestSerializer):
    analytics = serializers.DictField(required=False, default=dict)
    reporting_period = serializers.DictField(required=False, default=dict)


class TaskSuggestionsRequestSerializer(BaseAIRequestSerializer):
    task_id = serializers.CharField(required=True)
    task = serializers.DictField(required=False, default=dict)
    project = serializers.DictField(required=False, default=dict)


class WorkspaceAssistantRequestSerializer(BaseAIRequestSerializer):
    question = serializers.CharField(required=True)
    retrieved_context = serializers.ListField(
        required=False, child=serializers.DictField(), default=list
    )


class AIResponseSerializer(serializers.Serializer):
    status = serializers.CharField(default="ok")
    workspace_id = serializers.CharField(required=True)
    user_id = serializers.CharField(required=True)
    request_id = serializers.CharField(required=False, allow_blank=True, default="")
    generated_at = serializers.DateTimeField(required=True)
    source_scope = serializers.CharField(required=True)
    provider = serializers.CharField(required=True)
    model = serializers.CharField(required=True)
    output = serializers.DictField(required=True)
