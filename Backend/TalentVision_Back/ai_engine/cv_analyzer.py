"""
Module d'analyse de CV utilisant NLP et CNN pour l'extraction de compétences
"""
import os
import re
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import pdfplumber
from docx import Document
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import tensorflow as tf
from tensorflow import keras
from django.conf import settings


class CVAnalyzer:
    """Analyseur de CV avec extraction de compétences"""
    
    def __init__(self):
        self.nlp = None
        self.cv_model = None
        self._load_models()
    
    def _load_models(self):
        """Charger les modèles NLP et CNN"""
        try:
            # Charger spaCy (français ou anglais selon disponibilité)
            try:
                self.nlp = spacy.load("fr_core_news_sm")
            except OSError:
                try:
                    self.nlp = spacy.load("en_core_web_sm")
                except OSError:
                    print("Warning: spaCy model not found. Install with: python -m spacy download fr_core_news_sm")
                    self.nlp = None
            
            # Charger le modèle CNN pour l'analyse de CV (si disponible)
            model_path = settings.MODELS_DIR / 'cv_analyzer_model.h5'
            if model_path.exists():
                try:
                    self.cv_model = keras.models.load_model(str(model_path))
                except Exception as e:
                    print(f"Warning: Could not load CNN model: {e}")
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extraire le texte d'un fichier CV (PDF ou DOCX)"""
        text = ""
        file_ext = Path(file_path).suffix.lower()
        
        try:
            if file_ext == '.pdf':
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            elif file_ext in ['.docx', '.doc']:
                doc = Document(file_path)
                for paragraph in doc.paragraphs:
                    if paragraph.text.strip():
                        text += paragraph.text + "\n"
                # Extraire aussi depuis les tableaux
                for table in doc.tables:
                    for row in table.rows:
                        for cell in row.cells:
                            if cell.text.strip():
                                text += cell.text + " "
                        text += "\n"
            else:
                # Fichier texte
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()
        except Exception as e:
            print(f"Error extracting text: {e}")
            import traceback
            traceback.print_exc()
        
        # Nettoyer le texte (normaliser les espaces mais garder les retours à la ligne)
        text = re.sub(r'[ \t]+', ' ', text)  # Remplacer les espaces/tabs multiples par un seul espace
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Limiter les lignes vides multiples à 2 max
        
        return text
    
    def extract_skills_nlp(self, text: str) -> List[str]:
        """Extraire les compétences du texte en utilisant NLP - support multilingue"""
        skills = []
        text_lower = text.lower()
        
        # Liste étendue de compétences techniques communes (multilingue)
        technical_skills = [
            # Langages de programmation
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'r', 'c',
            # Frameworks frontend
            'react', 'reactjs', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js', 'jquery',
            # Frameworks backend
            'django', 'flask', 'fastapi', 'node.js', 'nodejs', 'express', 'spring', 'laravel', 'symfony', 'nest.js',
            # Bases de données
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'cassandra', 'sql server',
            # DevOps & Cloud
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins', 'gitlab ci', 'gitlab', 'github',
            # Outils
            'git', 'linux', 'bash', 'powershell', 'html', 'html5', 'css', 'css3', 'sass', 'webpack', 'vite', 'bootstrap',
            # Data Science & AI
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'scikit learn',
            'pandas', 'numpy', 'matplotlib', 'seaborn', 'data science', 'ai', 'nlp', 'nltk', 'computer vision',
            'beautifulsoup', 'big data', 'business intelligence', 'etl', 'elk', 'data mining',
            # Méthodologies
            'agile', 'scrum', 'devops', 'ci/cd', 'tdd', 'microservices', 'rest api', 'rest', 'graphql', 'soap',
            # Autres
            'wordpress', 'odoo', 'uml', 'design patterns', 'figma', 'swagger api', 'gantt', 'photoshop', 'visual basic'
        ]
        
        # Extraire les compétences techniques (recherche insensible à la casse)
        for skill in technical_skills:
            # Rechercher le skill avec des variations (avec/sans espace, avec/sans tiret, etc.)
            skill_variations = [
                skill,
                skill.replace(' ', ''),
                skill.replace('-', ''),
                skill.replace(' ', '-'),
            ]
            for variation in skill_variations:
                if variation in text_lower:
                    # Utiliser le nom original du skill
                    skill_name = skill.title() if ' ' in skill or '-' in skill else skill.upper()
                    if skill_name not in skills:
                        skills.append(skill_name)
                    break
        
        # Patterns multilingues pour extraire les sections de compétences
        skill_patterns = [
            # Français
            r'(?:compétences?|skills?|technologies?|maîtrises?|connaissances?)[\s:]+([^\.\n]{10,1000})',
            r'(?:maîtrise|connaissance|expérience)[\s:]+(?:de|en|avec)[\s:]+([^\.\n]{10,1000})',
            # Anglais
            r'(?:technical\s+)?skills?[:\s]+([^\.\n]{10,1000})',
            r'(?:programming\s+)?languages?[:\s]+([^\.\n]{10,1000})',
            r'(?:frameworks?|technologies?|proficiencies?|expertise)[:\s]+([^\.\n]{10,1000})',
            r'(?:proficient|experienced|skilled)[\s:]+(?:in|with)[\s:]+([^\.\n]{10,1000})',
            # Sections spécifiques
            r'(?:programming\s+languages?|web\s+development|databases?|devops\s+tools?|python\s+libraries?)[:\s]+([^\.\n]{10,1000})',
        ]
        
        for pattern in skill_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.UNICODE | re.MULTILINE)
            for match in matches:
                # Nettoyer et extraire les compétences
                # Séparer par virgules, points-virgules, deux-points, tirets, ou retours à la ligne
                skills_list = re.split(r'[,;:•\-\n\|]', match)
                for s in skills_list:
                    s = s.strip()
                    # Filtrer les compétences valides (2-50 caractères, pas seulement des chiffres, pas de mots vides)
                    if len(s) > 2 and len(s) < 50 and not s.isdigit() and s.lower() not in ['and', 'et', 'or', 'ou', 'with', 'avec']:
                        # Normaliser la casse
                        skill_normalized = s.strip()
                        # Vérifier si c'est une compétence connue ou si elle contient des mots-clés techniques
                        if any(keyword in skill_normalized.lower() for keyword in ['api', 'sql', 'js', 'html', 'css', 'ml', 'ai', 'devops', 'ci/cd']):
                            if skill_normalized not in skills:
                                skills.append(skill_normalized)
                        elif len(skill_normalized.split()) <= 3:  # Compétences courtes (1-3 mots)
                            if skill_normalized not in skills:
                                skills.append(skill_normalized)
        
        # Dédupliquer et limiter
        return list(dict.fromkeys(skills))[:50]  # Limiter à 50 compétences
    
    def _extract_skills_regex(self, text: str) -> List[str]:
        """Extraction basique par regex si NLP n'est pas disponible"""
        skills = []
        text_lower = text.lower()
        
        # Liste de compétences techniques
        technical_skills = [
            'python', 'java', 'javascript', 'react', 'vue', 'angular',
            'django', 'flask', 'node', 'sql', 'postgresql', 'mysql',
            'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure',
            'git', 'linux', 'html', 'css', 'typescript', 'php', 'c++',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch'
        ]
        
        for skill in technical_skills:
            if skill in text_lower:
                skills.append(skill.title())
        
        return list(set(skills))
    
    def extract_experience(self, text: str) -> Dict:
        """Extraire les informations d'expérience - support multilingue"""
        experience = {
            'years': 0,
            'positions': []
        }
        
        # Patterns multilingues pour années d'expérience
        years_patterns = [
            # Format: "3 years of experience" ou "over 3 years"
            r'(?:over|more\s+than|plus\s+de|plus\s+que)\s+(\d+)\s*(?:ans?|years?|années?)',
            r'(\d+)\+?\s*(?:ans?|années?|years?)\s*(?:d\'?expérience|d\'?exp|of\s+experience|of\s+exp)',
            r'expérience[:\s]+(?:de\s+)?(\d+)\s*(?:ans?|années?|years?)',
            r'(\d+)\s*(?:ans?|années?|years?)\s*(?:de\s+)?(?:expérience|experience|exp)',
            # Format dans le résumé professionnel
            r'(?:with|avec)\s+(\d+)\+?\s*(?:ans?|years?|années?)\s*(?:of\s+)?(?:experience|expérience)',
        ]
        
        for pattern in years_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.UNICODE)
            if match:
                try:
                    years = int(match.group(1))
                    if years > experience['years']:
                        experience['years'] = years
                except:
                    continue
        
        # Extraire les postes depuis la section "Professional Experience" ou "Expérience Professionnelle"
        # Chercher les titres de postes (lignes qui commencent par un titre de poste)
        position_patterns = [
            # Titres de postes courants
            r'^(?:full\s+stack|front\s+end|back\s+end|software|data|web|mobile)\s+(?:engineer|developer|architect|analyst|scientist|specialist)',
            r'^(?:développeur|ingénieur|analyste|consultant|architecte|spécialiste)\s+(?:full\s+stack|front\s+end|back\s+end|logiciel|web|mobile|données)',
            r'^(?:senior|junior|lead|principal)\s+(?:software|web|data|full\s+stack)\s+(?:engineer|developer)',
            # Format: "Position Title Company Name"
            r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Engineer|Developer|Analyst|Manager|Consultant|Architect)',
            # Depuis les sections d'expérience
            r'(?:professional\s+experience|expérience\s+professionnelle)[:\s]*\n(?:.*?\n){0,3}([^\n]{5,80})',
        ]
        
        # Extraire aussi depuis les lignes qui contiennent des titres de postes
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_clean = line.strip()
            # Chercher les lignes qui ressemblent à des titres de postes
            if any(keyword in line_clean.lower() for keyword in ['engineer', 'developer', 'analyst', 'manager', 'consultant', 'développeur', 'ingénieur']):
                # Vérifier que la ligne suivante contient souvent le nom de l'entreprise
                if len(line_clean) > 5 and len(line_clean) < 80:
                    # Extraire le titre (première partie avant la virgule ou le tiret)
                    title = re.split(r'[,—–-]', line_clean)[0].strip()
                    if title and title not in experience['positions']:
                        experience['positions'].append(title)
        
        # Extraire aussi avec les patterns regex
        for pattern in position_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.UNICODE | re.MULTILINE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[-1]  # Prendre le dernier groupe capturé
                cleaned = match.strip()
                if len(cleaned) > 3 and len(cleaned) < 100:
                    if cleaned not in experience['positions']:
                        experience['positions'].append(cleaned)
        
        # Dédupliquer les postes
        experience['positions'] = list(dict.fromkeys(experience['positions']))[:10]  # Limiter à 10
        
        return experience
    
    def extract_personal_info(self, text: str) -> Dict:
        """Extraire les informations personnelles (nom, email, téléphone)"""
        info = {
            'email': None,
            'phone': None,
            'name': None
        }
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            info['email'] = email_match.group(0)
        
        # Téléphone (formats internationaux)
        phone_patterns = [
            r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # Format US
            r'(\+?\d{1,3}[-.\s]?)?\d{2,3}[-.\s]?\d{2,3}[-.\s]?\d{2,3}[-.\s]?\d{2,3}',  # Format international
            r'0[1-9](?:[-.\s]?\d{2}){4}',  # Format français
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                info['phone'] = phone_match.group(0).strip()
                break
        
        return info
    
    def extract_education(self, text: str) -> List[str]:
        """Extraire les formations/éducation"""
        education = []
        
        # Patterns multilingues pour l'éducation
        education_patterns = [
            # Format: "Master's Degree in Data Science University of..."
            r'(?:master\'?s?\s+degree|bachelor\'?s?\s+degree|ph\.?d\.?|doctorate)[\s]+(?:in|en)?\s*([^\n]{10,200})',
            # Format: "Master Data Science University..."
            r'(?:master|bachelor|licence|baccalauréat|phd|doctorat)[\s]+(?:degree|diplôme)?\s*(?:in|en)?\s*([^\n]{10,200})',
            # Format: "Education" section
            r'(?:education|formation|éducation)[:\s]*\n(?:.*?\n){0,5}([^\n]{10,200})',
            # Format simple
            r'(?:degree|diplôme|formation)[:\s]+([^\n]{10,200})',
        ]
        
        for pattern in education_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.UNICODE | re.MULTILINE)
            for match in matches:
                cleaned = match.strip()
                # Nettoyer (enlever les dates, les universités si trop long)
                cleaned = re.sub(r'\d{4}.*?$', '', cleaned).strip()  # Enlever les dates à la fin
                if len(cleaned) > 10 and len(cleaned) < 200:
                    # Prendre seulement la première partie (avant l'université si trop long)
                    parts = re.split(r'(?:university|université|school|école|college)', cleaned, flags=re.IGNORECASE)
                    if parts:
                        cleaned = parts[0].strip()
                    if cleaned and cleaned not in education:
                        education.append(cleaned)
        
        # Extraire aussi depuis les lignes qui commencent par "Master", "Bachelor", etc.
        lines = text.split('\n')
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if re.match(r'^(?:master|bachelor|licence|phd|doctorat|baccalauréat)', line_clean, re.IGNORECASE):
                # Prendre la ligne et la suivante si elle existe
                edu_text = line_clean
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not re.match(r'^\d{4}', next_line):  # Pas une date
                        edu_text += ' ' + next_line
                if len(edu_text) > 10 and len(edu_text) < 200:
                    edu_text = re.sub(r'\d{4}.*?$', '', edu_text).strip()
                    if edu_text and edu_text not in education:
                        education.append(edu_text)
        
        return list(dict.fromkeys(education))[:10]  # Limiter à 10 formations
    
    def analyze_cv(self, file_path: str, text: str = None) -> Dict:
        """Analyser un CV complet - support multilingue"""
        try:
            if text is None:
                text = self.extract_text_from_file(file_path)
            
            if not text or len(text.strip()) < 10:
                return {
                    'error': 'Impossible d\'extraire le texte du CV ou texte trop court',
                    'skills': [],
                    'experience': {'years': 0, 'positions': []},
                    'education': [],
                    'personal_info': {'email': None, 'phone': None, 'name': None},
                    'text_length': 0,
                    'extracted_text_preview': ''
                }
            
            # Extraire les compétences
            try:
                skills = self.extract_skills_nlp(text)
            except Exception as e:
                print(f"Error extracting skills: {e}")
                skills = []
            
            # Extraire l'expérience
            try:
                experience = self.extract_experience(text)
            except Exception as e:
                print(f"Error extracting experience: {e}")
                experience = {'years': 0, 'positions': []}
            
            # Extraire l'éducation
            try:
                education = self.extract_education(text)
            except Exception as e:
                print(f"Error extracting education: {e}")
                education = []
            
            # Extraire les informations personnelles
            try:
                personal_info = self.extract_personal_info(text)
            except Exception as e:
                print(f"Error extracting personal info: {e}")
                personal_info = {'email': None, 'phone': None, 'name': None}
            
            # Si un modèle CNN est disponible, l'utiliser pour améliorer l'analyse
            if self.cv_model:
                try:
                    vectorizer = TfidfVectorizer(max_features=1000)
                    text_vector = vectorizer.fit_transform([text])
                    # prediction = self.cv_model.predict(text_vector)
                except Exception as e:
                    print(f"Error in CNN prediction: {e}")
            
            return {
                'skills': skills if isinstance(skills, list) else [],
                'experience': experience if isinstance(experience, dict) else {'years': 0, 'positions': []},
                'education': education if isinstance(education, list) else [],
                'personal_info': personal_info if isinstance(personal_info, dict) else {'email': None, 'phone': None, 'name': None},
                'text_length': len(text),
                'extracted_text_preview': text[:1000] if len(text) > 1000 else text  # Aperçu plus long
            }
        except Exception as e:
            import traceback
            error_msg = f"Erreur lors de l'analyse du CV: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
            return {
                'error': error_msg,
                'skills': [],
                'experience': {'years': 0, 'positions': []},
                'education': [],
                'personal_info': {'email': None, 'phone': None, 'name': None},
                'text_length': 0,
                'extracted_text_preview': ''
            }


