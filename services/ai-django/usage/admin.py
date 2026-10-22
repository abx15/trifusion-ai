from django.contrib import admin

from .models import AIUsageRecord


@admin.register(AIUsageRecord)
class AIUsageRecordAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "workspace_id",
        "user_id",
        "capability",
        "provider",
        "model",
        "total_tokens",
        "estimated_cost",
        "created_at",
    ]
    list_filter = ["capability", "provider", "created_at"]
    search_fields = ["id", "workspace_id", "user_id", "request_id"]
    readonly_fields = ["created_at"]
