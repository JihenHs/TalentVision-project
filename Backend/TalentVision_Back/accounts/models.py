from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Modèle utilisateur personnalisé avec rôles"""
    
    class Role(models.TextChoices):
        CANDIDATE = 'CANDIDATE', 'Candidat'
        HR = 'HR', 'Ressources Humaines'
        MANAGER = 'MANAGER', 'Manager'
        ADMIN = 'ADMIN', 'Administrateur'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_candidate(self):
        return self.role == self.Role.CANDIDATE
    
    @property
    def is_hr(self):
        return self.role == self.Role.HR
    
    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

