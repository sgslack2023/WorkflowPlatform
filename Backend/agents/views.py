from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LLMProvider, AgentConfig, AgentDefinition, AgentMemory, AgentCallLog, AgentDefinitionVersion
from .serializers import (
    LLMProviderSerializer, AgentConfigSerializer, 
    AgentDefinitionSerializer, AgentMemorySerializer,
    AgentCallLogSerializer,
    AgentDefinitionVersionSerializer
)

class LLMProviderViewSet(viewsets.ModelViewSet):
    queryset = LLMProvider.objects.all()
    serializer_class = LLMProviderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        ).distinct()


class AgentConfigViewSet(viewsets.ModelViewSet):
    queryset = AgentConfig.objects.all()
    serializer_class = AgentConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        ).distinct()

class AgentDefinitionViewSet(viewsets.ModelViewSet):
    queryset = AgentDefinition.objects.all()
    serializer_class = AgentDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        ).distinct()

    @action(detail=True, methods=['post'], url_path='test')
    def test(self, request, pk=None):
        import uuid
        from django.utils import timezone
        agent = self.get_object()
        message = request.data.get('message')
        
        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Real LLM call via llm_service
        from .llm_service import invoke_agent_chat, log_agent_call
        
        result = invoke_agent_chat(agent, message)
        
        # Log the call for auditing
        if 'error' not in result or result.get('content'):
            log_agent_call(agent, message, result)
        
        return Response({
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": result.get('content', 'No response generated.'),
            "timestamp": timezone.now(),
            "tokens_used": result.get('tokens_total', 0),
            "latency_ms": result.get('latency_ms', 0),
        })

class AgentMemoryViewSet(viewsets.ModelViewSet):
    queryset = AgentMemory.objects.all()
    serializer_class = AgentMemorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(agent_definition__organization__memberships__user=self.request.user)

class AgentCallLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AgentCallLog.objects.all()
    serializer_class = AgentCallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(agent_definition__organization__memberships__user=self.request.user)

class AgentDefinitionVersionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AgentDefinitionVersion.objects.all()
    serializer_class = AgentDefinitionVersionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(agent_definition__organization__memberships__user=self.request.user)
