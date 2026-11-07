"""Integración con TheCocktailDB (API pública de terceros).

La llamada se hace desde el backend para centralizar validación, caché,
timeouts y manejo de errores. El frontend nunca habla directo con el
proveedor externo.
"""
import logging
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("apps.catalog.external")


class CocktailAPIError(Exception):
    """Error controlado al consultar el proveedor externo."""


def _request(endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"{settings.COCKTAIL_API_BASE_URL}/{endpoint.lstrip('/')}"
    try:
        response = requests.get(
            url,
            params=params,
            timeout=settings.COCKTAIL_API_TIMEOUT,
            headers={
                "Accept": "application/json",
                "User-Agent": "BebidaHub/1.0 (proyecto academico)",
            },
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Fallo consultando TheCocktailDB: %s", exc)
        raise CocktailAPIError("No fue posible consultar el servicio de cócteles.") from exc
    if not isinstance(payload, dict):
        raise CocktailAPIError("El servicio de cócteles devolvió una respuesta inesperada.")
    return payload


def _clean(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def _normalize(drink: dict[str, Any]) -> dict[str, Any]:
    ingredients = []
    for index in range(1, 16):
        ingredient = _clean(drink.get(f"strIngredient{index}"))
        if not ingredient:
            continue
        ingredients.append(
            {
                "name": ingredient,
                "measure": _clean(drink.get(f"strMeasure{index}")),
            }
        )
    tags = [tag.strip() for tag in _clean(drink.get("strTags")).split(",") if tag.strip()]
    return {
        "id": _clean(drink.get("idDrink")),
        "name": _clean(drink.get("strDrink")) or "Cóctel sin nombre",
        "category": _clean(drink.get("strCategory")) or "Sin categoría",
        "alcoholic": _clean(drink.get("strAlcoholic")) or "No especificado",
        "glass": _clean(drink.get("strGlass")),
        "instructions": _clean(drink.get("strInstructions")),
        "image": _clean(drink.get("strDrinkThumb")),
        "tags": tags,
        "ingredients": ingredients,
    }


def search_cocktails(query: str) -> tuple[list[dict[str, Any]], bool]:
    """Busca cócteles por nombre. Devuelve (resultados, vino_de_cache)."""
    cache_key = f"cocktails:search:{query.strip().lower()}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached, True

    payload = _request("search.php", {"s": query})
    results = [_normalize(item) for item in (payload.get("drinks") or []) if isinstance(item, dict)]
    cache.set(cache_key, results, settings.COCKTAIL_API_CACHE_TTL)
    return results, False


def random_cocktail() -> dict[str, Any] | None:
    """Obtiene un cóctel aleatorio (sin caché para mantener variedad)."""
    payload = _request("random.php")
    drinks = payload.get("drinks") or []
    if not drinks or not isinstance(drinks[0], dict):
        return None
    return _normalize(drinks[0])
