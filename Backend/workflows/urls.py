from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, WorkflowNodeViewSet, WorkflowEdgeViewSet, WorkflowRunViewSet, WorkflowVersionViewSet

router = DefaultRouter()
router.register(r'', WorkflowViewSet, basename='workflow')
router.register(r'nodes', WorkflowNodeViewSet)
router.register(r'edges', WorkflowEdgeViewSet)
router.register(r'versions', WorkflowVersionViewSet)
router.register(r'runs', WorkflowRunViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
