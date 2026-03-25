from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LLMProviderViewSet, AgentConfigViewSet, 
    AgentDefinitionViewSet, AgentMemoryViewSet,
    AgentCallLogViewSet,
    AgentDefinitionVersionViewSet
)

router = DefaultRouter()
router.register(r'providers', LLMProviderViewSet)
router.register(r'configs', AgentConfigViewSet)
router.register(r'definitions', AgentDefinitionViewSet)
router.register(r'memories', AgentMemoryViewSet)
router.register(r'versions', AgentDefinitionVersionViewSet)
router.register(r'calls', AgentCallLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
