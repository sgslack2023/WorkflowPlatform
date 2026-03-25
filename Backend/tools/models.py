import uuid
from django.db import models

class Tool(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Organization is nullable for System Tools (e.g. library tools)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="tools", null=True, blank=True)
    
    # Identification
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    key = models.SlugField(unique=True, help_text="Unique identifier (e.g. 'finance.npv')")
    
    # Execution (The "How" - Pure Python Path)
    # python_path is NOT unique because multiple tools (diff configs) can use same code
    python_path = models.CharField(max_length=500, help_text="Python path to the Tool Class (e.g. 'tools.library.finance.NetPresentValue')")
    
    # Execution Capability (The "When")
    EXECUTION_MODES = [
        ('synchronous', 'Synchronous (Blocking)'), 
        ('asynchronous', 'Asynchronous (Background)'),
    ]
    execution_mode = models.CharField(max_length=20, choices=EXECUTION_MODES, default='synchronous')
    
    # Schemas & Config
    input_schema = models.JSONField(default=dict, help_text="Runtime Inputs (e.g. Table ID, Column)")
    algo_parameters = models.JSONField(default=dict, help_text="Algorithm Config (e.g. Sensitivity, Model Name)")
    output_schema = models.JSONField(default=dict)
    
    # Security & Rate Limiting
    requires_approval = models.BooleanField(default=False)
    allowed_organizations = models.ManyToManyField("core.Organization", blank=True, related_name="allowed_tools")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.key})"

class ToolExecution(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('timeout', 'Timeout'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='executions')
    agent_definition = models.ForeignKey('agents.AgentDefinition', on_delete=models.CASCADE, null=True, blank=True)
    workflow_run = models.ForeignKey('workflows.WorkflowRun', on_delete=models.CASCADE, null=True, blank=True)
    
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(null=True, blank=True)
    
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    
    executed_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    approved_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='tool_approvals')
    
    created_at = models.DateTimeField(auto_now_add=True)

class ToolVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tool = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='versions')
    version_number = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    input_schema = models.JSONField(default=dict)
    output_schema = models.JSONField(default=dict)
    execution_config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('tool', 'version_number')
        ordering = ['-created_at']
