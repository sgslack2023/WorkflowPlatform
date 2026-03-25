import uuid
from django.db import models

class LLMProvider(models.Model):
    PROVIDER_TYPES = (
        ('openai', 'OpenAI'),
        ('anthropic', 'Anthropic'),
        ('azure', 'Azure'),
        ('local', 'Local'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="llm_providers", null=True, blank=True)
    name = models.CharField(max_length=255)
    provider_type = models.CharField(max_length=50, choices=PROVIDER_TYPES)
    config = models.JSONField(default=dict)
    api_key_secret = models.ForeignKey("core.EncryptedSecret", on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AgentConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="agent_configs", null=True, blank=True)
    name = models.CharField(max_length=255)
    system_prompt = models.TextField()
    temperature = models.FloatField(default=0.7)
    max_tokens = models.IntegerField(default=1000)
    tool_policy = models.JSONField(default=dict, blank=True)
    memory_policy = models.CharField(max_length=50, blank=True) # e.g., "window", "summary"
    
    # Unified Tool Architecture - allow configs to have default tools
    tools = models.ManyToManyField("tools.Tool", blank=True, related_name="agent_configs")
    
    # Per-scenario prompt/tool overrides
    scenario_overrides = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AgentDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="agents", null=True, blank=True)
    name = models.CharField(max_length=255)
    llm_provider = models.ForeignKey(LLMProvider, on_delete=models.SET_NULL, null=True, related_name="agents")
    agent_config = models.ForeignKey(AgentConfig, on_delete=models.SET_NULL, null=True, related_name="agents")
    
    # Unified Tool Architecture
    tools = models.ManyToManyField("tools.Tool", blank=True, related_name="agents")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AgentMemory(models.Model):
    MEMORY_TYPES = (
        ('chat', 'Chat'),
        ('workflow', 'Workflow'),
        ('scenario', 'Scenario'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_definition = models.ForeignKey(AgentDefinition, on_delete=models.CASCADE, related_name="memories")
    
    # Loose coupling or FKs
    workflow_run_id = models.UUIDField(null=True, blank=True) # Can refer to AppRun.id
    scenario = models.ForeignKey("core.Scenario", on_delete=models.SET_NULL, null=True, blank=True, related_name="memories")
    
    key = models.CharField(max_length=255)
    value = models.JSONField(default=dict)
    memory_type = models.CharField(max_length=20, choices=MEMORY_TYPES)
    
    # Lifecycle
    ttl_seconds = models.IntegerField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    size_bytes = models.IntegerField(default=0)
    
    # Summarization
    is_summarized = models.BooleanField(default=False)
    original_memory_id = models.UUIDField(null=True, blank=True)
    
    # Access tracking
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.agent_definition.name} - {self.key}"

class AgentCallLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_definition = models.ForeignKey(AgentDefinition, on_delete=models.CASCADE, related_name="call_logs")
    workflow_run = models.ForeignKey('workflows.WorkflowRun', on_delete=models.CASCADE, null=True, blank=True, related_name="agent_calls")
    node_execution = models.ForeignKey('workflows.NodeExecution', on_delete=models.CASCADE, null=True, blank=True, related_name="agent_calls")
    provider = models.CharField(max_length=50)
    model = models.CharField(max_length=100)
    tokens_input = models.IntegerField(default=0)
    tokens_output = models.IntegerField(default=0)
    tokens_total = models.IntegerField(default=0)
    cost_input = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    cost_output = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    cost_total = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    latency_ms = models.IntegerField()
    prompt = models.TextField()
    response = models.TextField()
    tools_used = models.JSONField(default=list)
    temperature = models.FloatField()
    max_tokens = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['agent_definition', 'timestamp']),
            models.Index(fields=['workflow_run', 'timestamp']),
        ]

class AgentDefinitionVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_definition = models.ForeignKey(AgentDefinition, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    name = models.CharField(max_length=255)
    llm_provider_snapshot = models.JSONField(default=dict)
    agent_config_snapshot = models.JSONField(default=dict)
    tools_snapshot = models.JSONField(default=list)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    change_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('agent_definition', 'version_number')
        ordering = ['-version_number']

class ChatConversation(models.Model):
    """Persists a chat session between a user and an agent in a specific app context."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("core.User", on_delete=models.CASCADE, related_name="chat_conversations")
    agent_definition = models.ForeignKey(AgentDefinition, on_delete=models.CASCADE, related_name="conversations", null=True, blank=True)
    workflow_id = models.UUIDField(null=True, blank=True)
    node_id = models.CharField(max_length=255, blank=True)  # widget node binding
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat {self.id} - {self.user}"

class ChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
