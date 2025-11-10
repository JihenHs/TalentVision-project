# Views pour l'IA (optionnel - peut être utilisé pour des endpoints spécifiques)
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import MLModel
from .serializers import MLModelSerializer


class MLModelViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les modèles ML (lecture seule)"""
    queryset = MLModel.objects.filter(is_active=True)
    serializer_class = MLModelSerializer

