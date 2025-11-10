"""
Middleware personnalisé pour désactiver CSRF et gérer CORS sur les endpoints API
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse, JsonResponse


class DisableCSRFForAPI(MiddlewareMixin):
    """
    Désactive la vérification CSRF et gère CORS pour les endpoints API
    car on utilise JWT pour l'authentification
    """
    
    def process_request(self, request):
        # Désactiver CSRF pour toutes les routes API
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
            
            # Gérer les requêtes OPTIONS (preflight) AVANT tout autre traitement
            if request.method == 'OPTIONS':
                origin = request.META.get('HTTP_ORIGIN', '')
                # Accepter toutes les origines locales pour le développement
                allowed_origins = [
                    'http://localhost:5173',
                    'http://127.0.0.1:5173',
                ]
                
                # Accepter si l'origine est dans la liste ou si c'est une origine locale
                if origin in allowed_origins or 'localhost' in origin or '127.0.0.1' in origin:
                    response = HttpResponse()
                    response['Access-Control-Allow-Origin'] = origin if origin else 'http://localhost:5173'
                    response['Access-Control-Allow-Credentials'] = 'true'
                    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'
                    response['Access-Control-Max-Age'] = '86400'
                    response.status_code = 200
                    return response
    
    def process_response(self, request, response):
        # S'assurer que les en-têtes CORS sont présents pour toutes les requêtes API
        if request.path.startswith('/api/'):
            origin = request.META.get('HTTP_ORIGIN', '')
            allowed_origins = [
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ]
            
            # Si l'origine est autorisée ou si c'est une origine locale
            if origin in allowed_origins or 'localhost' in origin or '127.0.0.1' in origin:
                # Toujours ajouter les en-têtes CORS
                response['Access-Control-Allow-Origin'] = origin if origin else 'http://localhost:5173'
                response['Access-Control-Allow-Credentials'] = 'true'
        
        return response
