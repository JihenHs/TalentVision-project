"""
Tâches Celery pour le traitement asynchrone
"""
from celery import shared_task
from django.core.files.storage import default_storage
from recruitment.models import CandidateProfile, Application, Skill, Alert
from accounts.models import User
from .cv_analyzer import CVAnalyzer, CompatibilityScorer
import os


@shared_task
def analyze_cv(profile_id: int):
    """Tâche asynchrone pour analyser un CV"""
    try:
        profile = CandidateProfile.objects.get(id=profile_id)
        profile.cv_analysis_status = 'PROCESSING'
        profile.save()
        
        if not profile.cv_file:
            profile.cv_analysis_status = 'FAILED'
            profile.cv_analysis_result = {'error': 'Aucun fichier CV'}
            profile.save()
            return
        
        # Obtenir le chemin du fichier
        file_path = profile.cv_file.path
        
        # Analyser le CV
        analyzer = CVAnalyzer()
        result = analyzer.analyze_cv(file_path)
        
        # Mettre à jour le profil
        profile.cv_analysis_result = result
        profile.cv_analysis_status = 'COMPLETED'
        
        # Extraire et associer les compétences
        if 'skills' in result:
            skills_to_add = []
            for skill_name in result['skills']:
                skill, created = Skill.objects.get_or_create(
                    name=skill_name,
                    defaults={'category': 'TECHNICAL'}
                )
                skills_to_add.append(skill)
            profile.extracted_skills.set(skills_to_add)
        
        # Mettre à jour l'expérience
        if 'experience' in result and 'years' in result['experience']:
            profile.experience_years = result['experience']['years']
        
        # Mettre à jour le poste actuel si détecté
        if 'experience' in result and 'positions' in result['experience'] and result['experience']['positions']:
            # Prendre le premier poste comme poste actuel
            profile.current_position = result['experience']['positions'][0]
        
        profile.save()
        
        # Créer une alerte pour les RH si le profil est intéressant
        if result.get('skills') and len(result['skills']) >= 5:
            hr_users = User.objects.filter(role=User.Role.HR)
            for hr in hr_users:
                Alert.objects.create(
                    alert_type=Alert.AlertType.CANDIDATE_MATCH,
                    priority=Alert.Priority.MEDIUM,
                    title=f"Nouveau profil candidat analysé: {profile.user.username}",
                    message=f"Le CV a été analysé avec succès. {len(result['skills'])} compétences détectées.",
                    recipient=hr,
                    related_job_post=None
                )
        
        return {'status': 'success', 'profile_id': profile_id}
    
    except CandidateProfile.DoesNotExist:
        return {'status': 'error', 'message': 'Profil introuvable'}
    except Exception as e:
        if 'profile' in locals():
            profile.cv_analysis_status = 'FAILED'
            profile.cv_analysis_result = {'error': str(e)}
            profile.save()
        return {'status': 'error', 'message': str(e)}


