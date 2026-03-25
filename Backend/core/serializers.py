from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization, Membership, OrganizationRelationship, Scenario, EncryptedSecret, AuditLog, IPAllowlist

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_active', 'is_superuser', 'password')
        read_only_fields = ('id', 'date_joined', 'is_active')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses
        user_data = UserSerializer(self.user).data
        
        # Add organizations
        memberships = Membership.objects.filter(user=self.user)
        # We want simple org data
        orgs_data = []
        for m in memberships:
            orgs_data.append({
                'id': m.organization.id,
                'name': m.organization.name,
                'slug': m.organization.slug,
                'role': m.role
            })
            
        user_data['organizations'] = orgs_data
        data['user'] = user_data
        
        return data

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class MembershipSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Membership
        fields = '__all__'

class OrganizationRelationshipSerializer(serializers.ModelSerializer):
    from_org_name = serializers.CharField(source='from_organization.name', read_only=True)
    to_org_name = serializers.CharField(source='to_organization.name', read_only=True)

    class Meta:
        model = OrganizationRelationship
        fields = '__all__'

class ScenarioSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = Scenario
        fields = '__all__'

class EncryptedSecretSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncryptedSecret
        fields = '__all__'
        extra_kwargs = {'secret_value': {'write_only': True}}

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class IPAllowlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = IPAllowlist
        fields = '__all__'
