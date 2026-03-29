from rest_framework import viewsets, permissions
from .models import AppDefinition, AppRun
from .serializers import AppDefinitionSerializer, AppRunSerializer

class AppDefinitionViewSet(viewsets.ModelViewSet):
    queryset = AppDefinition.objects.all()
    serializer_class = AppDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'public_slug'
    
    def get_queryset(self):
        user = self.request.user
        # Superusers can see all apps
        if user.is_superuser:
            return self.queryset.all()
        return self.queryset.filter(organization__memberships__user=user).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        org_id = self.request.data.get('organization')
        
        if not org_id:
            from core.models import Organization
            # For superusers, use the first organization or create without org
            if user.is_superuser:
                org = Organization.objects.first()
                if org:
                    serializer.save(organization=org)
                else:
                    # Superuser can create app without organization
                    serializer.save()
            else:
                org = Organization.objects.filter(memberships__user=user).first()
                if not org:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({"detail": "User is not a member of any organization. Cannot create application."})
                serializer.save(organization=org)
        else:
            serializer.save()

class AppRunViewSet(viewsets.ModelViewSet):
    queryset = AppRun.objects.all()
    serializer_class = AppRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Superusers can see all app runs
        if user.is_superuser:
            return self.queryset.all()
        return self.queryset.filter(app__organization__memberships__user=user)
