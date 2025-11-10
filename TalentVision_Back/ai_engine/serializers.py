from rest_framework import serializers
from .models import MLModel


class MLModelSerializer(serializers.ModelSerializer):
    """Serializer pour les modèles ML"""
    
    class Meta:
        model = MLModel
        fields = ['id', 'name', 'version', 'model_type', 'file_path',
                  'accuracy', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

