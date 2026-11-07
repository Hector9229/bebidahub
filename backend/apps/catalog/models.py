"""Modelos del catálogo: Category (1) ──< Beverage (N)."""
from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class Category(models.Model):
    """Categoría global de bebidas (cócteles, cafés, cervezas...)."""

    name = models.CharField(_("nombre"), max_length=60, unique=True)
    slug = models.SlugField(_("slug"), max_length=70, unique=True)
    description = models.CharField(_("descripción"), max_length=200, blank=True)
    icon = models.CharField(_("icono"), max_length=16, default="🍹")
    order = models.PositiveSmallIntegerField(_("orden"), default=0)

    class Meta:
        verbose_name = _("categoría")
        verbose_name_plural = _("categorías")
        ordering = ["order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:70]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.icon} {self.name}"


class Beverage(models.Model):
    """Bebida creada por un usuario y asociada a una categoría."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="beverages",
        verbose_name=_("propietario"),
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="beverages",
        verbose_name=_("categoría"),
    )
    name = models.CharField(_("nombre"), max_length=100, db_index=True)
    description = models.TextField(_("descripción"), max_length=1000, blank=True)
    price = models.DecimalField(
        _("precio"),
        max_digits=9,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("999999.99"))],
    )
    abv = models.DecimalField(
        _("graduación alcohólica (% ABV)"),
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    serving_ml = models.PositiveSmallIntegerField(
        _("porción (ml)"),
        default=250,
        validators=[MinValueValidator(30), MaxValueValidator(2000)],
    )
    rating = models.PositiveSmallIntegerField(
        _("calificación"),
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    is_alcoholic = models.BooleanField(_("contiene alcohol"), default=True)
    is_favorite = models.BooleanField(_("favorita"), default=False)
    image_url = models.URLField(_("imagen (URL)"), max_length=500, blank=True)
    created_at = models.DateTimeField(_("creada el"), auto_now_add=True)
    updated_at = models.DateTimeField(_("actualizada el"), auto_now=True)

    class Meta:
        verbose_name = _("bebida")
        verbose_name_plural = _("bebidas")
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="unique_beverage_name_per_owner"
            ),
            models.CheckConstraint(
                condition=Q(abv__gte=0) & Q(abv__lte=100), name="beverage_abv_range"
            ),
            models.CheckConstraint(
                condition=Q(serving_ml__gte=30) & Q(serving_ml__lte=2000),
                name="beverage_serving_range",
            ),
            models.CheckConstraint(
                condition=Q(rating__gte=1) & Q(rating__lte=5),
                name="beverage_rating_range",
            ),
            models.CheckConstraint(
                condition=Q(price__gte=0), name="beverage_price_non_negative"
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "-created_at"], name="beverage_owner_created_idx"),
            models.Index(fields=["category", "name"], name="beverage_category_name_idx"),
        ]

    def __str__(self):
        return f"{self.name} · {self.owner_id}"
