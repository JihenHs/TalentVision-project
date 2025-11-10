"""
Configuration pytest pour les tests
"""
import pytest
import os
from django.contrib.auth import get_user_model
from recruitment.models import Skill, JobPost, Application, CandidateProfile, Alert
from accounts.models import User

# Forcer SQLite pour les tests
os.environ['USE_POSTGRES'] = 'False'

User = get_user_model()


@pytest.fixture
def candidate_user(db):
    """Créer un utilisateur candidat pour les tests"""
    return User.objects.create_user(
        username='candidate_test',
        email='candidate@test.com',
        password='testpass123',
        role=User.Role.CANDIDATE,
        first_name='John',
        last_name='Doe'
    )


@pytest.fixture
def hr_user(db):
    """Créer un utilisateur HR pour les tests"""
    return User.objects.create_user(
        username='hr_test',
        email='hr@test.com',
        password='testpass123',
        role=User.Role.HR,
        first_name='Jane',
        last_name='Smith'
    )


@pytest.fixture
def manager_user(db):
    """Créer un utilisateur Manager pour les tests"""
    return User.objects.create_user(
        username='manager_test',
        email='manager@test.com',
        password='testpass123',
        role=User.Role.MANAGER,
        first_name='Bob',
        last_name='Johnson'
    )


@pytest.fixture
def skill_python(db):
    """Créer une compétence Python"""
    return Skill.objects.create(
        name='Python',
        category='TECHNICAL'
    )


@pytest.fixture
def skill_django(db):
    """Créer une compétence Django"""
    return Skill.objects.create(
        name='Django',
        category='TECHNICAL'
    )


@pytest.fixture
def skill_react(db):
    """Créer une compétence React"""
    return Skill.objects.create(
        name='React',
        category='TECHNICAL'
    )


@pytest.fixture
def job_post(db, hr_user, skill_python, skill_django):
    """Créer une offre d'emploi pour les tests"""
    job = JobPost.objects.create(
        title='Développeur Full Stack',
        description='Recherche développeur expérimenté en Python et Django',
        requirements='Minimum 3 ans d\'expérience',
        location='Tunis',
        status=JobPost.Status.PUBLISHED,
        created_by=hr_user
    )
    job.required_skills.add(skill_python, skill_django)
    return job


@pytest.fixture
def candidate_profile(db, candidate_user):
    """Créer un profil candidat pour les tests"""
    return CandidateProfile.objects.create(
        user=candidate_user,
        experience_years=3,
        current_position='Développeur',
        education_level='BAC+5',
        cv_analysis_status='COMPLETED',
        cv_analysis_result={
            'skills': ['Python', 'Django', 'React'],
            'experience': {
                'years': 3,
                'positions': ['Développeur Full Stack']
            },
            'education': ['Master en Informatique']
        }
    )


@pytest.fixture
def application(db, candidate_user, job_post):
    """Créer une candidature pour les tests"""
    return Application.objects.create(
        candidate=candidate_user,
        job_post=job_post,
        status=Application.Status.PENDING,
        source='WEBSITE',
        compatibility_score=85.5
    )
