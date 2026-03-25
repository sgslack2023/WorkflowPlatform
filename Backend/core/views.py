from django.db import models
from rest_framework import viewsets, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Organization, Membership, OrganizationRelationship, Scenario, EncryptedSecret, AuditLog, IPAllowlist
from .serializers import (
    OrganizationSerializer, MembershipSerializer, 
    OrganizationRelationshipSerializer, ScenarioSerializer,
    EncryptedSecretSerializer, AuditLogSerializer, IPAllowlistSerializer,
    UserSerializer, CustomTokenObtainPairSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] # Changed from IsAdminUser

    def get_queryset(self):
        # Allow listing all users for now as requested, but exclude AnonymousUser
        return self.queryset.exclude(username='AnonymousUser')

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow listing all organizations as requested
        return self.queryset

class MembershipViewSet(viewsets.ModelViewSet):
    queryset = Membership.objects.all()
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow listing all memberships as requested
        return self.queryset

class OrganizationRelationshipViewSet(viewsets.ModelViewSet):
    queryset = OrganizationRelationship.objects.all()
    serializer_class = OrganizationRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]

class ScenarioViewSet(viewsets.ModelViewSet):
    queryset = Scenario.objects.all()
    serializer_class = ScenarioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Basic filtering: return scenarios for user's organizations
        user_orgs = Organization.objects.filter(memberships__user=self.request.user)
        return self.queryset.filter(organization__in=user_orgs)

class EncryptedSecretViewSet(viewsets.ModelViewSet):
    queryset = EncryptedSecret.objects.all()
    serializer_class = EncryptedSecretSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(organization__memberships__user=self.request.user)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(organization__memberships__user=self.request.user)

class IPAllowlistViewSet(viewsets.ModelViewSet):
    queryset = IPAllowlist.objects.all()
    serializer_class = IPAllowlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(organization__memberships__user=self.request.user)
