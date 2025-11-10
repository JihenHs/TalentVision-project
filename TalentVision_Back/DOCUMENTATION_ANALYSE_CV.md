# 📄 Documentation Complète : Analyse Automatique de CV

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Flux d'exécution](#flux-dexécution)
4. [Détails techniques](#détails-techniques)
5. [Formats de données](#formats-de-données)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [Personnalisation](#personnalisation)

---

## 🎯 Vue d'ensemble

Le système d'analyse automatique de CV permet d'extraire automatiquement des informations structurées à partir de fichiers CV (PDF ou DOCX). Il utilise une combinaison de :

- **Extraction de texte** : `pdfplumber` pour PDF, `python-docx` pour DOCX
- **Expressions régulières (Regex)** : Pour détecter des patterns spécifiques
- **NLP (Natural Language Processing)** : spaCy pour l'analyse linguistique (optionnel)
- **Machine Learning** : scikit-learn pour la vectorisation TF-IDF (optionnel)
- **Deep Learning** : TensorFlow/Keras pour les modèles CNN (optionnel, non implémenté actuellement)

### Informations extraites

1. **Compétences techniques** : Langages, frameworks, outils, technologies
2. **Expérience professionnelle** : Années d'expérience, postes occupés
3. **Formation/Éducation** : Diplômes, formations, certifications
4. **Informations personnelles** : Email, téléphone, nom

---

## 🏗️ Architecture

### Fichiers principaux

```
Backend/TalentVision_Back/
├── ai_engine/
│   ├── cv_analyzer.py          # ⭐ Fichier principal d'analyse
│   └── tasks.py                # Tâches Celery (asynchrone)
├── recruitment/
│   ├── views.py                # Déclenchement de l'analyse
│   ├── models.py               # Modèles de données
│   └── serializers.py          # Sérialisation des résultats
└── DOCUMENTATION_ANALYSE_CV.md # Ce fichier
```

### Classe principale : `CVAnalyzer`

**Fichier** : `Backend/TalentVision_Back/ai_engine/cv_analyzer.py`

```python
class CVAnalyzer:
    """Analyseur de CV avec extraction de compétences"""
    
    def __init__(self):
        self.nlp = None          # Modèle spaCy (optionnel)
        self.cv_model = None     # Modèle CNN (optionnel)
        self._load_models()
```

---

## 🔄 Flux d'exécution

### 1. Déclenchement de l'analyse

#### Scénario A : Candidature à une offre

```
Utilisateur postule → views.py (JobPostViewSet.apply)
    ↓
Vérification du CV (obligatoire)
    ↓
Création/Mise à jour du CandidateProfile
    ↓
Appel de CVAnalyzer.analyze_cv()
    ↓
Sauvegarde des résultats dans CandidateProfile
```

**Fichier** : `Backend/TalentVision_Back/recruitment/views.py` (lignes 45-144)

#### Scénario B : Analyse manuelle

```
Utilisateur clique "Relancer l'analyse" → views.py (CandidateProfileViewSet.analyze_cv)
    ↓
Vérification de l'existence du CV
    ↓
Appel de CVAnalyzer.analyze_cv()
    ↓
Sauvegarde des résultats
```

**Fichier** : `Backend/TalentVision_Back/recruitment/views.py` (lignes 254-368)

### 2. Processus d'analyse

```
CVAnalyzer.analyze_cv(file_path)
    ↓
1. extract_text_from_file()     → Extraction du texte brut
    ↓
2. extract_skills_nlp()         → Extraction des compétences
    ↓
3. extract_experience()         → Extraction de l'expérience
    ↓
4. extract_education()          → Extraction de la formation
    ↓
5. extract_personal_info()      → Extraction des infos personnelles
    ↓
6. Retour du dictionnaire de résultats
```

---

## 🔧 Détails techniques

### 1. Extraction du texte (`extract_text_from_file`)

**Méthode** : `CVAnalyzer.extract_text_from_file(file_path: str) -> str`

#### Formats supportés

- **PDF** : Utilise `pdfplumber` pour extraire le texte page par page
- **DOCX** : Utilise `python-docx` pour extraire les paragraphes et tableaux
- **TXT** : Lecture directe du fichier texte

#### Nettoyage du texte

```python
# Normalisation des espaces
text = re.sub(r'[ \t]+', ' ', text)  # Espaces multiples → un seul espace

# Limitation des lignes vides
text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Max 2 lignes vides consécutives
```

#### Gestion d'erreurs

- Si le fichier est corrompu ou inaccessible → retourne une chaîne vide
- Traceback complet en cas d'erreur pour le débogage

---

### 2. Extraction des compétences (`extract_skills_nlp`)

**Méthode** : `CVAnalyzer.extract_skills_nlp(text: str) -> List[str]`

#### Méthode 1 : Liste de compétences connues

Le système recherche dans le texte une liste prédéfinie de **117 compétences techniques** :

**Catégories** :
- Langages de programmation : Python, Java, JavaScript, TypeScript, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, R, C
- Frameworks frontend : React, ReactJS, Vue, Angular, Svelte, Next.js, Nuxt.js, jQuery
- Frameworks backend : Django, Flask, FastAPI, Node.js, Express, Spring, Laravel, Symfony, Nest.js
- Bases de données : SQL, PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Oracle, SQLite, Cassandra, SQL Server
- DevOps & Cloud : Docker, Kubernetes, AWS, Azure, GCP, Terraform, Ansible, Jenkins, GitLab CI, GitHub
- Outils : Git, Linux, Bash, PowerShell, HTML, HTML5, CSS, CSS3, SASS, Webpack, Vite, Bootstrap
- Data Science & AI : Machine Learning, Deep Learning, TensorFlow, PyTorch, Keras, Scikit-learn, Pandas, NumPy, Matplotlib, Seaborn, Data Science, AI, NLP, NLTK, Computer Vision, BeautifulSoup, Big Data, Business Intelligence, ETL, ELK, Data Mining
- Méthodologies : Agile, Scrum, DevOps, CI/CD, TDD, Microservices, REST API, GraphQL, SOAP
- Autres : WordPress, Odoo, UML, Design Patterns, Figma, Swagger API, Gantt, Photoshop, Visual Basic

**Recherche avec variations** :
```python
skill_variations = [
    skill,                    # "react"
    skill.replace(' ', ''),   # "reactjs"
    skill.replace('-', ''),   # "reactjs"
    skill.replace(' ', '-'),  # "react-js"
]
```

#### Méthode 2 : Patterns regex multilingues

Le système recherche des sections de compétences avec des patterns regex :

**Patterns français** :
```regex
(?:compétences?|skills?|technologies?|maîtrises?|connaissances?)[\s:]+([^\.\n]{10,1000})
(?:maîtrise|connaissance|expérience)[\s:]+(?:de|en|avec)[\s:]+([^\.\n]{10,1000})
```

**Patterns anglais** :
```regex
(?:technical\s+)?skills?[:\s]+([^\.\n]{10,1000})
(?:programming\s+)?languages?[:\s]+([^\.\n]{10,1000})
(?:frameworks?|technologies?|proficiencies?|expertise)[:\s]+([^\.\n]{10,1000})
```

**Exemple de texte analysé** :
```
Technical Skills:
Python, Django, React, PostgreSQL, Docker, AWS
```

**Résultat** : `['Python', 'Django', 'React', 'PostgreSQL', 'Docker', 'AWS']`

#### Filtrage et normalisation

1. **Séparation** : Par virgules, points-virgules, deux-points, tirets, retours à la ligne
2. **Validation** :
   - Longueur : 2-50 caractères
   - Pas uniquement des chiffres
   - Exclusion des mots vides : "and", "et", "or", "ou", "with", "avec"
3. **Détection de mots-clés techniques** : Si contient "api", "sql", "js", "html", "css", "ml", "ai", "devops", "ci/cd"
4. **Limitation** : Maximum 50 compétences

---

### 3. Extraction de l'expérience (`extract_experience`)

**Méthode** : `CVAnalyzer.extract_experience(text: str) -> Dict`

#### Structure de retour

```python
{
    'years': int,        # Nombre d'années d'expérience
    'positions': List[str]  # Liste des postes occupés
}
```

#### Extraction des années d'expérience

**Patterns multilingues** :

```regex
# Format: "over 3 years" ou "plus de 3 ans"
(?:over|more\s+than|plus\s+de|plus\s+que)\s+(\d+)\s*(?:ans?|years?|années?)

# Format: "3 years of experience"
(\d+)\+?\s*(?:ans?|années?|years?)\s*(?:d\'?expérience|d\'?exp|of\s+experience|of\s+exp)

# Format: "with 3 years of experience"
(?:with|avec)\s+(\d+)\+?\s*(?:ans?|years?|années?)\s*(?:of\s+)?(?:experience|expérience)
```

**Exemples détectés** :
- "Software Engineer with over 3 years of experience" → `years: 3`
- "Plus de 5 ans d'expérience" → `years: 5`
- "3+ years of experience" → `years: 3`

#### Extraction des postes

**Méthode 1 : Patterns regex sur les titres**

```regex
# Titres courants
^(?:full\s+stack|front\s+end|back\s+end|software|data|web|mobile)\s+(?:engineer|developer|architect|analyst|scientist|specialist)

# Format français
^(?:développeur|ingénieur|analyste|consultant|architecte|spécialiste)\s+(?:full\s+stack|front\s+end|back\s+end|logiciel|web|mobile|données)
```

**Méthode 2 : Analyse ligne par ligne**

Le système parcourt chaque ligne du CV et détecte les lignes contenant des mots-clés de postes :
- "engineer", "developer", "analyst", "manager", "consultant"
- "développeur", "ingénieur"

**Exemple** :
```
Full Stack Engineer Intech Solutions, Tunisia
July 2022 – Present
```

**Résultat** : `positions: ['Full Stack Engineer']`

**Limitation** : Maximum 10 postes

---

### 4. Extraction de l'éducation (`extract_education`)

**Méthode** : `CVAnalyzer.extract_education(text: str) -> List[str]`

#### Patterns multilingues

```regex
# Format: "Master's Degree in Data Science"
(?:master\'?s?\s+degree|bachelor\'?s?\s+degree|ph\.?d\.?|doctorate)[\s]+(?:in|en)?\s*([^\n]{10,200})

# Format: "Master Data Science"
(?:master|bachelor|licence|baccalauréat|phd|doctorat)[\s]+(?:degree|diplôme)?\s*(?:in|en)?\s*([^\n]{10,200})

# Section "Education"
(?:education|formation|éducation)[:\s]*\n(?:.*?\n){0,5}([^\n]{10,200})
```

#### Nettoyage

1. **Suppression des dates** : `re.sub(r'\d{4}.*?$', '', text)`
2. **Extraction avant l'université** : Si le texte contient "university" ou "université", prendre seulement la partie avant

**Exemple** :
```
Master's Degree in Data Science University of Science of Bizerta, Tunisia
Dec 2021
```

**Résultat** : `['Master's Degree in Data Science']`

**Limitation** : Maximum 10 formations

---

### 5. Extraction des informations personnelles (`extract_personal_info`)

**Méthode** : `CVAnalyzer.extract_personal_info(text: str) -> Dict`

#### Structure de retour

```python
{
    'email': str | None,    # Email détecté
    'phone': str | None,       # Téléphone détecté
    'name': str | None       # Nom (non implémenté actuellement)
}
```

#### Extraction de l'email

**Pattern** :
```regex
\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b
```

**Exemple** : `jihen.hasnaoui1996@gmail.com` → `email: "jihen.hasnaoui1996@gmail.com"`

#### Extraction du téléphone

**Patterns** :
```regex
# Format US
(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}

# Format international
(\+?\d{1,3}[-.\s]?)?\d{2,3}[-.\s]?\d{2,3}[-.\s]?\d{2,3}[-.\s]?\d{2,3}

# Format français
0[1-9](?:[-.\s]?\d{2}){4}
```

**Exemple** : `+216 29 389 979` → `phone: "+216 29 389 979"`

---

### 6. Méthode principale (`analyze_cv`)

**Méthode** : `CVAnalyzer.analyze_cv(file_path: str, text: str = None) -> Dict`

#### Flux d'exécution

```python
def analyze_cv(self, file_path: str, text: str = None) -> Dict:
    # 1. Extraction du texte (si non fourni)
    if text is None:
        text = self.extract_text_from_file(file_path)
    
    # 2. Validation du texte
    if not text or len(text.strip()) < 10:
        return {'error': 'Texte trop court', ...}
    
    # 3. Extraction des compétences (avec gestion d'erreur)
    try:
        skills = self.extract_skills_nlp(text)
    except Exception as e:
        skills = []
    
    # 4. Extraction de l'expérience
    try:
        experience = self.extract_experience(text)
    except Exception as e:
        experience = {'years': 0, 'positions': []}
    
    # 5. Extraction de l'éducation
    try:
        education = self.extract_education(text)
    except Exception as e:
        education = []
    
    # 6. Extraction des infos personnelles
    try:
        personal_info = self.extract_personal_info(text)
    except Exception as e:
        personal_info = {'email': None, 'phone': None, 'name': None}
    
    # 7. Retour des résultats
    return {
        'skills': skills,
        'experience': experience,
        'education': education,
        'personal_info': personal_info,
        'text_length': len(text),
        'extracted_text_preview': text[:1000]  # Aperçu de 1000 caractères
    }
```

#### Gestion d'erreurs

Chaque étape d'extraction est encapsulée dans un `try-except` pour garantir que l'analyse continue même si une étape échoue.

---

## 📊 Formats de données

### Structure de retour de `analyze_cv`

```python
{
    'skills': List[str],                    # Liste des compétences détectées
    'experience': {
        'years': int,                       # Années d'expérience (0 si non détecté)
        'positions': List[str]              # Liste des postes (max 10)
    },
    'education': List[str],                 # Liste des formations (max 10)
    'personal_info': {
        'email': str | None,                # Email détecté
        'phone': str | None,                # Téléphone détecté
        'name': str | None                  # Nom (non implémenté)
    },
    'text_length': int,                     # Longueur du texte extrait
    'extracted_text_preview': str,          # Aperçu de 1000 caractères
    'error': str | None                     # Message d'erreur (si échec)
}
```

### Stockage dans la base de données

**Modèle** : `CandidateProfile` (`recruitment/models.py`)

```python
class CandidateProfile(models.Model):
    user = OneToOneField(User)
    cv_file = FileField(upload_to='cvs/')
    cover_letter = TextField()
    extracted_skills = ManyToManyField(Skill)      # Compétences extraites
    experience_years = IntegerField(default=0)      # Années d'expérience
    current_position = CharField(max_length=200)   # Poste actuel
    education_level = CharField(...)                # Niveau d'éducation
    cv_analysis_status = CharField(...)              # PENDING, PROCESSING, COMPLETED, FAILED
    cv_analysis_result = JSONField(default=dict)    # Résultats complets de l'analyse
```

**Exemple de `cv_analysis_result` stocké** :
```json
{
    "skills": ["Python", "Django", "React", "PostgreSQL"],
    "experience": {
        "years": 3,
        "positions": ["Full Stack Engineer", "Software Engineer"]
    },
    "education": ["Master's Degree in Data Science"],
    "personal_info": {
        "email": "jihen.hasnaoui1996@gmail.com",
        "phone": "+216 29 389 979",
        "name": null
    },
    "text_length": 5234,
    "extracted_text_preview": "Hasnaoui Jihen\nSoftware Engineer\n..."
}
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Analyse lors d'une candidature

```python
# Dans views.py (JobPostViewSet.apply)
from ai_engine.cv_analyzer import CVAnalyzer
from .models import Skill

# Créer l'analyseur
analyzer = CVAnalyzer()

# Analyser le CV
file_path = candidate_profile.cv_file.path
result = analyzer.analyze_cv(file_path)

# Sauvegarder les résultats
candidate_profile.cv_analysis_result = result
candidate_profile.cv_analysis_status = 'COMPLETED'

# Associer les compétences extraites
if 'skills' in result and result['skills']:
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
    if 'years' in result['experience']:
        candidate_profile.experience_years = result['experience']['years']
    if 'positions' in result['experience'] and result['experience']['positions']:
        candidate_profile.current_position = result['experience']['positions'][0]

candidate_profile.save()
```

### Exemple 2 : Analyse manuelle

```python
# Dans views.py (CandidateProfileViewSet.analyze_cv)
from ai_engine.cv_analyzer import CVAnalyzer

profile = CandidateProfile.objects.get(id=profile_id)
analyzer = CVAnalyzer()
result = analyzer.analyze_cv(profile.cv_file.path)

profile.cv_analysis_result = result
profile.cv_analysis_status = 'COMPLETED'
profile.save()
```

### Exemple 3 : Utilisation directe de la classe

```python
from ai_engine.cv_analyzer import CVAnalyzer

# Créer l'analyseur
analyzer = CVAnalyzer()

# Analyser un CV
result = analyzer.analyze_cv('/path/to/cv.pdf')

# Accéder aux résultats
print(f"Compétences: {result['skills']}")
print(f"Expérience: {result['experience']['years']} ans")
print(f"Postes: {result['experience']['positions']}")
print(f"Formation: {result['education']}")
print(f"Email: {result['personal_info']['email']}")
```

---

## 🎨 Personnalisation

### Ajouter de nouvelles compétences

**Fichier** : `Backend/TalentVision_Back/ai_engine/cv_analyzer.py`

**Méthode** : `extract_skills_nlp` (ligne 96)

```python
technical_skills = [
    # ... compétences existantes ...
    'nouvelle_compétence',  # Ajouter ici
]
```

### Modifier les patterns regex

**Pour l'expérience** : Modifier `extract_experience` (ligne 193)

```python
years_patterns = [
    # ... patterns existants ...
    r'votre_nouveau_pattern(\d+)',  # Ajouter ici
]
```

**Pour l'éducation** : Modifier `extract_education` (ligne 291)

```python
education_patterns = [
    # ... patterns existants ...
    r'votre_nouveau_pattern([^\n]{10,200})',  # Ajouter ici
]
```

### Améliorer l'extraction de texte

**Pour PDF** : Modifier `extract_text_from_file` (ligne 51)

```python
if file_ext == '.pdf':
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            # Ajouter votre logique personnalisée ici
            page_text = page.extract_text()
            # ...
```

### Ajouter le support de nouveaux formats

**Exemple : Support des fichiers RTF**

```python
def extract_text_from_file(self, file_path: str) -> str:
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == '.rtf':
        # Implémenter l'extraction RTF
        import striprtf
        with open(file_path, 'r', encoding='utf-8') as f:
            text = striprtf.striprtf(f.read())
        return text
    # ... autres formats ...
```

---

## 🔍 Dépannage

### Problème : Aucune compétence détectée

**Solutions** :
1. Vérifier que le texte est bien extrait : `result['text_length'] > 0`
2. Vérifier l'aperçu du texte : `result['extracted_text_preview']`
3. Ajouter la compétence manquante à la liste `technical_skills`
4. Vérifier les patterns regex dans `extract_skills_nlp`

### Problème : Expérience non détectée

**Solutions** :
1. Vérifier le format du texte (ex: "3 years" vs "3 ans")
2. Ajouter un nouveau pattern dans `years_patterns`
3. Vérifier que le texte contient bien les mots-clés d'expérience

### Problème : Erreur lors de l'extraction PDF

**Solutions** :
1. Vérifier que `pdfplumber` est installé : `pip install pdfplumber`
2. Vérifier que le PDF n'est pas corrompu
3. Vérifier les permissions d'accès au fichier

### Problème : Erreur lors de l'extraction DOCX

**Solutions** :
1. Vérifier que `python-docx` est installé : `pip install python-docx`
2. Vérifier que le fichier DOCX n'est pas corrompu
3. Vérifier les permissions d'accès au fichier

---

## 📚 Technologies utilisées

| Technologie | Version | Usage |
|------------|---------|-------|
| `pdfplumber` | 0.11.4 | Extraction de texte depuis PDF |
| `python-docx` | 1.1.2 | Extraction de texte depuis DOCX |
| `spacy` | 3.7.5 | NLP (optionnel, non utilisé actuellement) |
| `scikit-learn` | 1.5.2 | TF-IDF vectorization (optionnel) |
| `tensorflow` | 2.16.1 | Modèles CNN (optionnel, non implémenté) |
| `regex` | Built-in | Patterns de détection |

---

## 🚀 Améliorations futures

1. **Support multilingue amélioré** : Utiliser spaCy pour détecter automatiquement la langue
2. **Modèle CNN** : Entraîner un modèle de deep learning pour améliorer l'extraction
3. **Extraction de nom** : Implémenter la détection du nom du candidat
4. **Extraction d'adresse** : Détecter l'adresse postale
5. **Extraction de certifications** : Détecter les certifications professionnelles
6. **Extraction de projets** : Détecter les projets réalisés
7. **Score de qualité du CV** : Calculer un score basé sur la complétude du CV

---

## 📝 Notes importantes

- **Performance** : L'analyse est synchrone par défaut pour garantir l'exécution immédiate
- **Limitations** : Maximum 50 compétences, 10 postes, 10 formations
- **Gestion d'erreurs** : Chaque étape est isolée pour éviter les échecs complets
- **Multilingue** : Support partiel du français, anglais et arabe via regex
- **Extensibilité** : Facilement extensible pour ajouter de nouvelles fonctionnalités

---

**Dernière mise à jour** : Novembre 2025  
**Version** : 1.0  
**Auteur** : TalentVision Development Team

