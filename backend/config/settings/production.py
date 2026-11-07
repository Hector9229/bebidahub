"""Configuración endurecida para producción.

Ejecutar la auditoría con:
    python manage.py check --deploy --settings=config.settings.production
"""
from .base import *  # noqa: F401,F403
from .base import env_bool, env_int

DEBUG = False

# ── Transporte y HSTS ──────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https")
    if env_bool("DJANGO_SECURE_PROXY_SSL_HEADER", True)
    else None
)
SECURE_HSTS_SECONDS = env_int("DJANGO_HSTS_SECONDS", 31_536_000)  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Cookies ────────────────────────────────────────────────────────
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

# ── Cabeceras defensivas ───────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
