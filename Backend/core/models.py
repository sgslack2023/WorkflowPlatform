import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from encrypted_model_fields.fields import EncryptedCharField, EncryptedTextField

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # email, username, password, is_active, date_joined are already in AbstractUser
    # We can enforce email uniqueness if desired, but spec just lists them.
    
    def __str__(self):
        return self.username

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Membership(models.Model):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'organization')

    def __str__(self):
        return f"{self.user.username} - {self.organization.name} ({self.role})"

class OrganizationRelationship(models.Model):
    RELATIONSHIP_TYPES = (
        ('customer', 'Customer'),
        ('contractor', 'Contractor'),
        ('partner', 'Partner'),
        ('other', 'Other'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='relationships_initiated')
    to_organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='relationships_received')
    relationship_type = models.CharField(max_length=50, choices=RELATIONSHIP_TYPES)
    metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.from_organization.name} -> {self.to_organization.name} ({self.relationship_type})"

class Scenario(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='scenarios')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    
    # Editable overrides
    data_overrides = models.JSONField(default=dict, blank=True)
    agent_overrides = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ResourceShare(models.Model):
    RESOURCE_TYPES = [('workflow', 'Workflow'), ('agent', 'Agent'), ('tool', 'Tool'), ('transform', 'Transform')]
    PERMISSION_LEVELS = [('view', 'View Only'), ('execute', 'View & Execute'), ('edit', 'View, Execute & Edit')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    resource_id = models.UUIDField()
    from_organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shares_given')
    to_organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shares_received', null=True, blank=True)
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    permission_level = models.CharField(max_length=20, choices=PERMISSION_LEVELS)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='shares_created')

class EncryptedSecret(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='secrets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    secret_value = EncryptedTextField()
    secret_type = models.CharField(max_length=50)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_rotated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class AuditLog(models.Model):
    ACTION_TYPES = [('create', 'Create'), ('read', 'Read'), ('update', 'Update'), ('delete', 'Delete'), ('execute', 'Execute'), ('share', 'Share'), ('login', 'Login'), ('logout', 'Logout')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    resource_type = models.CharField(max_length=50)
    resource_id = models.UUIDField(null=True, blank=True)
    resource_name = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10)
    request_path = models.CharField(max_length=500)
    changes = models.JSONField(default=dict)
    metadata = models.JSONField(default=dict)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['organization', 'timestamp']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['action', 'timestamp']),
        ]

class IPAllowlist(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='ip_allowlists')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    ip_range_cidr = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class RateLimitRule(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='rate_limit_rules')
    resource_type = models.CharField(max_length=50)
    limit_count = models.IntegerField()
    limit_period = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

class CostAccounting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='costs')
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    total_workflow_runs = models.IntegerField(default=0)
    total_agent_calls = models.IntegerField(default=0)
    total_tokens = models.BigIntegerField(default=0)
    llm_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    compute_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    storage_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost_breakdown = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Costs for {self.organization.name} ({self.period_start.date()})"
