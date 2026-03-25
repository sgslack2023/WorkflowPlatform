from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ToolViewSet, ToolExecutionViewSet, ToolVersionViewSet

router = DefaultRouter()
router.register(r'items', ToolViewSet, basename='tool')
router.register(r'executions', ToolExecutionViewSet)
router.register(r'versions', ToolVersionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
