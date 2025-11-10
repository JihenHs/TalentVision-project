"""
Vue de test pour vérifier que CORS fonctionne
À supprimer après tests
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_http_methods(["GET", "OPTIONS", "POST"])
def test_cors(request):
    """Vue de test pour vérifier CORS"""
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    return JsonResponse({
        'message': 'CORS test successful',
        'method': request.method,
        'origin': request.META.get('HTTP_ORIGIN', 'Not set')
    })

