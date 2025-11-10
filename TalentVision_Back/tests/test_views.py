"""
Tests unitaires pour les vues/API
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from recruitment.models import JobPost, Application, Alert, Skill

User = get_user_model()


@pytest.fixture
def api_client():
    """Client API pour les tests"""
    return APIClient()


class TestJobPostAPI:
    """Tests pour l'API JobPost"""
    
    def test_list_job_posts_authenticated(self, api_client, hr_user, job_post):
        """Test liste des offres pour utilisateur authentifié"""
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/job-posts/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results'] if 'results' in response.data else response.data) >= 1
    
    def test_list_job_posts_unauthenticated(self, api_client):
        """Test liste des offres pour utilisateur non authentifié"""
        response = api_client.get('/api/job-posts/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_job_post(self, api_client, hr_user, skill_python):
        """Test création d'une offre d'emploi"""
        api_client.force_authenticate(user=hr_user)
        data = {
            'title': 'Nouveau Poste',
            'description': 'Description du poste',
            'requirements': 'Exigences',
            'location': 'Tunis',
            'status': 'PUBLISHED',
            'required_skills_ids': [skill_python.id]
        }
        response = api_client.post('/api/job-posts/', data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Nouveau Poste'
    
    def test_candidate_sees_only_published_jobs(self, api_client, candidate_user, job_post, hr_user):
        """Test que les candidats voient seulement les offres publiées"""
        # Créer une offre en brouillon
        draft_job = JobPost.objects.create(
            title='Brouillon',
            description='Test',
            requirements='Test',
            status=JobPost.Status.DRAFT,
            created_by=hr_user
        )
        
        api_client.force_authenticate(user=candidate_user)
        response = api_client.get('/api/job-posts/')
        
        assert response.status_code == status.HTTP_200_OK
        job_ids = [job['id'] for job in (response.data['results'] if 'results' in response.data else response.data)]
        assert job_post.id in job_ids
        assert draft_job.id not in job_ids


class TestApplicationAPI:
    """Tests pour l'API Application"""
    
    def test_list_applications_candidate(self, api_client, candidate_user, application):
        """Test liste des candidatures pour un candidat"""
        api_client.force_authenticate(user=candidate_user)
        response = api_client.get('/api/applications/')
        
        assert response.status_code == status.HTTP_200_OK
        applications = response.data['results'] if 'results' in response.data else response.data
        assert len(applications) >= 1
        assert all(app['candidate']['id'] == candidate_user.id for app in applications)
    
    def test_list_applications_hr(self, api_client, hr_user, application):
        """Test liste des candidatures pour HR"""
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/applications/')
        
        assert response.status_code == status.HTTP_200_OK
        applications = response.data['results'] if 'results' in response.data else response.data
        assert len(applications) >= 1
    
    def test_filter_applications_by_job_post(self, api_client, hr_user, application, job_post):
        """Test filtrage des candidatures par offre"""
        api_client.force_authenticate(user=hr_user)
        response = api_client.get(f'/api/applications/?job_post={job_post.id}')
        
        assert response.status_code == status.HTTP_200_OK
        applications = response.data['results'] if 'results' in response.data else response.data
        assert all(app['job_post']['id'] == job_post.id for app in applications)
    
    def test_sort_applications_by_score(self, api_client, hr_user, job_post, candidate_user):
        """Test tri des candidatures par score"""
        # Créer un deuxième candidat pour éviter la contrainte unique (candidate, job_post)
        from accounts.models import User
        candidate2 = User.objects.create_user(
            username='candidate2_test',
            email='candidate2@test.com',
            password='testpass123',
            role=User.Role.CANDIDATE,
            first_name='Jane',
            last_name='Doe'
        )
        
        # Créer plusieurs candidatures avec différents scores
        app1 = Application.objects.create(
            candidate=candidate_user,
            job_post=job_post,
            compatibility_score=90.0,
            source='WEBSITE'
        )
        app2 = Application.objects.create(
            candidate=candidate2,
            job_post=job_post,
            compatibility_score=75.0,
            source='WEBSITE'
        )
        
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/applications/?ordering=score_desc')
        
        assert response.status_code == status.HTTP_200_OK
        applications = response.data['results'] if 'results' in response.data else response.data
        scores = [app.get('compatibility_score') or 0 for app in applications if app.get('compatibility_score')]
        # Vérifier que les scores sont en ordre décroissant
        assert scores == sorted(scores, reverse=True)


class TestAlertAPI:
    """Tests pour l'API Alert"""
    
    def test_list_alerts(self, api_client, hr_user, job_post):
        """Test liste des alertes"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Test Alert',
            message='Test',
            recipient=hr_user,
            related_job_post=job_post
        )
        
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/alerts/')
        
        assert response.status_code == status.HTTP_200_OK
        alerts = response.data['results'] if 'results' in response.data else response.data
        assert len(alerts) >= 1
        assert any(a['id'] == alert.id for a in alerts)
    
    def test_mark_alert_as_read(self, api_client, hr_user, job_post):
        """Test marquer une alerte comme lue"""
        alert = Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Test',
            message='Test',
            recipient=hr_user,
            related_job_post=job_post,
            is_read=False
        )
        
        api_client.force_authenticate(user=hr_user)
        response = api_client.patch(f'/api/alerts/{alert.id}/mark_as_read/')
        
        assert response.status_code == status.HTTP_200_OK
        alert.refresh_from_db()
        assert alert.is_read == True
    
    def test_unread_count(self, api_client, hr_user, job_post):
        """Test compteur d'alertes non lues"""
        # Créer des alertes lues et non lues
        Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Read',
            message='Test',
            recipient=hr_user,
            related_job_post=job_post,
            is_read=True
        )
        Alert.objects.create(
            alert_type=Alert.AlertType.NEW_APPLICATION,
            priority=Alert.Priority.MEDIUM,
            title='Unread',
            message='Test',
            recipient=hr_user,
            related_job_post=job_post,
            is_read=False
        )
        
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/alerts/unread_count/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] >= 1


class TestDashboardAPI:
    """Tests pour l'API Dashboard"""
    
    def test_dashboard_stats(self, api_client, hr_user, application):
        """Test statistiques du dashboard"""
        api_client.force_authenticate(user=hr_user)
        response = api_client.get('/api/dashboard/stats/')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'total_applications' in response.data
        assert 'pending_applications' in response.data
        assert 'accepted_applications' in response.data
        assert isinstance(response.data['total_applications'], int)

