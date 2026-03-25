from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransformDefinitionViewSet, TransformRunViewSet

router = DefaultRouter()
router.register(r'definitions', TransformDefinitionViewSet)
router.register(r'runs', TransformRunViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
