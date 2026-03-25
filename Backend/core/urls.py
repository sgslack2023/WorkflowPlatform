from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, MembershipViewSet, 
    OrganizationRelationshipViewSet, ScenarioViewSet,
    EncryptedSecretViewSet, AuditLogViewSet, IPAllowlistViewSet,
    UserViewSet
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'memberships', MembershipViewSet)
router.register(r'relationships', OrganizationRelationshipViewSet)
router.register(r'scenarios', ScenarioViewSet)
router.register(r'secrets', EncryptedSecretViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'ip-allowlist', IPAllowlistViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
