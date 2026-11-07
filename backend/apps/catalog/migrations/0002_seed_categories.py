"""Categorías iniciales del catálogo (idempotente)."""
from django.db import migrations

CATEGORIES = [
    ("Cócteles", "cocteles", "🍸", "Mezclas con y sin alcohol para cualquier ocasión.", 1),
    ("Cervezas", "cervezas", "🍺", "Lager, IPA, stout y ediciones de la casa.", 2),
    ("Vinos", "vinos", "🍷", "Tintos, blancos, rosados y espumosos.", 3),
    ("Cafés", "cafes", "☕", "Espresso, latte, cold brew y métodos filtrados.", 4),
    ("Tés", "tes", "🍵", "Infusiones calientes y versiones heladas.", 5),
    ("Jugos", "jugos", "🧃", "Frutas y verduras recién exprimidas.", 6),
    ("Refrescos", "refrescos", "🥤", "Sodas artesanales y bebidas gasificadas.", 7),
    ("Aguas frescas", "aguas-frescas", "🍹", "Aguas de sabor, limonadas y mocktails.", 8),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for name, slug, icon, description, order in CATEGORIES:
        Category.objects.update_or_create(
            slug=slug,
            defaults={
                "name": name,
                "icon": icon,
                "description": description,
                "order": order,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [migrations.RunPython(seed_categories, migrations.RunPython.noop)]