@shared_task
def calculate_compatibility_score(application_id: int):
    """Calculer le score de compatibilité pour une candidature"""
    try:
        application = Application.objects.select_related(
            'candidate', 'job_post'
        ).get(id=application_id)
        
        # Récupérer le profil candidat
        try:
            profile = application.candidate.candidate_profile
        except CandidateProfile.DoesNotExist:
            application.compatibility_score = 0.0
            application.save()
            return {'status': 'error', 'message': 'Profil candidat introuvable'}
        
        # Récupérer les compétences du candidat
        candidate_skills = list(profile.extracted_skills.values_list('name', flat=True))
        if not candidate_skills and profile.cv_analysis_result:
            candidate_skills = profile.cv_analysis_result.get('skills', [])
        
        # Récupérer les compétences requises pour le poste
        job_skills = list(application.job_post.required_skills.values_list('name', flat=True))
        
        # Calculer le score
        scorer = CompatibilityScorer()
        score_result = scorer.calculate_score(
            candidate_skills=candidate_skills,
            job_requirements=job_skills,
            candidate_experience=profile.experience_years or 0,
            job_min_experience=0,  # À améliorer avec un champ dans JobPost
            candidate_education=profile.cv_analysis_result.get('education', []) if profile.cv_analysis_result else [],
            job_description=application.job_post.description
        )
        
        application.compatibility_score = score_result['total_score']
        application.save()
        
        # Créer des alertes automatiques (même logique que dans views.py)
        # Récupérer tous les utilisateurs HR et Manager
        hr_managers = User.objects.filter(
            role__in=[User.Role.HR, User.Role.MANAGER, User.Role.ADMIN]
        )
        
        if hr_managers.exists():
            candidate_name = f"{application.candidate.first_name or ''} {application.candidate.last_name or ''}".strip()
            if not candidate_name:
                candidate_name = application.candidate.username
            
            score = score_result['total_score']
            
            # Alerte: Nouvelle candidature (si pas déjà créée)
            # On vérifie d'abord si une alerte existe déjà pour éviter les doublons
            existing_new_app_alert = Alert.objects.filter(
                alert_type=Alert.AlertType.NEW_APPLICATION,
                related_application=application
            ).first()
            
            if not existing_new_app_alert:
                for hr_manager in hr_managers:
                    Alert.objects.create(
                        alert_type=Alert.AlertType.NEW_APPLICATION,
                        priority=Alert.Priority.MEDIUM,
                        title=f"Nouvelle candidature: {candidate_name} pour {application.job_post.title}",
                        message=f"{candidate_name} a soumis une candidature pour le poste \"{application.job_post.title}\". Score de compatibilité: {round(score, 1)}%",
                        recipient=hr_manager,
                        related_application=application,
                        related_job_post=application.job_post,
                        is_read=False
                    )
            
            # Alerte: Score élevé (si score >= 80%)
            if score >= 80:
                # Vérifier si l'alerte existe déjà
                existing_high_score_alert = Alert.objects.filter(
                    alert_type=Alert.AlertType.HIGH_SCORE,
                    related_application=application
                ).first()
                
                if not existing_high_score_alert:
                    for hr_manager in hr_managers:
                        Alert.objects.create(
                            alert_type=Alert.AlertType.HIGH_SCORE,
                            priority=Alert.Priority.HIGH if score >= 90 else Alert.Priority.MEDIUM,
                            title=f"⭐ Score élevé: {candidate_name} pour {application.job_post.title}",
                            message=f"Le candidat {candidate_name} a obtenu un excellent score de compatibilité ({round(score, 1)}%) pour le poste \"{application.job_post.title}\". Candidat à examiner en priorité!",
                            recipient=hr_manager,
                            related_application=application,
                            related_job_post=application.job_post,
                            is_read=False
                        )
            
            # Alerte: Candidat correspondant (si score >= 70%)
            if score >= 70:
                # Vérifier si l'alerte existe déjà
                existing_match_alert = Alert.objects.filter(
                    alert_type=Alert.AlertType.CANDIDATE_MATCH,
                    related_application=application
                ).first()
                
                if not existing_match_alert:
                    for hr_manager in hr_managers:
                        Alert.objects.create(
                            alert_type=Alert.AlertType.CANDIDATE_MATCH,
                            priority=Alert.Priority.MEDIUM,
                            title=f"👤 Candidat correspondant: {candidate_name}",
                            message=f"Un candidat correspondant ({round(score, 1)}%) a été trouvé pour le poste \"{application.job_post.title}\". Vérifiez son profil.",
                            recipient=hr_manager,
                            related_application=application,
                            related_job_post=application.job_post,
                            is_read=False
                        )
        
        return {'status': 'success', 'application_id': application_id, 'score': score}
    
    except Application.DoesNotExist:
        return {'status': 'error', 'message': 'Candidature introuvable'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


@shared_task
def check_internal_matches():
    """Vérifier les correspondances internes pour les postes ouverts"""
    try:
        from recruitment.models import JobPost, InternalTalent
        open_jobs = JobPost.objects.filter(status=JobPost.Status.PUBLISHED)
        internal_talents = InternalTalent.objects.filter(
            is_available_for_promotion=True
        )
        
        matches_found = 0
        
        for job in open_jobs:
            required_skills = set(job.required_skills.values_list('name', flat=True))
            
            for talent in internal_talents:
                talent_skills = set(talent.skills.values_list('name', flat=True))
                
                # Calculer le matching
                matching_skills = required_skills & talent_skills
                if len(matching_skills) >= len(required_skills) * 0.6:  # Au moins 60% de correspondance
                    # Créer une alerte
                    hr_users = User.objects.filter(role=User.Role.HR)
                    for hr in hr_users:
                        Alert.objects.create(
                            alert_type=Alert.AlertType.INTERNAL_MATCH,
                            priority=Alert.Priority.MEDIUM,
                            title=f"Matching interne: {talent.employee.username} pour {job.title}",
                            message=f"{len(matching_skills)} compétences correspondantes",
                            recipient=hr,
                            related_job_post=job
                        )
                    matches_found += 1
        
        return {'status': 'success', 'matches_found': matches_found}
    
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

