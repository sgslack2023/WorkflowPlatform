import uuid
from django.db import models
from django.core.serializers.json import DjangoJSONEncoder

class Workflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey("core.Organization", on_delete=models.CASCADE, related_name="workflows", null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_published = models.BooleanField(default=False, help_text="Whether this workflow is published and available as a component for Apps")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkflowNode(models.Model):
    NODE_TYPES = (
        ('datasource', 'DataSource'),
        ('transform', 'Transform'),
        ('agent', 'Agent'),
        ('tool', 'Tool'),
        ('memory', 'Memory'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="nodes")
    node_type = models.CharField(max_length=50, choices=NODE_TYPES)
    config = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    langgraph_id = models.UUIDField(default=uuid.uuid4, help_text="Unique node identifier for LangGraph orchestration")
    is_exposed_to_apps = models.BooleanField(default=True, help_text="Whether this node can be used as a widget source in applications")
    
    # "Can reference scenario_id to apply scenario overrides" - likely in config, but adding helper method or property might be useful later.
    
    def __str__(self):
        return f"{self.node_type} - {self.langgraph_id}"

class WorkflowEdge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="edges")
    source_node = models.ForeignKey(WorkflowNode, on_delete=models.CASCADE, related_name="outbound_edges")
    target_node = models.ForeignKey(WorkflowNode, on_delete=models.CASCADE, related_name="inbound_edges")

    def __str__(self):
        return f"{self.source_node.langgraph_id} -> {self.target_node.langgraph_id}"

class WorkflowVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    notes = models.TextField(blank=True, null=True)
    nodes_snapshot = models.JSONField(encoder=DjangoJSONEncoder)
    edges_snapshot = models.JSONField(encoder=DjangoJSONEncoder)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ('workflow', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.workflow.name} - v{self.version_number}"

class CompiledWorkflow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_version = models.ForeignKey(WorkflowVersion, on_delete=models.CASCADE, related_name='compilations')
    dag_definition = models.JSONField(encoder=DjangoJSONEncoder)
    langgraph_spec = models.JSONField(encoder=DjangoJSONEncoder)
    checksum = models.CharField(max_length=64)
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True, encoder=DjangoJSONEncoder)
    created_at = models.DateTimeField(auto_now_add=True)
    compiled_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)

class WorkflowRun(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('paused', 'Paused'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='runs')
    compiled_workflow = models.ForeignKey(CompiledWorkflow, on_delete=models.PROTECT, related_name='runs')
    scenario = models.ForeignKey('core.Scenario', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_node = models.ForeignKey(WorkflowNode, on_delete=models.SET_NULL, null=True, blank=True)
    execution_context = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    input_payload = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    output_payload = models.JSONField(default=dict, null=True, blank=True, encoder=DjangoJSONEncoder)
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    triggered_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True)
    parent_run = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_runs')
    idempotency_key = models.CharField(max_length=255, unique=True, null=True, blank=True)
    lock_acquired_at = models.DateTimeField(null=True, blank=True)
    locked_by_worker = models.CharField(max_length=255, null=True, blank=True)

class NodeExecution(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_run = models.ForeignKey(WorkflowRun, on_delete=models.CASCADE, related_name='node_executions')
    node = models.ForeignKey(WorkflowNode, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    input_inline = models.JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    input_ref = models.CharField(max_length=500, null=True, blank=True)
    output_inline = models.JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    output_ref = models.CharField(max_length=500, null=True, blank=True)
    output_size_bytes = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)

class WorkflowRunLog(models.Model):
    LOG_LEVELS = [('debug', 'Debug'), ('info', 'Info'), ('warning', 'Warning'), ('error', 'Error')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow_run = models.ForeignKey(WorkflowRun, on_delete=models.CASCADE, related_name='logs')
    node_execution = models.ForeignKey(NodeExecution, on_delete=models.CASCADE, null=True, blank=True)
    level = models.CharField(max_length=10, choices=LOG_LEVELS)
    message = models.TextField()
    metadata = models.JSONField(default=dict, encoder=DjangoJSONEncoder)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['workflow_run', 'timestamp']),
            models.Index(fields=['level', 'timestamp']),
        ]

