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
        print(f"DEBUG: get_queryset for user {user}")
        return self.queryset.filter(organization__memberships__user=user).distinct()

    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Entering create method. User: {request.user}")
        print(f"DEBUG: Request data: {request.data}")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        try:
            user = self.request.user
            print(f"DEBUG: perform_create for user {user}")
            # Default to the first organization the user is a member of if not explicitly provided
            org_id = self.request.data.get('organization')
            print(f"DEBUG: org_id from data: {org_id}")
            
            if not org_id:
                from core.models import Organization
                org = Organization.objects.filter(memberships__user=user).first()
                print(f"DEBUG: org found: {org}")
                if not org:
                    from rest_framework.exceptions import ValidationError
                    print("DEBUG: No org found, raising ValidationError")
                    raise ValidationError({"detail": "User is not a member of any organization. Cannot create application."})
                
                print(f"DEBUG: Saving serializer with org {org}")
                serializer.save(organization=org)
            else:
                print("DEBUG: Saving serializer with provided org_id")
                serializer.save()
            print("DEBUG: Save successful")
        except Exception as e:
            import traceback
            print(f"DEBUG: EXCEPTION in perform_create: {str(e)}")
            traceback.print_exc()
            raise e

class AppRunViewSet(viewsets.ModelViewSet):
    queryset = AppRun.objects.all()
    serializer_class = AppRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(app__organization__memberships__user=self.request.user)
