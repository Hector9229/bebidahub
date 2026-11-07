"""Serializers del catálogo con validación estricta de entrada."""
import ipaddress
import re
from decimal import Decimal
from urllib.parse import urlparse

from rest_framework import serializers

from .models import Beverage, Category

SAFE_TEXT = re.compile(r"^[^<>\x00-\x1f\x7f]+$")
BLOCKED_HOSTS = {"localhost", "localhost.localdomain", "metadata.google.internal"}


class CategorySerializer(serializers.ModelSerializer):
    beverage_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "icon", "order", "beverage_count")

    def get_beverage_count(self, obj):
        annotated = getattr(obj, "beverage_count", None)
        if annotated is not None:
            return annotated
        return obj.beverages.count()


class BeverageSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_icon = serializers.CharField(source="category.icon", read_only=True)

    class Meta:
        model = Beverage
        fields = (
            "id",
            "name",
            "description",
            "category",
            "category_name",
            "category_icon",
            "price",
            "abv",
            "serving_ml",
            "rating",
            "is_alcoholic",
            "is_favorite",
            "image_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    # ── Nombre ─────────────────────────────────────────────────────
    def validate_name(self, value):
        value = " ".join(value.split())
        if len(value) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        if not SAFE_TEXT.match(value):
            raise serializers.ValidationError("El nombre contiene caracteres no permitidos.")
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            qs = Beverage.objects.filter(owner=request.user, name__iexact=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Ya tienes una bebida con ese nombre.")
        return value

    # ── Descripción ────────────────────────────────────────────────
    def validate_description(self, value):
        value = (value or "").strip()
        if len(value) > 1000:
            raise serializers.ValidationError("La descripción no puede superar 1000 caracteres.")
        if "<" in value or ">" in value:
            raise serializers.ValidationError("La descripción no admite etiquetas HTML.")
        return value

    # ── Precio ─────────────────────────────────────────────────────
    def validate_price(self, value):
        if value < Decimal("0.00"):
            raise serializers.ValidationError("El precio no puede ser negativo.")
        if value > Decimal("999999.99"):
            raise serializers.ValidationError("El precio excede el máximo permitido.")
        return value.quantize(Decimal("0.01"))

    # ── Graduación alcohólica ──────────────────────────────────────
    def validate_abv(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("El ABV debe estar entre 0 y 100.")
        return value.quantize(Decimal("0.01"))

    # ── Porción ────────────────────────────────────────────────────
    def validate_serving_ml(self, value):
        if value < 30 or value > 2000:
            raise serializers.ValidationError("La porción debe estar entre 30 y 2000 ml.")
        return value

    # ── Calificación ───────────────────────────────────────────────
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("La calificación debe estar entre 1 y 5.")
        return value

    # ── Imagen ─────────────────────────────────────────────────────
    def validate_image_url(self, value):
        if not value:
            return ""
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"}:
            raise serializers.ValidationError("La URL debe usar http o https.")
        host = (parsed.hostname or "").lower()
        if not host:
            raise serializers.ValidationError("La URL no contiene un dominio válido.")
        if host in BLOCKED_HOSTS or host.endswith(".local") or host.endswith(".internal"):
            raise serializers.ValidationError("No se permiten direcciones internas o locales.")
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            return value
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise serializers.ValidationError("No se permiten direcciones IP privadas o reservadas.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        abv = attrs.get("abv", getattr(self.instance, "abv", Decimal("0.00")))
        is_alcoholic = attrs.get(
            "is_alcoholic", getattr(self.instance, "is_alcoholic", True)
        )
        if abv == 0 and is_alcoholic:
            # Corrige una inconsistencia común sin romper la edición.
            attrs["is_alcoholic"] = False
        elif abv > 0 and not is_alcoholic:
            raise serializers.ValidationError(
                {"is_alcoholic": "Una bebida con ABV mayor a 0 debe marcarse como alcohólica."}
            )
        return attrs


class StatsSerializer(serializers.Serializer):
    """Documenta la forma de la respuesta de estadísticas."""

    total = serializers.IntegerField()
    favorites = serializers.IntegerField()
    categories = serializers.IntegerField()
    avg_abv = serializers.FloatField()
    avg_rating = serializers.FloatField()
    non_alcoholic = serializers.IntegerField()
