from rest_framework import serializers
from .models import (
    Skill, JobPost, CandidateProfile, Application,
    InternalTalent, Alert
)
from accounts.serializers import UserSerializer


class SkillSerializer(serializers.ModelSerializer):
    """Serializer pour les compétences"""
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']
        read_only_fields = ['id']


class JobPostSerializer(serializers.ModelSerializer):
    """Serializer pour les offres d'emploi"""
    created_by = UserSerializer(read_only=True)
    required_skills = SkillSerializer(many=True, read_only=True)
    required_skills_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        source='required_skills',
        write_only=True,
        required=False
    )
    applications_count = serializers.IntegerField(source='applications.count', read_only=True)
    
    class Meta:
        model = JobPost
        fields = ['id', 'title', 'description', 'requirements', 'location',
                  'salary_min', 'salary_max', 'status', 'required_skills',
                  'required_skills_ids', 'created_by', 'created_at', 'updated_at',
                  'closing_date', 'applications_count']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidateProfileSerializer(serializers.ModelSerializer):
    """Serializer pour le profil candidat"""
    user = UserSerializer(read_only=True)
    extracted_skills = SkillSerializer(many=True, read_only=True)
    extracted_skills_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        source='extracted_skills',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = CandidateProfile
        fields = ['id', 'user', 'cv_file', 'cover_letter', 'cover_letter_file',
                  'extracted_skills', 'extracted_skills_ids', 'experience_years',
                  'current_position', 'education_level', 'cv_analysis_status',
                  'cv_analysis_result', 'created_at', 'updated_at']
        read_only_fields = ['id', 'cv_analysis_status', 'cv_analysis_result',
                           'created_at', 'updated_at']


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer pour les candidatures"""
    candidate = UserSerializer(read_only=True)
    job_post = JobPostSerializer(read_only=True)
    job_post_id = serializers.PrimaryKeyRelatedField(
        queryset=JobPost.objects.all(),
        source='job_post',
        write_only=True
    )
    candidate_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = ['id', 'candidate', 'job_post', 'job_post_id', 'status',
                  'compatibility_score', 'interview_notes', 'interview_date',
                  'source', 'applied_at', 'updated_at', 'candidate_profile']
        read_only_fields = ['id', 'candidate', 'applied_at', 'updated_at']
    
    def get_candidate_profile(self, obj):
        """Récupérer le profil candidat avec les informations extraites du CV"""
        try:
            # Vérifier si le profil existe en utilisant getattr avec une valeur par défaut
            from .models import CandidateProfile
            try:
                profile = obj.candidate.candidate_profile
            except CandidateProfile.DoesNotExist:
                # Si le profil n'existe pas, retourner un objet vide
                return {
                    'id': None,
                    'cv_file': None,
                    'cover_letter': '',
                    'extracted_skills': [],
                    'experience_years': 0,
                    'current_position': '',
                    'education_level': '',
                    'cv_analysis_status': 'PENDING',
                    'cv_analysis_result': {},
                }
            
            profile = obj.candidate.candidate_profile
            cv_file_url = None
            if profile.cv_file:
                try:
                    # Retourner l'URL relative pour que le proxy Vite puisse la gérer
                    cv_file_url = profile.cv_file.url
                except Exception:
                    cv_file_url = None
            
            return {
                'id': profile.id,
                'cv_file': cv_file_url,
                'cover_letter': profile.cover_letter or '',
                'extracted_skills': [
                    {'id': skill.id, 'name': skill.name, 'category': skill.category}
                    for skill in profile.extracted_skills.all()
                ],
                'experience_years': profile.experience_years or 0,
                'current_position': profile.current_position or '',
                'education_level': profile.education_level or '',
                'cv_analysis_status': profile.cv_analysis_status,
                'cv_analysis_result': profile.cv_analysis_result if profile.cv_analysis_result else {},
            }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting candidate profile: {e}")
            # Retourner un objet vide plutôt que None pour éviter les erreurs frontend
            return {
                'id': None,
                'cv_file': None,
                'cover_letter': '',
                'extracted_skills': [],
                'experience_years': 0,
                'current_position': '',
                'education_level': '',
                'cv_analysis_status': 'PENDING',
                'cv_analysis_result': {},
            }


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une candidature"""
    
    class Meta:
        model = Application
        fields = ['job_post', 'source']
    
    def create(self, validated_data):
        validated_data['candidate'] = self.context['request'].user
        return super().create(validated_data)


class InternalTalentSerializer(serializers.ModelSerializer):
    """Serializer pour les talents internes"""
    employee = UserSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    skills_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        source='skills',
        write_only=True,
        required=False
    )
    potential_positions = JobPostSerializer(many=True, read_only=True)
    
    class Meta:
        model = InternalTalent
        fields = ['id', 'employee', 'current_position', 'skills', 'skills_ids',
                  'experience_years', 'performance_score', 'potential_positions',
                  'is_available_for_promotion', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertSerializer(serializers.ModelSerializer):
    """Serializer pour les alertes"""
    recipient = UserSerializer(read_only=True)
    related_application = serializers.SerializerMethodField()
    related_job_post = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = ['id', 'alert_type', 'priority', 'title', 'message',
                  'recipient', 'related_application', 'related_job_post',
                  'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_related_application(self, obj):
        """Retourner les informations de la candidature liée"""
        if obj.related_application:
            return {
                'id': obj.related_application.id,
                'candidate': {
                    'first_name': obj.related_application.candidate.first_name or '',
                    'last_name': obj.related_application.candidate.last_name or '',
                },
                'job_post': {
                    'id': obj.related_application.job_post.id,
                    'title': obj.related_application.job_post.title,
                }
            }
        return None
    
    def get_related_job_post(self, obj):
        """Retourner les informations de l'offre liée"""
        if obj.related_job_post:
            return {
                'id': obj.related_job_post.id,
                'title': obj.related_job_post.title,
            }
        return None


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques du dashboard"""
    total_applications = serializers.IntegerField()
    pending_applications = serializers.IntegerField()
    accepted_applications = serializers.IntegerField()
    rejected_applications = serializers.IntegerField()
    average_compatibility_score = serializers.FloatField()
    average_time_to_hire = serializers.FloatField()
    applications_by_source = serializers.DictField()
    applications_by_status = serializers.DictField()
    top_skills_demand = serializers.ListField()
    internal_matches_count = serializers.IntegerField()

