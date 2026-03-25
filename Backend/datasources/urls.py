from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataSourceViewSet, DynamicTableViewSet

router = DefaultRouter()
router.register(r'datasources', DataSourceViewSet)
router.register(r'dynamic-tables', DynamicTableViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
