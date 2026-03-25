from rest_framework import serializers
from .models import TransformDefinition, TransformRun
from datasources.serializers import DynamicTableSerializer

class TransformDefinitionSerializer(serializers.ModelSerializer):
    input_table_details = DynamicTableSerializer(source='input_tables', many=True, read_only=True)
    
    class Meta:
        model = TransformDefinition
        fields = '__all__'

class TransformRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransformRun
        fields = '__all__'
