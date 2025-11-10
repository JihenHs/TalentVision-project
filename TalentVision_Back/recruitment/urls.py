from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'job-posts', views.JobPostViewSet, basename='jobpost')
router.register(r'candidate-profiles', views.CandidateProfileViewSet, basename='candidateprofile')
router.register(r'applications', views.ApplicationViewSet, basename='application')
router.register(r'internal-talents', views.InternalTalentViewSet, basename='internaltalent')
router.register(r'alerts', views.AlertViewSet, basename='alert')
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]

