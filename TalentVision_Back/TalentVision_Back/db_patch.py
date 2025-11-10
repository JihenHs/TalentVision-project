"""
Patch pour contourner la vérification de version PostgreSQL dans Django 5.2
Permet d'utiliser PostgreSQL 12+ au lieu de PostgreSQL 14+ requis
"""
# Ce patch doit être importé AVANT que Django n'initialise les connexions à la base de données
# Il modifie la version minimale requise de PostgreSQL

# Importer les modules Django nécessaires
import django.db.backends.postgresql.features as pg_features

# Modifier la version minimale requise de PostgreSQL 14 à 12
# Cela permet d'utiliser PostgreSQL 12.4 avec Django 5.2
pg_features.DatabaseFeatures.minimum_database_version = (12,)

