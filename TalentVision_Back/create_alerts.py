#!/usr/bin/env python
"""
Script pour créer des alertes de test
Usage: python create_alerts.py
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'TalentVision_Back.settings')
django.setup()

from django.contrib.auth import get_user_model
from recruitment.models import Alert, JobPost, Application

User = get_user_model()

def create_test_alerts():
    print("🔔 Création d'alertes de test...")
    print("")
    
    # Récupérer ou utiliser le premier utilisateur disponible
    hr_user = User.objects.filter(role=User.Role.HR).first()
    if not hr_user:
        hr_user = User.objects.filter(role__in=[User.Role.ADMIN, User.Role.MANAGER]).first()
    if not hr_user:
        hr_user = User.objects.first()
    
    if not hr_user:
        print("❌ Erreur: Aucun utilisateur trouvé dans la base de données.")
        print("   Créez d'abord un utilisateur avec: python manage.py createsuperuser")
        return
    
    print(f"✓ Utilisation de l'utilisateur: {hr_user.username} (ID: {hr_user.id}, Role: {hr_user.role})")
    
    # Récupérer ou créer une offre d'emploi
    job_post = JobPost.objects.first()
    if not job_post:
        print("⚠ Création d'une offre de test...")
        job_post = JobPost.objects.create(
            title='Poste de test - Développeur Full Stack',
            description='Poste de test pour les alertes',
            requirements='Expérience en développement web',
            location='Tunis',
            status=JobPost.Status.PUBLISHED,
            created_by=hr_user
        )
        print(f"✓ Offre créée: {job_post.title}")
    else:
        print(f"✓ Utilisation de l'offre: {job_post.title}")
    
    # Récupérer ou créer une candidature
    application = Application.objects.first()
    if not application:
        print("⚠ Création d'une candidature de test...")
        candidate = User.objects.filter(role=User.Role.CANDIDATE).first()
        if not candidate:
            candidate = User.objects.exclude(id=hr_user.id).first()
        if candidate:
            application = Application.objects.create(
                candidate=candidate,
                job_post=job_post,
                status=Application.Status.PENDING,
                source='WEBSITE',
                compatibility_score=85.5
            )
            print(f"✓ Candidature créée pour: {candidate.username}")
        else:
            print("⚠ Aucun candidat trouvé, certaines alertes ne seront pas créées")
    else:
        print(f"✓ Utilisation de la candidature: {application.id}")
    
    # Créer les alertes
    alerts_created = []
    
    # Alerte 1: Score élevé
    if application:
        alert1 = Alert.objects.create(
            alert_type=Alert.AlertType.HIGH_SCORE,
            priority=Alert.Priority.HIGH,
            title=f"Score élevé: {application.candidate.username} pour {job_post.title}",
            message=f"Le candidat {application.candidate.first_name or ''} {application.candidate.last_name or ''} a obtenu un score de compatibilité élevé ({application.compatibility_score or 85}%) pour le poste {job_post.title}.",
            recipient=hr_user,
            related_application=application,
            related_job_post=job_post,
            is_read=False
        )
        alerts_created.append(alert1)
        print(f"✓ Alerte créée: {alert1.title}")
    
    # Alerte 2: Nouvelle candidature
    if application:
        alert2 = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title=f"Nouvelle candidature pour {job_post.title}",
            message=f"Une nouvelle candidature a été reçue pour le poste {job_post.title}.",
            recipient=hr_user,
            related_application=application,
            related_job_post=job_post,
            is_read=False
        )
        alerts_created.append(alert2)
        print(f"✓ Alerte créée: {alert2.title}")
    
    # Alerte 3: Candidat correspondant
    alert3 = Alert.objects.create(
        alert_type=Alert.AlertType.CANDIDATE_MATCH,
        priority=Alert.Priority.MEDIUM,
        title="Candidat correspondant trouvé",
        message=f"Un candidat correspondant a été trouvé pour le poste {job_post.title}. Vérifiez son profil.",
        recipient=hr_user,
        related_job_post=job_post,
        is_read=True
    )
    alerts_created.append(alert3)
    print(f"✓ Alerte créée: {alert3.title}")
    
    # Alerte 4: Matching interne
    alert4 = Alert.objects.create(
        alert_type=Alert.AlertType.INTERNAL_MATCH,
        priority=Alert.Priority.LOW,
        title="Matching interne disponible",
        message=f"Un employé interne pourrait correspondre au poste {job_post.title}. Considérez une promotion interne.",
        recipient=hr_user,
        related_job_post=job_post,
        is_read=False
    )
    alerts_created.append(alert4)
    print(f"✓ Alerte créée: {alert4.title}")
    
    # Alerte 5: Urgente
    alert5 = Alert.objects.create(
        alert_type=Alert.AlertType.HIGH_SCORE,
        priority=Alert.Priority.URGENT,
        title="⚠️ Candidat exceptionnel détecté",
        message=f"Un candidat exceptionnel a été détecté pour le poste {job_post.title}. Action requise rapidement!",
        recipient=hr_user,
        related_job_post=job_post,
        is_read=False
    )
    alerts_created.append(alert5)
    print(f"✓ Alerte créée: {alert5.title}")
    
    print("")
    print(f"✅ {len(alerts_created)} alertes créées avec succès!")
    print("")
    print("💡 Pour voir les alertes:")
    print(f"   1. Connectez-vous avec l'utilisateur '{hr_user.username}'")
    print("   2. Accédez à la page /alerts dans l'application")
    print("")

if __name__ == '__main__':
    create_test_alerts()

