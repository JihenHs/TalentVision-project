from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Skill(models.Model):
    """Compétences techniques et soft skills"""
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=50,
        choices=[
            ('TECHNICAL', 'Technique'),
            ('SOFT', 'Soft Skill'),
            ('LANGUAGE', 'Langue'),
            ('CERTIFICATION', 'Certification'),
        ],
        default='TECHNICAL'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class JobPost(models.Model):
    """Offre d'emploi"""
    
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        PUBLISHED = 'PUBLISHED', 'Publiée'
        CLOSED = 'CLOSED', 'Fermée'
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    requirements = models.TextField(help_text="Exigences du poste")
    location = models.CharField(max_length=200, blank=True)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    required_skills = models.ManyToManyField(Skill, related_name='job_posts')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_jobs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closing_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class CandidateProfile(models.Model):
    """Profil candidat avec CV et lettre de motivation"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )
    cv_file = models.FileField(upload_to='cvs/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    cover_letter_file = models.FileField(upload_to='cover_letters/', null=True, blank=True)
    extracted_skills = models.ManyToManyField(Skill, related_name='candidates', blank=True)
    experience_years = models.IntegerField(default=0)
    current_position = models.CharField(max_length=200, blank=True)
    education_level = models.CharField(
        max_length=50,
        choices=[
            ('BAC', 'Baccalauréat'),
            ('BAC+2', 'Bac+2'),
            ('BAC+3', 'Licence'),
            ('BAC+5', 'Master'),
            ('PHD', 'Doctorat'),
        ],
        blank=True
    )
    cv_analysis_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'En attente'),
            ('PROCESSING', 'En traitement'),
            ('COMPLETED', 'Terminé'),
            ('FAILED', 'Échoué'),
        ],
        default='PENDING'
    )
    cv_analysis_result = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profil de {self.user.username}"


class Application(models.Model):
    """Candidature pour un poste"""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'En attente'
        REVIEWED = 'REVIEWED', 'Examinée'
        SHORTLISTED = 'SHORTLISTED', 'Pré-sélectionnée'
        INTERVIEW = 'INTERVIEW', 'Entretien'
        ACCEPTED = 'ACCEPTED', 'Acceptée'
        REJECTED = 'REJECTED', 'Refusée'
    
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    job_post = models.ForeignKey(
        JobPost,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    compatibility_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Score de compatibilité (0-100)"
    )
    interview_notes = models.TextField(blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    source = models.CharField(
        max_length=50,
        choices=[
            ('WEBSITE', 'Site web'),
            ('LINKEDIN', 'LinkedIn'),
            ('REFERRAL', 'Recommandation'),
            ('OTHER', 'Autre'),
        ],
        default='WEBSITE'
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['candidate', 'job_post']
        ordering = ['-applied_at']
    
    def __str__(self):
        return f"{self.candidate.username} -> {self.job_post.title}"


class InternalTalent(models.Model):
    """Talents internes pour matching interne"""
    employee = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='internal_talent'
    )
    current_position = models.CharField(max_length=200)
    skills = models.ManyToManyField(Skill, related_name='internal_talents')
    experience_years = models.IntegerField(default=0)
    performance_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(10.0)]
    )
    potential_positions = models.ManyToManyField(
        JobPost,
        related_name='potential_candidates',
        blank=True
    )
    is_available_for_promotion = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Talent interne: {self.employee.username}"


class Alert(models.Model):
    """Alertes automatiques pour RH et managers"""
    
    class AlertType(models.TextChoices):
        CANDIDATE_MATCH = 'CANDIDATE_MATCH', 'Candidat correspondant'
        INTERNAL_MATCH = 'INTERNAL_MATCH', 'Matching interne'
        HIGH_SCORE = 'HIGH_SCORE', 'Score élevé'
        NEW_APPLICATION = 'NEW_APPLICATION', 'Nouvelle candidature'
        TURNOVER_RISK = 'TURNOVER_RISK', 'Risque de départ'
    
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Faible'
        MEDIUM = 'MEDIUM', 'Moyenne'
        HIGH = 'HIGH', 'Haute'
        URGENT = 'URGENT', 'Urgente'
    
    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alerts'
    )
    related_application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts'
    )
    related_job_post = models.ForeignKey(
        JobPost,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type}: {self.title}"

