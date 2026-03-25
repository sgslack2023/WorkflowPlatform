from django.contrib import admin
from .models import AgentDefinition, AgentConfig, LLMProvider

@admin.register(LLMProvider)
class LLMProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider_type', 'is_active')

@admin.register(AgentConfig)
class AgentConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')

@admin.register(AgentDefinition)
class AgentDefinitionAdmin(admin.ModelAdmin):
    list_display = ('name', 'llm_provider', 'is_active')
    filter_horizontal = ('tools',)
