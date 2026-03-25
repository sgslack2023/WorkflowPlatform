from rest_framework import serializers
from .models import AppDefinition, AppRun

class AppDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppDefinition
        fields = '__all__'

class AppRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppRun
        fields = '__all__'
