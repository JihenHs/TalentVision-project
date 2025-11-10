"""
Tests unitaires pour les modèles
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from recruitment.models import Skill, JobPost, Application, CandidateProfile, Alert, InternalTalent

User = get_user_model()


class TestSkill:
    """Tests pour le modèle Skill"""
    
    def test_create_skill(self, db):
        """Test création d'une compétence"""
        skill = Skill.objects.create(
            name='Python',
            category='TECHNICAL'
        )
        assert skill.name == 'Python'
        assert skill.category == 'TECHNICAL'
        assert str(skill) == 'Python'
    
    def test_skill_unique_name(self, db):
        """Test que le nom de compétence est unique"""
        Skill.objects.create(name='Python', category='TECHNICAL')
        with pytest.raises(Exception):  # IntegrityError
            Skill.objects.create(name='Python', category='TECHNICAL')


class TestJobPost:
    """Tests pour le modèle JobPost"""
    
    def test_create_job_post(self, db, hr_user, skill_python):
        """Test création d'une offre d'emploi"""
        job = JobPost.objects.create(
            title='Développeur Python',
            description='Poste de développeur',
            requirements='Expérience requise',
            location='Tunis',
            status=JobPost.Status.PUBLISHED,
            created_by=hr_user
        )
        job.required_skills.add(skill_python)
        
        assert job.title == 'Développeur Python'
        assert job.status == JobPost.Status.PUBLISHED
        assert job.created_by == hr_user
        assert skill_python in job.required_skills.all()
    
    def test_job_post_default_status(self, db, hr_user):
        """Test que le statut par défaut est DRAFT"""
        job = JobPost.objects.create(
            title='Test Job',
            description='Test',
            requirements='Test',
            created_by=hr_user
        )
        assert job.status == JobPost.Status.DRAFT


class TestApplication:
    """Tests pour le modèle Application"""
    
    def test_create_application(self, db, candidate_user, job_post):
        """Test création d'une candidature"""
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            status=Application.Status.PENDING,
            source='WEBSITE'
        )
        
        assert application.candidate == candidate_user
        assert application.job_post == job_post
        assert application.status == Application.Status.PENDING
        assert application.source == 'WEBSITE'
    
    def test_application_default_status(self, db, candidate_user, job_post):
        """Test que le statut par défaut est PENDING"""
        application = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            source='WEBSITE'
        )
        assert application.status == Application.Status.PENDING


class TestCandidateProfile:
    """Tests pour le modèle CandidateProfile"""
    
    def test_create_candidate_profile(self, db, candidate_user):
        """Test création d'un profil candidat"""
        profile = CandidateProfile.objects.create(
            user=candidate_user,
            experience_years=3,
            current_position='Développeur',
            education_level='BAC+5',
            cv_analysis_status='COMPLETED'
        )
        
        assert profile.user == candidate_user
        assert profile.experience_years == 3
        assert profile.cv_analysis_status == 'COMPLETED'
    
    def test_candidate_profile_one_to_one(self, db, candidate_user):
        """Test relation OneToOne avec User"""
        profile1 = CandidateProfile.objects.create(user=candidate_user)
        # Ne devrait pas pouvoir créer un deuxième profil pour le même utilisateur
        # (géré par OneToOneField)
        assert CandidateProfile.objects.filter(user=candidate_user).count() == 1


class TestAlert:
    """Tests pour le modèle Alert"""
    
    def test_create_alert(self, db, hr_user, job_post):
        """Test création d'une alerte"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Nouvelle candidature',
            message='Un candidat a postulé',
            recipient=hr_user,
            related_job_post=job_post
        )
        
        assert alert.alert_type == Alert.AlertType.NEW_APPLICATION
        assert alert.priority == Alert.Priority.MEDIUM
        assert alert.recipient == hr_user
        assert alert.is_read == False
    
    def test_alert_default_is_read(self, db, hr_user, job_post):
        """Test que is_read est False par défaut"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Test',
            message='Test',
            recipient=hr_user,
            related_job_post=job_post
        )
        assert alert.is_read == False
    
    def test_alert_with_application(self, db, hr_user, job_post, application):
        """Test création d'une alerte avec candidature associée"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.HIGH_SCORE,
            priority=Alert.Priority.HIGH,
            title='High Score',
            message='Test',
            recipient=hr_user,
            related_application=application,
            related_job_post=job_post
        )
        assert alert.related_application == application
        assert alert.related_job_post == job_post


class TestInternalTalent:
    """Tests pour le modèle InternalTalent"""
    
    def test_create_internal_talent(self, db, hr_user, skill_python):
        """Test création d'un talent interne"""
        talent = InternalTalent.objects.create(
            employee=hr_user,
            current_position='Développeur Senior',
            experience_years=5,
            performance_score=8.5,
            is_available_for_promotion=True
        )
        talent.skills.add(skill_python)
        
        assert talent.employee == hr_user
        assert talent.current_position == 'Développeur Senior'
        assert talent.experience_years == 5
        assert talent.performance_score == 8.5
        assert talent.is_available_for_promotion == True
        assert skill_python in talent.skills.all()
    
    def test_internal_talent_one_to_one(self, db, hr_user):
        """Test relation OneToOne avec User"""
        talent1 = InternalTalent.objects.create(
            employee=hr_user,
            current_position='Test'
        )
        assert InternalTalent.objects.filter(employee=hr_user).count() == 1
    
    def test_internal_talent_default_values(self, db, hr_user):
        """Test valeurs par défaut"""
        talent = InternalTalent.objects.create(
            employee=hr_user,
            current_position='Test'
        )
        assert talent.experience_years == 0
        assert talent.is_available_for_promotion == True
        assert talent.performance_score is None or talent.performance_score == 0

