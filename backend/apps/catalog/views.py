"""Vistas del catálogo propio y del proxy a la API externa."""
import re

from django.db.models import Avg, Count, Q
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Beverage, Category
from .permissions import IsOwner
from .serializers import BeverageSerializer, CategorySerializer
from .services import CocktailAPIError, random_cocktail, search_cocktails

ORDERING_FIELDS = {
    "name": "name",
    "-name": "-name",
    "price": "price",
    "-price": "-price",
    "rating": "rating",
    "-rating": "-rating",
    "abv": "abv",
    "-abv": "-abv",
    "created_at": "created_at",
    "-created_at": "-created_at",
}


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/categories/ — catálogo global de categorías."""

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.annotate(beverage_count=Count("beverages")).order_by(
            "order", "name"
        )


class BeverageViewSet(viewsets.ModelViewSet):
    """CRUD de bebidas del usuario autenticado (aislado por dueño)."""

    serializer_class = BeverageSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = Beverage.objects.filter(owner=self.request.user).select_related("category")
        if self.action != "list":
            return queryset

        search = self.request.query_params.get("search", "").strip()
        if search:
            search = search[:80]
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        category = self.request.query_params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__slug=category)

        favorite = self.request.query_params.get("favorite", "").strip().lower()
        if favorite in {"true", "1", "si", "sí"}:
            queryset = queryset.filter(is_favorite=True)
        elif favorite in {"false", "0", "no"}:
            queryset = queryset.filter(is_favorite=False)

        ordering = self.request.query_params.get("ordering", "-created_at")
        return queryset.order_by(ORDERING_FIELDS.get(ordering, "-created_at"))

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        pagination_class=None,
        url_path="stats",
    )
    def stats(self, request):
        """GET /api/beverages/stats/ — métricas del bar del usuario."""
        queryset = Beverage.objects.filter(owner=request.user)
        metrics = queryset.aggregate(
            total=Count("id"),
            favorites=Count("id", filter=Q(is_favorite=True)),
            non_alcoholic=Count("id", filter=Q(is_alcoholic=False)),
            avg_abv=Avg("abv"),
            avg_rating=Avg("rating"),
        )
        return Response(
            {
                "total": metrics["total"] or 0,
                "favorites": metrics["favorites"] or 0,
                "categories": queryset.values("category_id").distinct().count(),
                "avg_abv": round(float(metrics["avg_abv"] or 0), 2),
                "avg_rating": round(float(metrics["avg_rating"] or 0), 2),
                "non_alcoholic": metrics["non_alcoholic"] or 0,
            }
        )


class CocktailQuerySerializer(serializers.Serializer):
    q = serializers.CharField(min_length=2, max_length=50)

    def validate_q(self, value):
        value = " ".join(value.split())
        if not re.match(r"^[^<>\x00-\x1f\x7f]+$", value):
            raise serializers.ValidationError("La búsqueda contiene caracteres no permitidos.")
        return value


class CocktailSearchView(APIView):
    """GET /api/external/cocktails/?q=margarita — proxy con caché."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "external"

    def get(self, request):
        serializer = CocktailQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["q"]
        try:
            results, cached = search_cocktails(query)
        except CocktailAPIError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )
        return Response(
            {
                "query": query,
                "count": len(results),
                "cached": cached,
                "source": "TheCocktailDB",
                "results": results,
            }
        )


class CocktailRandomView(APIView):
    """GET /api/external/cocktails/random/ — inspiración aleatoria."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "external"

    def get(self, request):
        try:
            result = random_cocktail()
        except CocktailAPIError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY
            )
        if result is None:
            return Response(
                {"detail": "No se encontró un cóctel aleatorio."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"source": "TheCocktailDB", "cached": False, "results": [result]}
        )
