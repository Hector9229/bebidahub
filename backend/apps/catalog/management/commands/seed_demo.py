"""Crea categorías, un usuario demo y bebidas de ejemplo.

Uso:
    python manage.py seed_demo
    python manage.py seed_demo --reset   # recrea las bebidas demo
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.catalog.models import Beverage, Category

CATEGORIES = [
    ("Cócteles", "🍸", "Mezclas con y sin alcohol para cualquier ocasión.", 1),
    ("Cervezas", "🍺", "Lager, IPA, stout y ediciones de la casa.", 2),
    ("Vinos", "🍷", "Tintos, blancos, rosados y espumosos.", 3),
    ("Cafés", "☕", "Espresso, latte, cold brew y métodos filtrados.", 4),
    ("Tés", "🍵", "Infusiones calientes y versiones heladas.", 5),
    ("Jugos", "🧃", "Frutas y verduras recién exprimidas.", 6),
    ("Refrescos", "🥤", "Sodas artesanales y bebidas gasificadas.", 7),
    ("Aguas frescas", "🍹", "Aguas de sabor, limonadas y mocktails.", 8),
]

DEMO_EMAIL = "demo@bebidahub.com"
DEMO_PASSWORD = "MangoPicante#42"

BEVERAGES = [
    {
        "name": "Margarita clásica",
        "category": "Cócteles",
        "description": "Tequila blanco, triple sec y limón fresco con escarcha de sal.",
        "price": "145.00",
        "abv": "26.00",
        "serving_ml": 200,
        "rating": 5,
        "is_alcoholic": True,
        "is_favorite": True,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg",
    },
    {
        "name": "Mojito de la casa",
        "category": "Cócteles",
        "description": "Ron blanco, hierbabuena, lima y un toque de azúcar mascabado.",
        "price": "135.00",
        "abv": "14.00",
        "serving_ml": 300,
        "rating": 5,
        "is_alcoholic": True,
        "is_favorite": True,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg",
    },
    {
        "name": "Negroni",
        "category": "Cócteles",
        "description": "Gin, Campari y vermut rojo. Amargo, elegante y directo.",
        "price": "160.00",
        "abv": "24.00",
        "serving_ml": 180,
        "rating": 4,
        "is_alcoholic": True,
        "is_favorite": False,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg",
    },
    {
        "name": "Piña colada",
        "category": "Cócteles",
        "description": "Ron, crema de coco y piña natural. Vacaciones en un vaso.",
        "price": "140.00",
        "abv": "12.00",
        "serving_ml": 350,
        "rating": 4,
        "is_alcoholic": True,
        "is_favorite": False,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/upusyu1472667977.jpg",
    },
    {
        "name": "Cosmopolitan",
        "category": "Cócteles",
        "description": "Vodka, arándano, lima y naranja. Color y carácter.",
        "price": "150.00",
        "abv": "22.00",
        "serving_ml": 180,
        "rating": 4,
        "is_alcoholic": True,
        "is_favorite": False,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg",
    },
    {
        "name": "Espresso martini",
        "category": "Cócteles",
        "description": "Vodka, licor de café y espresso recién extraído.",
        "price": "155.00",
        "abv": "18.00",
        "serving_ml": 160,
        "rating": 5,
        "is_alcoholic": True,
        "is_favorite": True,
        "image_url": "https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg",
    },
    {
        "name": "Cold brew de la casa",
        "category": "Cafés",
        "description": "Extracción en frío de 18 horas, suave y con notas de cacao.",
        "price": "70.00",
        "abv": "0.00",
        "serving_ml": 350,
        "rating": 4,
        "is_alcoholic": False,
        "is_favorite": True,
        "image_url": "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=900&q=80",
    },
    {
        "name": "Matcha latte",
        "category": "Tés",
        "description": "Matcha ceremonial batido con leche de avena y un toque de miel.",
        "price": "85.00",
        "abv": "0.00",
        "serving_ml": 300,
        "rating": 5,
        "is_alcoholic": False,
        "is_favorite": False,
        "image_url": "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=900&q=80",
    },
    {
        "name": "Jugo de naranja",
        "category": "Jugos",
        "description": "Naranjas de temporada exprimidas al momento, sin azúcar añadida.",
        "price": "45.00",
        "abv": "0.00",
        "serving_ml": 400,
        "rating": 4,
        "is_alcoholic": False,
        "is_favorite": False,
        "image_url": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=900&q=80",
    },
    {
        "name": "IPA artesanal",
        "category": "Cervezas",
        "description": "Cerveza local con lúpulo Citra. Cítrica, fresca y con final seco.",
        "price": "95.00",
        "abv": "6.50",
        "serving_ml": 355,
        "rating": 4,
        "is_alcoholic": True,
        "is_favorite": False,
        "image_url": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=900&q=80",
    },
    {
        "name": "Vino tinto de la casa",
        "category": "Vinos",
        "description": "Mezcla de tempranillo y garnacha, notas de frutos rojos y vainilla.",
        "price": "180.00",
        "abv": "13.50",
        "serving_ml": 150,
        "rating": 4,
        "is_alcoholic": True,
        "is_favorite": False,
        "image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80",
    },
    {
        "name": "Limonada de lavanda",
        "category": "Aguas frescas",
        "description": "Limonada natural infusionada con lavanda y romero fresco.",
        "price": "55.00",
        "abv": "0.00",
        "serving_ml": 350,
        "rating": 5,
        "is_alcoholic": False,
        "is_favorite": True,
        "image_url": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=900&q=80",
    },
]


class Command(BaseCommand):
    help = "Carga categorías, usuario demo y bebidas de ejemplo (idempotente)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Elimina y recrea las bebidas del usuario demo.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        categories = {}
        for name, icon, description, order in CATEGORIES:
            category, _ = Category.objects.update_or_create(
                name=name,
                defaults={"icon": icon, "description": description, "order": order},
            )
            categories[name] = category

        user, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={"first_name": "Demo", "last_name": "BebidaHub"},
        )
        if created or options["reset"]:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])

        if options["reset"]:
            user.beverages.all().delete()

        created_count = 0
        if not user.beverages.exists():
            for item in BEVERAGES:
                data = dict(item)
                category_name = data.pop("category")
                name = data.pop("name")
                _, was_created = Beverage.objects.get_or_create(
                    owner=user,
                    name=name,
                    defaults={
                        **data,
                        "category": categories[category_name],
                        "price": Decimal(data["price"]),
                        "abv": Decimal(data["abv"]),
                    },
                )
                created_count += int(was_created)

        self.stdout.write(self.style.SUCCESS("Datos demo listos."))
        self.stdout.write(f"  Usuario: {DEMO_EMAIL}")
        self.stdout.write(f"  Contraseña: {DEMO_PASSWORD}")
        self.stdout.write(f"  Bebidas nuevas: {created_count}")
        self.stdout.write(f"  Total de bebidas demo: {user.beverages.count()}")
