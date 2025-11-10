"""
Commande Django pour créer des alertes de test
Usage: python manage.py create_test_alerts
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from recruitment.models import Alert, JobPost, Application

User = get_user_model()


class Command(BaseCommand):
    help = 'Créer des alertes de test pour le développement'

    def handle(self, *args, **options):
        # Récupérer ou créer un utilisateur HR pour les alertes
        hr_user = User.objects.filter(role=User.Role.HR).first()
        if not hr_user:
            # Essayer de trouver un utilisateur ADMIN ou MANAGER
            hr_user = User.objects.filter(role__in=[User.Role.ADMIN, User.Role.MANAGER]).first()
            if not hr_user:
                # Utiliser le premier utilisateur disponible
                hr_user = User.objects.first()
                if not hr_user:
                    self.stdout.write(self.style.ERROR('Aucun utilisateur trouvé. Créez d\'abord un utilisateur.'))
                    return
                self.stdout.write(self.style.WARNING(f'Utilisation de l\'utilisateur existant: {hr_user.username}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Utilisation de l\'utilisateur: {hr_user.username}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Utilisation de l\'utilisateur HR: {hr_user.username}'))

        # Récupérer un manager si disponible
        manager_user = User.objects.filter(role=User.Role.MANAGER).first()
        if not manager_user:
            manager_user = hr_user

        # Récupérer une offre d'emploi
        job_post = JobPost.objects.first()
        if not job_post:
            self.stdout.write(self.style.WARNING('Aucune offre d\'emploi trouvée. Création d\'une offre de test...'))
            # Créer une offre de test
            from recruitment.models import Skill
            job_post = JobPost.objects.create(
                title='Poste de test - Développeur Full Stack',
                description='Poste de test pour les alertes',
                requirements='Expérience en développement web',
                location='Tunis',
                status=JobPost.Status.PUBLISHED,
                created_by=hr_user
            )
            self.stdout.write(self.style.SUCCESS(f'Offre de test créée: {job_post.title}'))

        # Récupérer une candidature
        application = Application.objects.first()
        if not application:
            self.stdout.write(self.style.WARNING('Aucune candidature trouvée. Création d\'une candidature de test...'))
            # Créer une candidature de test si un candidat existe
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
                self.stdout.write(self.style.SUCCESS(f'Candidature de test créée pour: {candidate.username}'))

        # Créer différentes alertes de test
        alerts_created = []

        # Alerte 1: Score élevé
        if application:
            alert1 = Alert.objects.create(
                alert_type=Alert.AlertType.HIGH_SCORE,
                priority=Alert.Priority.HIGH,
                title=f"Score élevé: {application.candidate.username} pour {job_post.title}",
                message=f"Le candidat {application.candidate.first_name} {application.candidate.last_name} a obtenu un score de compatibilité élevé ({application.compatibility_score or 85}%) pour le poste {job_post.title}.",
                recipient=hr_user,
                related_application=application,
                related_job_post=job_post,
                is_read=False
            )
            alerts_created.append(alert1)

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

        # Alerte 3: Candidat correspondant
        alert3 = Alert.objects.create(
            alert_type=Alert.AlertType.CANDIDATE_MATCH,
            priority=Alert.Priority.MEDIUM,
            title="Candidat correspondant trouvé",
            message=f"Un candidat correspondant a été trouvé pour le poste {job_post.title}. Vérifiez son profil.",
            recipient=hr_user,
            related_job_post=job_post,
            is_read=True  # Déjà lue
        )
        alerts_created.append(alert3)

        # Alerte 4: Matching interne
        alert4 = Alert.objects.create(
            alert_type=Alert.AlertType.INTERNAL_MATCH,
            priority=Alert.Priority.LOW,
            title="Matching interne disponible",
            message=f"Un employé interne pourrait correspondre au poste {job_post.title}. Considérez une promotion interne.",
            recipient=manager_user,
            related_job_post=job_post,
            is_read=False
        )
        alerts_created.append(alert4)

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

        if len(alerts_created) > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ {len(alerts_created)} alertes de test créées avec succès!'))
            self.stdout.write(f'   - Pour l\'utilisateur: {hr_user.username} (ID: {hr_user.id})')
            if manager_user != hr_user:
                self.stdout.write(f'   - Pour l\'utilisateur Manager: {manager_user.username}')
            self.stdout.write('')
            self.stdout.write('💡 Pour voir les alertes:')
            self.stdout.write(f'   1. Connectez-vous avec l\'utilisateur "{hr_user.username}"')
            self.stdout.write('   2. Accédez à la page /alerts')
        else:
            self.stdout.write(self.style.ERROR('❌ Aucune alerte n\'a pu être créée.'))
            self.stdout.write('   Vérifiez que vous avez des utilisateurs et des offres d\'emploi dans la base de données.')

