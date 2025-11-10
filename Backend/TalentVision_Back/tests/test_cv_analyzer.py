"""
Tests unitaires pour l'analyse de CV
"""
import pytest
import tempfile
import os

# Gérer les imports optionnels pour les tests
try:
    from ai_engine.cv_analyzer import CVAnalyzer, CompatibilityScorer
    CV_ANALYZER_AVAILABLE = True
    IMPORT_ERROR = None
except ImportError as e:
    CV_ANALYZER_AVAILABLE = False
    IMPORT_ERROR = str(e)


@pytest.mark.skipif(not CV_ANALYZER_AVAILABLE, reason=f"CV Analyzer not available: {IMPORT_ERROR or 'Missing dependencies'}")
class TestCVAnalyzer:
    """Tests pour CVAnalyzer"""
    
    def test_extract_skills_nlp(self):
        """Test extraction de compétences depuis un texte"""
        analyzer = CVAnalyzer()
        text = """
        Je suis développeur avec expérience en Python, Django, React, JavaScript.
        Compétences: PostgreSQL, Docker, Git.
        """
        skills = analyzer.extract_skills_nlp(text)
        
        assert len(skills) > 0
        assert any('python' in skill.lower() for skill in skills)
        assert any('django' in skill.lower() for skill in skills)
    
    def test_extract_experience(self):
        """Test extraction d'expérience"""
        analyzer = CVAnalyzer()
        text = """
        J'ai 5 ans d'expérience en développement web.
        Postes occupés: Développeur Full Stack, Lead Developer.
        """
        experience = analyzer.extract_experience(text)
        
        assert 'years' in experience
        assert experience['years'] > 0
        assert 'positions' in experience
        assert len(experience['positions']) > 0
    
    def test_extract_personal_info(self):
        """Test extraction d'informations personnelles"""
        analyzer = CVAnalyzer()
        text = """
        Contact: john.doe@example.com
        Téléphone: +216 12 345 678
        """
        personal_info = analyzer.extract_personal_info(text)
        
        assert 'email' in personal_info
        assert 'john.doe@example.com' in personal_info['email']
        assert 'phone' in personal_info
    
    def test_extract_education(self):
        """Test extraction d'éducation"""
        analyzer = CVAnalyzer()
        text = """
        Formation:
        - Master en Informatique, Université de Tunis, 2020
        - Licence en Informatique, 2018
        """
        education = analyzer.extract_education(text)
        
        assert len(education) > 0
        assert any('master' in edu.lower() or 'licence' in edu.lower() for edu in education)


@pytest.mark.skipif(not CV_ANALYZER_AVAILABLE, reason=f"CV Analyzer not available: {IMPORT_ERROR or 'Missing dependencies'}")
class TestCompatibilityScorer:
    """Tests pour CompatibilityScorer"""
    
    def test_calculate_score_high_match(self):
        """Test calcul de score avec correspondance élevée"""
        scorer = CompatibilityScorer()
        
        candidate_skills = ['Python', 'Django', 'React', 'PostgreSQL']
        job_requirements = ['Python', 'Django', 'React']
        candidate_experience = 5
        
        result = scorer.calculate_score(
            candidate_skills=candidate_skills,
            job_requirements=job_requirements,
            candidate_experience=candidate_experience,
            job_min_experience=3,
            candidate_education=[],
            job_description='Développeur Python Django React'
        )
        
        assert 'total_score' in result
        assert result['total_score'] >= 70  # Score élevé attendu
        assert 'breakdown' in result
        assert 'skills' in result['breakdown']
        assert 'experience' in result['breakdown']
        assert 'description' in result['breakdown']
    
    def test_calculate_score_low_match(self):
        """Test calcul de score avec correspondance faible"""
        scorer = CompatibilityScorer()
        
        candidate_skills = ['Java', 'Spring']
        job_requirements = ['Python', 'Django', 'React']
        candidate_experience = 1
        
        result = scorer.calculate_score(
            candidate_skills=candidate_skills,
            job_requirements=job_requirements,
            candidate_experience=candidate_experience,
            job_min_experience=3,
            candidate_education=[],
            job_description='Développeur Python Django React'
        )
        
        assert 'total_score' in result
        assert result['total_score'] < 50  # Score faible attendu
    
    def test_calculate_score_exact_match(self):
        """Test calcul de score avec correspondance exacte"""
        scorer = CompatibilityScorer()
        
        candidate_skills = ['Python', 'Django']
        job_requirements = ['Python', 'Django']
        
        result = scorer.calculate_score(
            candidate_skills=candidate_skills,
            job_requirements=job_requirements,
            candidate_experience=3,
            job_min_experience=2,
            candidate_education=[],
            job_description='Python Django'
        )
        
        assert result['total_score'] >= 80  # Score très élevé pour correspondance exacte
    
    def test_calculate_score_empty_skills(self):
        """Test calcul de score avec compétences vides"""
        scorer = CompatibilityScorer()
        
        result = scorer.calculate_score(
            candidate_skills=[],
            job_requirements=['Python', 'Django'],
            candidate_experience=0,
            job_min_experience=0,
            candidate_education=[],
            job_description=''
        )
        
        assert 'total_score' in result
        assert result['total_score'] >= 0  # Score minimal
    
    def test_calculate_score_simple(self):
        """Test méthode calculate_score_simple (wrapper)"""
        scorer = CompatibilityScorer()
        
        score = scorer.calculate_score_simple(
            candidate_skills=['Python', 'Django'],
            job_requirements=['Python', 'Django'],
            candidate_experience=3,
            job_min_experience=2
        )
        
        assert isinstance(score, float)
        assert 0 <= score <= 100

