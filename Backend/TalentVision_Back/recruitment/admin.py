from django.contrib import admin
from .models import (
    Skill, JobPost, CandidateProfile, Application,
    InternalTalent, Alert
)


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category']
    list_filter = ['category']
    search_fields = ['name']


@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'created_by', 'created_at', 'closing_date']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'description']
    filter_horizontal = ['required_skills']


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_position', 'experience_years', 'cv_analysis_status']
    list_filter = ['cv_analysis_status', 'education_level']
    search_fields = ['user__username', 'user__email', 'current_position']
    filter_horizontal = ['extracted_skills']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'job_post', 'status', 'compatibility_score', 'applied_at']
    list_filter = ['status', 'source', 'applied_at']
    search_fields = ['candidate__username', 'job_post__title']
    readonly_fields = ['applied_at', 'updated_at']


@admin.register(InternalTalent)
class InternalTalentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'current_position', 'experience_years', 'is_available_for_promotion']
    list_filter = ['is_available_for_promotion']
    search_fields = ['employee__username', 'current_position']
    filter_horizontal = ['skills', 'potential_positions']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['title', 'alert_type', 'priority', 'recipient', 'is_read', 'created_at']
    list_filter = ['alert_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__username']
    readonly_fields = ['created_at']

