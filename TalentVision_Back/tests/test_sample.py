"""
Exemple de test simple pour vérifier que pytest fonctionne
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


def test_example(db):
    """Test d'exemple simple"""
    assert 1 + 1 == 2


def test_user_creation(db):
    """Test création d'un utilisateur"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.check_password('testpass123')

