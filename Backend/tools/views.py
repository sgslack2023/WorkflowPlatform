from django.db import models
from rest_framework import viewsets, permissions, response, decorators
from .models import Tool, ToolExecution, ToolVersion
from .serializers import ToolSerializer, ToolExecutionSerializer, ToolVersionSerializer
from .services import ToolExecutionService # Import Service

class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @decorators.action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        tool = self.get_object()
        input_data = request.data
        
        service = ToolExecutionService()
        execution = service.execute_tool(tool, input_data, user=request.user)
        
        return response.Response(ToolExecutionSerializer(execution).data)

    def perform_create(self, serializer):
        # Automatically assign the new tool to the user's organization
        # Assuming the user has a profile/membership linking them to an org
        # For now, we'll try to get it from request.user.organization (if simple)
        # or via the membership relation: request.user.memberships.first().organization
        
        # Adaptation to the platform's likely User model structure:
        organization = None
        if hasattr(self.request.user, 'memberships') and self.request.user.memberships.exists():
            organization = self.request.user.memberships.first().organization
        
        # If no org found (superuser?), it might default to None (System Tool) 
        # but we probably want to enforce Org for non-superusers.
        serializer.save(organization=organization)

    def get_queryset(self):
        user = self.request.user
        # Return tools belonging to user's org OR global tools (organization is None)
        return self.queryset.filter(
            models.Q(organization__memberships__user=user) | 
            models.Q(organization__isnull=True)
        ).distinct()

class ToolExecutionViewSet(viewsets.ModelViewSet):
    queryset = ToolExecution.objects.all()
    serializer_class = ToolExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(tool__organization__memberships__user=self.request.user)

class ToolVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ToolVersion.objects.all()
    serializer_class = ToolVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(tool__organization__memberships__user=self.request.user)
