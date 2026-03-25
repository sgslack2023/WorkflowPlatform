from rest_framework import serializers
from .models import DataSource, DynamicTable, DynamicTableHistory

class DataSourceSerializer(serializers.ModelSerializer):
    # Show count of linked tables
    tables_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DataSource
        fields = '__all__'
        read_only_fields = ('organization',)  # Organization is auto-assigned
    
    def get_tables_count(self, obj):
        return obj.tables.count()

class DynamicTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicTable
        fields = '__all__'
        read_only_fields = ('organization',)  # Organization is auto-assigned

class DynamicTableHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DynamicTableHistory
        fields = '__all__'
