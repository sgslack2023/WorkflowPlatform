from django.contrib import admin
from .models import Tool, ToolExecution, ToolVersion

@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'execution_mode', 'python_path', 'created_at')
    list_filter = ('execution_mode', 'created_at')
    search_fields = ('name', 'key', 'python_path', 'description')

@admin.register(ToolExecution)
class ToolExecutionAdmin(admin.ModelAdmin):
    list_display = ('tool', 'status', 'started_at', 'duration_ms')
    list_filter = ('status', 'tool')

@admin.register(ToolVersion)
class ToolVersionAdmin(admin.ModelAdmin):
    list_display = ('tool', 'version_number', 'created_at')
