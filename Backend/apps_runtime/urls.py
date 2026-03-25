from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppDefinitionViewSet, AppRunViewSet

router = DefaultRouter()
router.register(r'definitions', AppDefinitionViewSet)
router.register(r'runs', AppRunViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
