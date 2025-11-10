"""
Tests pour la création automatique d'alertes
"""
import pytest
from django.contrib.auth import get_user_model
from recruitment.models import Alert, JobPost, Application, CandidateProfile
from recruitment.views import JobPostViewSet

User = get_user_model()


class TestAlertCreation:
    """Tests pour la création automatique d'alertes"""
    
    def test_alert_created_on_new_application(self, db, candidate_user, hr_user, manager_user, job_post):
        """Test qu'une alerte est créée lors d'une nouvelle candidature"""
        # Créer un profil candidat
        profile = CandidateProfile.objects.create(
            user=candidate_user,
            cv_analysis_status='COMPLETED',
            cv_analysis_result={'skills': ['Python', 'Django']}
        )
        
        # Créer une candidature
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            status=Application.Status.PENDING,
            source='WEBSITE',
            compatibility_score=85.0
        )
        
        # Simuler la création d'alertes
        viewset = JobPostViewSet()
        viewset._create_application_alerts(application, 85.0)
        
        # Vérifier que les alertes ont été créées pour HR et Manager
        hr_alerts = Alert.objects.filter(recipient=hr_user, related_application=application)
        manager_alerts = Alert.objects.filter(recipient=manager_user, related_application=application)
        
        assert hr_alerts.exists()
        assert manager_alerts.exists()
        
        # Vérifier qu'une alerte NEW_APPLICATION a été créée
        new_app_alerts = Alert.objects.filter(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            related_application=application
        )
        assert new_app_alerts.count() >= 2  # Au moins pour HR et Manager
    
    def test_high_score_alert_created(self, db, candidate_user, hr_user, job_post):
        """Test qu'une alerte HIGH_SCORE est créée pour score >= 80%"""
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            compatibility_score=85.0,
            source='WEBSITE'
        )
        
        viewset = JobPostViewSet()
        viewset._create_application_alerts(application, 85.0)
        
        high_score_alerts = Alert.objects.filter(
            alert_type=Alert.AlertType.HIGH_SCORE,
            related_application=application,
            recipient=hr_user
        )
        assert high_score_alerts.exists()
    
    def test_candidate_match_alert_created(self, db, candidate_user, hr_user, job_post):
        """Test qu'une alerte CANDIDATE_MATCH est créée pour score >= 70%"""
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            compatibility_score=75.0,
            source='WEBSITE'
        )
        
        viewset = JobPostViewSet()
        viewset._create_application_alerts(application, 75.0)
        
        match_alerts = Alert.objects.filter(
            alert_type=Alert.AlertType.CANDIDATE_MATCH,
            related_application=application,
            recipient=hr_user
        )
        assert match_alerts.exists()
    
    def test_no_high_score_alert_for_low_score(self, db, candidate_user, hr_user, job_post):
        """Test qu'aucune alerte HIGH_SCORE n'est créée pour score < 80%"""
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            compatibility_score=65.0,
            source='WEBSITE'
        )
        
        viewset = JobPostViewSet()
        viewset._create_application_alerts(application, 65.0)
        
        high_score_alerts = Alert.objects.filter(
            alert_type=Alert.AlertType.HIGH_SCORE,
            related_application=application
        )
        assert not high_score_alerts.exists()

