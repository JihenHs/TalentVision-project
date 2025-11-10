from django.contrib import admin
from .models import MLModel


@admin.register(MLModel)
class MLModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'version', 'model_type', 'is_active', 'accuracy', 'created_at']
    list_filter = ['model_type', 'is_active']
    search_fields = ['name']

