# Modèles pour l'IA - peut être utilisé pour stocker des métadonnées de modèles ML
from django.db import models


class MLModel(models.Model):
    """Métadonnées des modèles ML"""
    name = models.CharField(max_length=200)
    version = models.CharField(max_length=50)
    model_type = models.CharField(
        max_length=50,
        choices=[
            ('CV_ANALYZER', 'Analyseur de CV'),
            ('COMPATIBILITY_SCORER', 'Scoreur de compatibilité'),
            ('TURNOVER_PREDICTOR', 'Prédicteur de turnover'),
        ]
    )
    file_path = models.CharField(max_length=500)
    accuracy = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} v{self.version}"

