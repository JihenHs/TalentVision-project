from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import (
    Skill, JobPost, CandidateProfile, Application,
    InternalTalent, Alert
)
from .serializers import (
    SkillSerializer, JobPostSerializer, CandidateProfileSerializer,
    ApplicationSerializer, ApplicationCreateSerializer,
    InternalTalentSerializer, AlertSerializer, DashboardStatsSerializer
)
from accounts.models import User


class SkillViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des compétences"""
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category']


class JobPostViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des offres d'emploi"""
    queryset = JobPost.objects.all()
    serializer_class = JobPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'created_by']
    
    def _create_application_alerts(self, application, compatibility_score):
        """Créer des alertes automatiques pour une nouvelle candidature"""
        from .models import Alert
        from accounts.models import User
        
        # Récupérer tous les utilisateurs HR et Manager
        hr_managers = User.objects.filter(
            role__in=[User.Role.HR, User.Role.MANAGER, User.Role.ADMIN]
        )
        
        if not hr_managers.exists():
            return
        
        candidate_name = f"{application.candidate.first_name or ''} {application.candidate.last_name or ''}".strip()
        if not candidate_name:
            candidate_name = application.candidate.username
        
        # Alerte 1: Nouvelle candidature (toujours créée)
        for hr_manager in hr_managers:
            Alert.objects.create(
                alert_type=Alert.AlertType.NEW_APPLICATION,
                priority=Alert.Priority.MEDIUM,
                title=f"Nouvelle candidature: {candidate_name} pour {application.job_post.title}",
                message=f"{candidate_name} a soumis une candidature pour le poste \"{application.job_post.title}\".{' Score de compatibilité: ' + str(round(compatibility_score, 1)) + '%' if compatibility_score is not None else ''}",
                recipient=hr_manager,
                related_application=application,
                related_job_post=application.job_post,
                is_read=False
            )
        
        # Alerte 2: Score élevé (si score >= 80%)
        if compatibility_score is not None and compatibility_score >= 80:
            for hr_manager in hr_managers:
                Alert.objects.create(
                    alert_type=Alert.AlertType.HIGH_SCORE,
                    priority=Alert.Priority.HIGH if compatibility_score >= 90 else Alert.Priority.MEDIUM,
                    title=f"⭐ Score élevé: {candidate_name} pour {application.job_post.title}",
                    message=f"Le candidat {candidate_name} a obtenu un excellent score de compatibilité ({round(compatibility_score, 1)}%) pour le poste \"{application.job_post.title}\". Candidat à examiner en priorité!",
                    recipient=hr_manager,
                    related_application=application,
                    related_job_post=application.job_post,
                    is_read=False
                )
        
        # Alerte 3: Candidat correspondant (si score >= 70%)
        if compatibility_score is not None and compatibility_score >= 70:
            for hr_manager in hr_managers:
                Alert.objects.create(
                    alert_type=Alert.AlertType.CANDIDATE_MATCH,
                    priority=Alert.Priority.MEDIUM,
                    title=f"👤 Candidat correspondant: {candidate_name}",
                    message=f"Un candidat correspondant ({round(compatibility_score, 1)}%) a été trouvé pour le poste \"{application.job_post.title}\". Vérifiez son profil.",
                    recipient=hr_manager,
                    related_application=application,
                    related_job_post=application.job_post,
                    is_read=False
                )
    search_fields = ['title', 'description', 'requirements']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_candidate:
            # Les candidats voient seulement les offres publiées
            queryset = queryset.filter(status=JobPost.Status.PUBLISHED)
        return queryset.select_related('created_by').prefetch_related('required_skills')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def best_matches(self, request, pk=None):
        """Obtenir les candidatures les plus compatibles pour cette offre"""
        job_post = self.get_object()
        
        # Récupérer toutes les candidatures pour cette offre
        applications = Application.objects.filter(
            job_post=job_post
        ).select_related(
            'candidate', 'candidate__candidate_profile'
        ).prefetch_related(
            'candidate__candidate_profile__extracted_skills'
        )
        
        # Trier par score de compatibilité (décroissant)
        applications = applications.order_by('-compatibility_score', '-applied_at')
        
        # Sérialiser les résultats
        from .serializers import ApplicationSerializer
        serializer = ApplicationSerializer(applications, many=True)
        
        return Response({
            'job_post': {
                'id': job_post.id,
                'title': job_post.title,
                'required_skills': list(job_post.required_skills.values_list('name', flat=True))
            },
            'applications': serializer.data,
            'total': applications.count(),
            'with_score': applications.exclude(compatibility_score__isnull=True).count()
        })
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Candidater à une offre"""
        job_post = self.get_object()
        if job_post.status != JobPost.Status.PUBLISHED:
            return Response(
                {'error': 'Cette offre n\'est plus disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si déjà candidaté
        if Application.objects.filter(
            candidate=request.user,
            job_post=job_post
        ).exists():
            return Response(
                {'error': 'Vous avez déjà candidaté à cette offre'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le CV est fourni
        if 'cv_file' not in request.FILES:
            return Response(
                {'error': 'Le CV est obligatoire'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer ou mettre à jour le profil candidat avec le CV
        from .models import CandidateProfile
        candidate_profile, created = CandidateProfile.objects.get_or_create(
            user=request.user
        )
        
        # Mettre à jour le CV
        candidate_profile.cv_file = request.FILES['cv_file']
        
        # Mettre à jour la lettre de motivation dans le profil
        cover_letter = request.data.get('cover_letter', '')
        if cover_letter:
            candidate_profile.cover_letter = cover_letter
        
        # Réinitialiser le statut d'analyse
        candidate_profile.cv_analysis_status = 'PENDING'
        candidate_profile.save()
        
        # Déclencher l'analyse du CV (toujours en synchrone pour garantir l'exécution)
        try:
            from ai_engine.cv_analyzer import CVAnalyzer
            from .models import Skill
            import traceback
            import logging
            
            logger = logging.getLogger(__name__)
            logger.info(f"Starting CV analysis for profile {candidate_profile.id}")
            
            analyzer = CVAnalyzer()
            file_path = candidate_profile.cv_file.path
            logger.info(f"CV file path: {file_path}")
            
            # Analyser le CV
            result = analyzer.analyze_cv(file_path)
            logger.info(f"CV analysis result: {result}")
            
            # Sauvegarder le résultat
            candidate_profile.cv_analysis_result = result
            candidate_profile.cv_analysis_status = 'COMPLETED'
            
            # Extraire et associer les compétences
            if 'skills' in result and result['skills']:
                logger.info(f"Found {len(result['skills'])} skills")
                skills_to_add = []
                for skill_name in result['skills']:
                    skill, created = Skill.objects.get_or_create(
                        name=skill_name,
                        defaults={'category': 'TECHNICAL'}
                    )
                    skills_to_add.append(skill)
                candidate_profile.extracted_skills.set(skills_to_add)
            
            # Mettre à jour l'expérience
            if 'experience' in result:
                if 'years' in result['experience'] and result['experience']['years']:
                    logger.info(f"Found experience: {result['experience']['years']} years")
                    candidate_profile.experience_years = result['experience']['years']
                if 'positions' in result['experience'] and result['experience']['positions']:
                    logger.info(f"Found positions: {result['experience']['positions']}")
                    # Prendre le premier poste comme poste actuel
                    candidate_profile.current_position = result['experience']['positions'][0]
            
            candidate_profile.save()
            logger.info(f"CV analysis completed successfully for profile {candidate_profile.id}")
            
            # Essayer aussi d'envoyer à Celery pour traitement asynchrone (optionnel)
            try:
                from ai_engine.tasks import analyze_cv
                analyze_cv.delay(candidate_profile.id)
            except:
                pass  # Ignorer si Celery n'est pas disponible
            
        except Exception as sync_error:
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            error_trace = traceback.format_exc()
            candidate_profile.cv_analysis_status = 'FAILED'
            candidate_profile.cv_analysis_result = {
                'error': str(sync_error),
                'traceback': error_trace
            }
            candidate_profile.save()
            logger.error(f"Error analyzing CV: {sync_error}")
            logger.error(error_trace)
            print(f"Error analyzing CV: {sync_error}")
            print(error_trace)
        
        serializer = ApplicationCreateSerializer(
            data={
                'job_post': job_post.id,
                'source': 'WEBSITE'  # Par défaut
            },
            context={'request': request}
        )
        
        if serializer.is_valid():
            application = serializer.save()
            
            # Calculer le score de compatibilité de manière synchrone
            try:
                from ai_engine.cv_analyzer import CompatibilityScorer
                from .models import CandidateProfile
                
                # Récupérer le profil candidat
                try:
                    profile = candidate_profile  # Déjà récupéré plus haut
                except:
                    profile = application.candidate.candidate_profile
                
                # Récupérer les compétences du candidat
                candidate_skills = list(profile.extracted_skills.values_list('name', flat=True))
                if not candidate_skills and profile.cv_analysis_result:
                    candidate_skills = profile.cv_analysis_result.get('skills', [])
                
                # Récupérer les compétences requises pour le poste
                job_skills = list(job_post.required_skills.values_list('name', flat=True))
                
                # Calculer le score
                scorer = CompatibilityScorer()
                score_result = scorer.calculate_score(
                    candidate_skills=candidate_skills,
                    job_requirements=job_skills,
                    candidate_experience=profile.experience_years or 0,
                    job_min_experience=0,  # TODO: Ajouter un champ min_experience dans JobPost
                    candidate_education=profile.cv_analysis_result.get('education', []) if profile.cv_analysis_result else [],
                    job_description=job_post.description
                )
                
                application.compatibility_score = score_result['total_score']
                application.save()
                
                # Créer des alertes automatiques pour les HR et Managers
                self._create_application_alerts(application, score_result['total_score'])
                
                # Essayer aussi d'envoyer à Celery pour traitement asynchrone (optionnel)
                try:
                    from ai_engine.tasks import calculate_compatibility_score
                    calculate_compatibility_score.delay(application.id)
                except:
                    pass  # Ignorer si Celery n'est pas disponible
                    
            except Exception as score_error:
                # Si le calcul échoue, on continue quand même
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Error calculating compatibility score: {score_error}")
                # Créer quand même une alerte pour la nouvelle candidature même si le score n'a pas pu être calculé
                self._create_application_alerts(application, None)
            
            # Si le score n'a pas pu être calculé, créer quand même l'alerte de nouvelle candidature
            if application.compatibility_score is None:
                self._create_application_alerts(application, None)
            
            return Response(
                ApplicationSerializer(application).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CandidateProfileViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des profils candidats"""
    queryset = CandidateProfile.objects.all()
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_candidate:
            # Les candidats voient seulement leur propre profil
            queryset = queryset.filter(user=self.request.user)
        return queryset.select_related('user').prefetch_related('extracted_skills')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def upload_cv(self, request, pk=None):
        """Upload et analyse d'un CV"""
        profile = self.get_object()
        if 'cv_file' not in request.FILES:
            return Response(
                {'error': 'Fichier CV requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile.cv_file = request.FILES['cv_file']
        profile.cv_analysis_status = 'PENDING'
        profile.save()
        
        # Analyser de manière synchrone
        try:
            from ai_engine.cv_analyzer import CVAnalyzer
            from .models import Skill
            analyzer = CVAnalyzer()
            file_path = profile.cv_file.path
            result = analyzer.analyze_cv(file_path)
            
            profile.cv_analysis_result = result
            profile.cv_analysis_status = 'COMPLETED'
            
            if 'skills' in result and result['skills']:
                skills_to_add = []
                for skill_name in result['skills']:
                    skill, created = Skill.objects.get_or_create(
                        name=skill_name,
                        defaults={'category': 'TECHNICAL'}
                    )
                    skills_to_add.append(skill)
                profile.extracted_skills.set(skills_to_add)
            
            if 'experience' in result:
                if 'years' in result['experience'] and result['experience']['years']:
                    profile.experience_years = result['experience']['years']
                if 'positions' in result['experience'] and result['experience']['positions']:
                    profile.current_position = result['experience']['positions'][0]
            
            profile.save()
        except Exception as e:
            profile.cv_analysis_status = 'FAILED'
            profile.cv_analysis_result = {'error': str(e)}
            profile.save()
        
        return Response(
            CandidateProfileSerializer(profile).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def analyze_cv(self, request, pk=None):
        """Relancer l'analyse d'un CV existant"""
        try:
            profile = self.get_object()
        except Exception as e:
            return Response(
                {'error': f'Profil introuvable: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not profile.cv_file:
            return Response(
                {'error': 'Aucun fichier CV trouvé'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from ai_engine.cv_analyzer import CVAnalyzer
            from .models import Skill
            import os
            
            # Vérifier que le fichier existe
            if not os.path.exists(profile.cv_file.path):
                return Response(
                    {'error': f'Le fichier CV n\'existe pas: {profile.cv_file.path}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            analyzer = CVAnalyzer()
            file_path = profile.cv_file.path
            
            # Analyser le CV
            result = analyzer.analyze_cv(file_path)
            
            # Vérifier que le résultat est valide
            if not result or 'error' in result:
                profile.cv_analysis_status = 'FAILED'
                profile.cv_analysis_result = result or {'error': 'Analyse échouée'}
                profile.save()
                return Response(
                    {'error': result.get('error', 'Analyse échouée') if result else 'Analyse échouée'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            profile.cv_analysis_result = result
            profile.cv_analysis_status = 'COMPLETED'
            
            # Extraire et associer les compétences
            if 'skills' in result and result['skills']:
                try:
                    skills_to_add = []
                    for skill_name in result['skills']:
                        if skill_name and isinstance(skill_name, str):
                            skill, created = Skill.objects.get_or_create(
                                name=skill_name[:100],  # Limiter la longueur
                                defaults={'category': 'TECHNICAL'}
                            )
                            skills_to_add.append(skill)
                    if skills_to_add:
                        profile.extracted_skills.set(skills_to_add)
                except Exception as skill_error:
                    # Logger l'erreur mais continuer
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Error setting skills: {skill_error}")
            
            # Mettre à jour l'expérience
            if 'experience' in result and isinstance(result['experience'], dict):
                if 'years' in result['experience'] and result['experience']['years']:
                    try:
                        profile.experience_years = int(result['experience']['years'])
                    except (ValueError, TypeError):
                        pass
                if 'positions' in result['experience'] and result['experience']['positions']:
                    if isinstance(result['experience']['positions'], list) and len(result['experience']['positions']) > 0:
                        position = result['experience']['positions'][0]
                        if position and isinstance(position, str):
                            profile.current_position = position[:200]  # Limiter la longueur
            
            profile.save()
            
            return Response(
                CandidateProfileSerializer(profile).data,
                status=status.HTTP_200_OK
            )
        except FileNotFoundError as e:
            import traceback
            profile.cv_analysis_status = 'FAILED'
            profile.cv_analysis_result = {
                'error': f'Fichier CV introuvable: {str(e)}',
                'traceback': traceback.format_exc()
            }
            profile.save()
            return Response(
                {'error': f'Fichier CV introuvable: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            profile.cv_analysis_status = 'FAILED'
            profile.cv_analysis_result = {
                'error': str(e),
                'traceback': error_trace
            }
            profile.save()
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error analyzing CV: {e}")
            logger.error(error_trace)
            return Response(
                {'error': str(e), 'traceback': error_trace},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des candidatures"""
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'source', 'job_post']
    search_fields = ['candidate__username', 'job_post__title']
    
    def get_serializer_context(self):
        """Ajouter la requête au contexte du serializer pour construire les URLs absolues"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_candidate:
            # Les candidats voient seulement leurs candidatures
            queryset = queryset.filter(candidate=self.request.user)
        elif self.request.user.is_hr or self.request.user.is_manager:
            # HR et Managers voient toutes les candidatures
            pass
        
        # Filtrage par offre (via query parameter)
        job_post_id = self.request.query_params.get('job_post', None)
        if job_post_id:
            try:
                queryset = queryset.filter(job_post_id=int(job_post_id))
            except ValueError:
                pass
        
        # Tri par score ou date (via query parameter ordering)
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            if ordering == 'score_desc':
                queryset = queryset.order_by('-compatibility_score', '-applied_at')
            elif ordering == 'score_asc':
                queryset = queryset.order_by('compatibility_score', '-applied_at')
            elif ordering == 'date_desc':
                queryset = queryset.order_by('-applied_at')
            elif ordering == 'date_asc':
                queryset = queryset.order_by('applied_at')
        else:
            # Par défaut : plus récentes en premier
            queryset = queryset.order_by('-applied_at')
        
        return queryset.select_related('candidate', 'job_post', 'candidate__candidate_profile').prefetch_related('candidate__candidate_profile__extracted_skills')
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Mettre à jour le statut d'une candidature"""
        application = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Application.Status.choices):
            application.status = new_status
            application.save()
            return Response(ApplicationSerializer(application).data)
        return Response(
            {'error': 'Statut invalide'},
            status=status.HTTP_400_BAD_REQUEST
        )


class InternalTalentViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des talents internes"""
    queryset = InternalTalent.objects.all()
    serializer_class = InternalTalentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Seuls HR et Managers peuvent voir les talents internes
        if not (self.request.user.is_hr or self.request.user.is_manager):
            return InternalTalent.objects.none()
        return super().get_queryset().select_related('employee').prefetch_related('skills')
    
    @action(detail=False, methods=['get'])
    def match_for_job(self, request):
        """Trouver des talents internes correspondant à un poste"""
        job_post_id = request.query_params.get('job_post_id')
        if not job_post_id:
            return Response(
                {'error': 'job_post_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            job_post = JobPost.objects.get(id=job_post_id)
        except JobPost.DoesNotExist:
            return Response(
                {'error': 'Offre introuvable'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Logique de matching (simplifiée - à améliorer avec ML)
        required_skills = job_post.required_skills.all()
        talents = InternalTalent.objects.filter(
            is_available_for_promotion=True
        ).annotate(
            matching_skills_count=Count('skills', filter=Q(skills__in=required_skills))
        ).order_by('-matching_skills_count', '-performance_score')
        
        serializer = self.get_serializer(talents[:10], many=True)
        return Response(serializer.data)


class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la gestion des alertes"""
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['alert_type', 'priority', 'is_read']
    
    def get_queryset(self):
        # Chaque utilisateur voit seulement ses alertes
        queryset = super().get_queryset().filter(recipient=self.request.user)
        # Trier par date de création (plus récentes en premier)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """Marquer une alerte comme lue"""
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response(AlertSerializer(alert).data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Compter les alertes non lues"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['post'])
    def create_test_alerts(self, request):
        """Créer des alertes de test (pour le développement)"""
        from recruitment.models import JobPost, Application
        
        user = request.user
        job_post = JobPost.objects.first()
        if not job_post:
            return Response(
                {'error': 'Aucune offre d\'emploi trouvée. Créez d\'abord une offre.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application = Application.objects.first()
        alerts_created = []
        
        # Alerte 1: Score élevé
        if application:
            alert1 = Alert.objects.create(
                alert_type=Alert.AlertType.HIGH_SCORE,
                priority=Alert.Priority.HIGH,
                title=f"Score élevé: {application.candidate.username} pour {job_post.title}",
                message=f"Le candidat {application.candidate.first_name or ''} {application.candidate.last_name or ''} a obtenu un score de compatibilité élevé ({application.compatibility_score or 85}%) pour le poste {job_post.title}.",
                recipient=user,
                related_application=application,
                related_job_post=job_post,
                is_read=False
            )
            alerts_created.append(alert1.id)
        
        # Alerte 2: Nouvelle candidature
        if application:
            alert2 = Alert.objects.create(
                alert_type=Alert.AlertType.NEW_APPLICATION,
                priority=Alert.Priority.MEDIUM,
                title=f"Nouvelle candidature pour {job_post.title}",
                message=f"Une nouvelle candidature a été reçue pour le poste {job_post.title}.",
                recipient=user,
                related_application=application,
                related_job_post=job_post,
                is_read=False
            )
            alerts_created.append(alert2.id)
        
        # Alerte 3: Candidat correspondant
        alert3 = Alert.objects.create(
            alert_type=Alert.AlertType.CANDIDATE_MATCH,
            priority=Alert.Priority.MEDIUM,
            title="Candidat correspondant trouvé",
            message=f"Un candidat correspondant a été trouvé pour le poste {job_post.title}. Vérifiez son profil.",
            recipient=user,
            related_job_post=job_post,
            is_read=True
        )
        alerts_created.append(alert3.id)
        
        # Alerte 4: Matching interne
        alert4 = Alert.objects.create(
            alert_type=Alert.AlertType.INTERNAL_MATCH,
            priority=Alert.Priority.LOW,
            title="Matching interne disponible",
            message=f"Un employé interne pourrait correspondre au poste {job_post.title}. Considérez une promotion interne.",
            recipient=user,
            related_job_post=job_post,
            is_read=False
        )
        alerts_created.append(alert4.id)
        
        # Alerte 5: Urgente
        alert5 = Alert.objects.create(
            alert_type=Alert.AlertType.HIGH_SCORE,
            priority=Alert.Priority.URGENT,
            title="⚠️ Candidat exceptionnel détecté",
            message=f"Un candidat exceptionnel a été détecté pour le poste {job_post.title}. Action requise rapidement!",
            recipient=user,
            related_job_post=job_post,
            is_read=False
        )
        alerts_created.append(alert5.id)
        
        return Response({
            'message': f'{len(alerts_created)} alertes de test créées avec succès',
            'alerts_created': alerts_created
        }, status=status.HTTP_201_CREATED)


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet pour les statistiques du dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Récupérer les statistiques du dashboard"""
        user = request.user
        
        # Statistiques de base
        applications = Application.objects.all()
        if user.is_candidate:
            applications = applications.filter(candidate=user)
        
        total_applications = applications.count()
        pending_applications = applications.filter(status=Application.Status.PENDING).count()
        accepted_applications = applications.filter(status=Application.Status.ACCEPTED).count()
        rejected_applications = applications.filter(status=Application.Status.REJECTED).count()
        
        # Score moyen de compatibilité
        avg_score = applications.filter(
            compatibility_score__isnull=False
        ).aggregate(Avg('compatibility_score'))['compatibility_score__avg'] or 0
        
        # Temps moyen de recrutement
        accepted = applications.filter(
            status=Application.Status.ACCEPTED,
            applied_at__isnull=False
        )
        if accepted.exists():
            avg_time = accepted.annotate(
                time_diff=F('updated_at') - F('applied_at')
            ).aggregate(
                avg_time=Avg('time_diff')
            )['avg_time']
            avg_time_days = avg_time.total_seconds() / 86400 if avg_time else 0
        else:
            avg_time_days = 0
        
        # Applications par source
        apps_by_source = dict(
            applications.values('source').annotate(
                count=Count('id')
            ).values_list('source', 'count')
        )
        
        # Applications par statut
        apps_by_status = dict(
            applications.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        # Top compétences demandées
        top_skills = Skill.objects.annotate(
            job_count=Count('job_posts')
        ).order_by('-job_count')[:10]
        top_skills_list = [
            {'name': skill.name, 'count': skill.job_count}
            for skill in top_skills
        ]
        
        # Matching interne
        internal_matches = InternalTalent.objects.filter(
            is_available_for_promotion=True
        ).count()
        
        stats = {
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'accepted_applications': accepted_applications,
            'rejected_applications': rejected_applications,
            'average_compatibility_score': round(avg_score, 2) if avg_score else 0,
            'average_time_to_hire': round(avg_time_days, 1),
            'applications_by_source': apps_by_source,
            'applications_by_status': apps_by_status,
            'top_skills_demand': top_skills_list,
            'internal_matches_count': internal_matches,
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

