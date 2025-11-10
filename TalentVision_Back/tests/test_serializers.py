"""
Tests unitaires pour les serializers
"""
import pytest
from rest_framework.test import APIClient
from recruitment.serializers import (
    SkillSerializer, JobPostSerializer, ApplicationSerializer,
    CandidateProfileSerializer, AlertSerializer
)
from recruitment.models import Skill, JobPost, Application, CandidateProfile, Alert


class TestSkillSerializer:
    """Tests pour SkillSerializer"""
    
    def test_skill_serializer(self, skill_python):
        """Test sérialisation d'une compétence"""
        serializer = SkillSerializer(skill_python)
        data = serializer.data
        
        assert data['id'] == skill_python.id
        assert data['name'] == 'Python'
        assert data['category'] == 'TECHNICAL'


class TestJobPostSerializer:
    """Tests pour JobPostSerializer"""
    
    def test_job_post_serializer(self, job_post, skill_python, skill_django):
        """Test sérialisation d'une offre d'emploi"""
        serializer = JobPostSerializer(job_post)
        data = serializer.data
        
        assert data['id'] == job_post.id
        assert data['title'] == 'Développeur Full Stack'
        assert data['status'] == 'PUBLISHED'
        assert len(data['required_skills']) == 2
        assert 'created_by' in data


class TestApplicationSerializer:
    """Tests pour ApplicationSerializer"""
    
    def test_application_serializer(self, application, candidate_user, job_post):
        """Test sérialisation d'une candidature"""
        serializer = ApplicationSerializer(application)
        data = serializer.data
        
        assert data['id'] == application.id
        assert data['candidate']['id'] == candidate_user.id
        assert data['job_post']['id'] == job_post.id
        assert data['status'] == 'PENDING'
        assert 'candidate_profile' in data


class TestCandidateProfileSerializer:
    """Tests pour CandidateProfileSerializer"""
    
    def test_candidate_profile_serializer(self, candidate_profile, candidate_user):
        """Test sérialisation d'un profil candidat"""
        serializer = CandidateProfileSerializer(candidate_profile)
        data = serializer.data
        
        assert data['id'] == candidate_profile.id
        assert data['user']['id'] == candidate_user.id
        assert data['experience_years'] == 3
        assert data['cv_analysis_status'] == 'COMPLETED'
        assert 'cv_analysis_result' in data


class TestAlertSerializer:
    """Tests pour AlertSerializer"""
    
    def test_alert_serializer(self, db, hr_user, job_post):
        """Test sérialisation d'une alerte"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Test Alert',
            message='Test message',
            recipient=hr_user,
            related_job_post=job_post
        )
        
        serializer = AlertSerializer(alert)
        data = serializer.data
        
        assert data['id'] == alert.id
        assert data['alert_type'] == 'NEW_APPLICATION'
        assert data['priority'] == 'MEDIUM'
        assert data['title'] == 'Test Alert'
        assert 'recipient' in data
        assert 'related_job_post' in data
    
    def test_alert_serializer_with_application(self, db, hr_user, job_post, application):
        """Test sérialisation d'une alerte avec candidature associée"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.HIGH_SCORE,
            priority=Alert.Priority.HIGH,
            title='High Score Alert',
            message='Test',
            recipient=hr_user,
            related_application=application,
            related_job_post=job_post
        )
        
        serializer = AlertSerializer(alert)
        data = serializer.data
        
        assert data['id'] == alert.id
        assert 'related_application' in data
        assert data['related_application']['id'] == application.id


class TestApplicationCreateSerializer:
    """Tests pour ApplicationCreateSerializer"""
    
    def test_create_application_serializer(self, candidate_user, job_post):
        """Test création d'une candidature via serializer"""
        from recruitment.serializers import ApplicationCreateSerializer
        
        data = {
            'job_post': job_post.id,
            'source': 'WEBSITE'
        }
        
        # Simuler un contexte de requête
        class MockRequest:
            user = candidate_user
        
        serializer = ApplicationCreateSerializer(data=data, context={'request': MockRequest()})
        assert serializer.is_valid()
        
        application = serializer.save()
        assert application.candidate == candidate_user
        assert application.job_post == job_post
        assert application.source == 'WEBSITE'


class TestInternalTalentSerializer:
    """Tests pour InternalTalentSerializer"""
    
    def test_internal_talent_serializer(self, db, hr_user, skill_python):
        """Test sérialisation d'un talent interne"""
        from recruitment.models import InternalTalent
        from recruitment.serializers import InternalTalentSerializer
        
        # Créer un employé interne
        employee = hr_user  # Utiliser hr_user comme employé
        talent = InternalTalent.objects.create(
            employee=employee,
            current_position='Développeur Senior',
            experience_years=5,
            performance_score=8.5,
            is_available_for_promotion=True
        )
        talent.skills.add(skill_python)
        
        serializer = InternalTalentSerializer(talent)
        data = serializer.data
        
        assert data['id'] == talent.id
        assert data['current_position'] == 'Développeur Senior'
        assert data['experience_years'] == 5
        assert data['performance_score'] == 8.5
        assert 'employee' in data
        assert 'skills' in data
        assert len(data['skills']) == 1

