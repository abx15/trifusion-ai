from django.contrib import admin

from .models import AIJob


@admin.register(AIJob)
class AIJobAdmin(admin.ModelAdmin):
    list_display = ["id", "workspace_id", "user_id", "job_type", "status", "created_at"]
    list_filter = ["status", "job_type", "created_at"]
    search_fields = ["id", "workspace_id", "user_id", "request_id"]
    readonly_fields = ["created_at", "started_at", "completed_at"]