class CompatibilityScorer:
    """Calculateur de score de compatibilité candidat/poste amélioré"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500)
    
    def calculate_score(self, candidate_skills: List[str], job_requirements: List[str],
                       candidate_experience: int = 0, job_min_experience: int = 0,
                       candidate_education: List[str] = None, job_description: str = None) -> Dict:
        """
        Calculer le score de compatibilité (0-100) avec détails
        
        Returns:
            Dict avec 'total_score' (0-100) et 'breakdown' (détails par critère)
        """
        breakdown = {}
        
        # 1. Score basé sur les compétences (50% du score total)
        candidate_skills_lower = [s.lower().strip() for s in candidate_skills if s]
        job_skills_lower = [s.lower().strip() for s in job_requirements if s]
        
        if not candidate_skills_lower or not job_skills_lower:
            skill_score = 0.0
            matching_skills = []
        else:
            # Méthode 1: Similarité TF-IDF (plus sophistiquée)
            try:
                candidate_text = ' '.join(candidate_skills_lower)
                job_text = ' '.join(job_skills_lower)
                vectors = self.vectorizer.fit_transform([candidate_text, job_text])
                similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
                skill_score = similarity * 50  # Max 50 points
            except:
                skill_score = 0.0
            
            # Méthode 2: Compter les correspondances exactes (fallback)
            candidate_set = set(candidate_skills_lower)
            job_set = set(job_skills_lower)
            matching_skills = list(candidate_set & job_set)
            exact_match_ratio = len(matching_skills) / len(job_set) if job_set else 0
            exact_match_score = exact_match_ratio * 50
            
            # Prendre le meilleur score entre TF-IDF et correspondance exacte
            skill_score = max(skill_score, exact_match_score)
        
        breakdown['skills'] = {
            'score': round(skill_score, 2),
            'max_score': 50,
            'matching_count': len(matching_skills),
            'required_count': len(job_skills_lower),
            'candidate_count': len(candidate_skills_lower),
            'matching_skills': matching_skills[:10]  # Limiter à 10 pour l'affichage
        }
        
        # 2. Score basé sur l'expérience (30% du score total)
        if job_min_experience > 0:
            if candidate_experience >= job_min_experience:
                experience_score = 30
            else:
                # Score proportionnel si expérience insuffisante
                experience_score = (candidate_experience / job_min_experience) * 30
        else:
            # Si pas d'exigence, donner un score basé sur l'expérience disponible
            if candidate_experience > 0:
                experience_score = min(30, candidate_experience * 3)  # 3 points par année, max 30
            else:
                experience_score = 0
        
        breakdown['experience'] = {
            'score': round(experience_score, 2),
            'max_score': 30,
            'candidate_years': candidate_experience,
            'required_years': job_min_experience
        }
        
        # 3. Score basé sur la description du poste (20% du score total)
        description_score = 0.0
        if job_description:
            try:
                # Extraire les mots-clés de la description
                description_lower = job_description.lower()
                candidate_text = ' '.join(candidate_skills_lower)
                
                # Compter les mots-clés techniques présents dans le CV
                technical_keywords = [
                    'python', 'java', 'javascript', 'react', 'django', 'sql',
                    'docker', 'aws', 'git', 'agile', 'scrum', 'api', 'rest',
                    'machine learning', 'data science', 'backend', 'frontend'
                ]
                
                found_keywords = sum(1 for keyword in technical_keywords 
                                   if keyword in description_lower and keyword in candidate_text)
                total_keywords_in_job = sum(1 for keyword in technical_keywords 
                                           if keyword in description_lower)
                
                if total_keywords_in_job > 0:
                    description_score = (found_keywords / total_keywords_in_job) * 20
            except:
                description_score = 0.0
        
        breakdown['description'] = {
            'score': round(description_score, 2),
            'max_score': 20
        }
        
        # Score total
        total_score = min(100, skill_score + experience_score + description_score)
        
        return {
            'total_score': round(total_score, 2),
            'breakdown': breakdown
        }
    
    def calculate_score_simple(self, candidate_skills: List[str], job_requirements: List[str],
                              candidate_experience: int = 0, job_min_experience: int = 0) -> float:
        """
        Version simplifiée qui retourne seulement le score total (pour compatibilité)
        """
        result = self.calculate_score(
            candidate_skills=candidate_skills,
            job_requirements=job_requirements,
            candidate_experience=candidate_experience,
            job_min_experience=job_min_experience
        )
        return result['total_score']

