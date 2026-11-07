"""Vistas transversales del proyecto."""
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET


@require_GET
def health_check(request):
    """Endpoint público y liviano para monitoreo de disponibilidad."""
    return JsonResponse(
        {
            "status": "ok",
            "service": "bebidahub-api",
            "timestamp": timezone.now().isoformat(),
        }
    )
