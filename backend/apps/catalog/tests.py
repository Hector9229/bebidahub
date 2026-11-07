"""Pruebas del CRUD de bebidas, permisos, validaciones y API externa."""
from unittest.mock import Mock, patch

import requests
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import ProtectedError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalog.models import Beverage, Category

User = get_user_model()
PASSWORD = "ClaveSegura#2026"


def make_payload(category, **overrides):
    payload = {
        "name": "Agua de horchata",
        "description": "Arroz, canela y un toque de vainilla.",
        "category": category.id,
        "price": "80.00",
        "abv": "0.00",
        "serving_ml": 300,
        "rating": 5,
        "is_alcoholic": False,
        "is_favorite": False,
        "image_url": "",
    }
    payload.update(overrides)
    return payload


class CatalogAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="lucia@example.com", password=PASSWORD, first_name="Lucía"
        )
        self.other = User.objects.create_user(
            email="marco@example.com", password=PASSWORD, first_name="Marco"
        )
        self.cocktails = Category.objects.get(slug="cocteles")
        self.coffees = Category.objects.get(slug="cafes")
        self.beers = Category.objects.get(slug="cervezas")
        self.own = Beverage.objects.create(
            owner=self.user,
            category=self.cocktails,
            name="Mojito",
            description="Ron, limón y hierbabuena.",
            price="135.00",
            abv="14.00",
            serving_ml=300,
            rating=5,
            is_alcoholic=True,
        )
        self.foreign = Beverage.objects.create(
            owner=self.other,
            category=self.cocktails,
            name="Negroni",
            description="Gin, Campari y vermut.",
            price="160.00",
            abv="24.00",
            serving_ml=180,
            rating=4,
            is_alcoholic=True,
        )

    def _login(self, email="lucia@example.com"):
        response = self.client.post(
            reverse("accounts:login"), {"email": email, "password": PASSWORD}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    # ── Categorías ─────────────────────────────────────────────────
    def test_categories_are_public_and_include_counts(self):
        response = self.client.get(reverse("category-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 8)
        names = {item["name"] for item in response.data}
        self.assertIn("Cócteles", names)
        self.assertIn("beverage_count", response.data[0])

    # ── Autenticación y aislamiento ────────────────────────────────
    def test_beverages_require_authentication(self):
        response = self.client.get(reverse("beverage-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_only_returns_own_beverages(self):
        self._login()
        response = self.client.get(reverse("beverage-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["name"], "Mojito")
        self.assertNotIn("owner", response.data["results"][0])

    def test_retrieve_foreign_beverage_returns_404(self):
        self._login()
        response = self.client.get(reverse("beverage-detail", args=[self.foreign.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_foreign_beverage_returns_404(self):
        self._login()
        response = self.client.patch(
            reverse("beverage-detail", args=[self.foreign.id]),
            {"name": "Hackeado"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.foreign.refresh_from_db()
        self.assertEqual(self.foreign.name, "Negroni")

    def test_delete_foreign_beverage_returns_404(self):
        self._login()
        response = self.client.delete(reverse("beverage-detail", args=[self.foreign.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Beverage.objects.filter(pk=self.foreign.pk).exists())

    # ── CRUD ───────────────────────────────────────────────────────
    def test_create_beverage_assigns_owner(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(self.coffees, name="Cold brew"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        created = Beverage.objects.get(pk=response.data["id"])
        self.assertEqual(created.owner, self.user)
        self.assertEqual(response.data["category_name"], "Cafés")
        self.assertEqual(response.data["price"], "80.00")

    def test_update_own_beverage(self):
        self._login()
        response = self.client.patch(
            reverse("beverage-detail", args=[self.own.id]),
            {"name": "Mojito de fresa", "rating": 4, "is_favorite": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.own.refresh_from_db()
        self.assertEqual(self.own.name, "Mojito de fresa")
        self.assertTrue(self.own.is_favorite)

    def test_delete_own_beverage(self):
        self._login()
        response = self.client.delete(reverse("beverage-detail", args=[self.own.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Beverage.objects.filter(pk=self.own.pk).exists())

    # ── Validaciones ───────────────────────────────────────────────
    def test_duplicate_name_per_user_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(self.cocktails, name="mojito"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_abv_out_of_range_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(self.cocktails, name="Súper fuerte", abv="150.00"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("abv", response.data)

    def test_negative_price_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(self.cocktails, name="Precio raro", price="-10.00"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("price", response.data)

    def test_invalid_rating_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(self.cocktails, name="Rating raro", rating=9),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("rating", response.data)

    def test_private_image_url_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(
                self.cocktails,
                name="Imagen interna",
                image_url="http://192.168.1.20/privada.jpg",
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image_url", response.data)

    def test_html_description_is_rejected(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(
                self.cocktails,
                name="Con script",
                description="<script>alert('xss')</script>",
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("description", response.data)

    def test_zero_abv_forces_non_alcoholic(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(
                self.cocktails, name="Mocktail", abv="0.00", is_alcoholic=True
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertFalse(response.data["is_alcoholic"])

    def test_alcoholic_flag_must_match_abv(self):
        self._login()
        response = self.client.post(
            reverse("beverage-list"),
            make_payload(
                self.cocktails, name="Inconsistente", abv="12.00", is_alcoholic=False
            ),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("is_alcoholic", response.data)

    # ── Filtros, estadísticas y paginación ────────────────────────
    def test_filters_search_and_ordering(self):
        self._login()
        Beverage.objects.create(
            owner=self.user,
            category=self.coffees,
            name="Latte",
            price="75.00",
            abv="0.00",
            serving_ml=300,
            rating=4,
            is_alcoholic=False,
            is_favorite=True,
        )
        Beverage.objects.create(
            owner=self.user,
            category=self.beers,
            name="IPA",
            price="95.00",
            abv="6.50",
            serving_ml=355,
            rating=4,
            is_alcoholic=True,
        )

        by_search = self.client.get(reverse("beverage-list"), {"search": "latte"})
        self.assertEqual(by_search.data["count"], 1)

        by_category = self.client.get(reverse("beverage-list"), {"category": "cervezas"})
        self.assertEqual(by_category.data["count"], 1)
        self.assertEqual(by_category.data["results"][0]["name"], "IPA")

        favorites = self.client.get(reverse("beverage-list"), {"favorite": "true"})
        self.assertEqual(favorites.data["count"], 1)
        self.assertEqual(favorites.data["results"][0]["name"], "Latte")

        ordered = self.client.get(reverse("beverage-list"), {"ordering": "-price"})
        prices = [float(item["price"]) for item in ordered.data["results"]]
        self.assertEqual(prices, sorted(prices, reverse=True))

    def test_stats_returns_user_metrics(self):
        self._login()
        Beverage.objects.create(
            owner=self.user,
            category=self.coffees,
            name="Latte",
            price="75.00",
            abv="0.00",
            serving_ml=300,
            rating=3,
            is_alcoholic=False,
            is_favorite=True,
        )
        response = self.client.get(reverse("beverage-stats"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["favorites"], 1)
        self.assertEqual(response.data["non_alcoholic"], 1)
        self.assertEqual(response.data["categories"], 2)
        self.assertEqual(response.data["avg_abv"], 7.0)
        self.assertEqual(response.data["avg_rating"], 4.0)

    def test_list_is_paginated(self):
        self._login()
        Beverage.objects.bulk_create(
            [
                Beverage(
                    owner=self.user,
                    category=self.cocktails,
                    name=f"Bebida {index}",
                    price="50.00",
                    abv="0.00",
                    serving_ml=300,
                    rating=3,
                    is_alcoholic=False,
                )
                for index in range(13)
            ]
        )
        response = self.client.get(reverse("beverage-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 14)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertIsNotNone(response.data["next"])

    def test_category_with_beverages_is_protected(self):
        with self.assertRaises(ProtectedError):
            self.cocktails.delete()


class ExternalCocktailAPITests(APITestCase):
    """La API externa se simula para que las pruebas sean deterministas."""

    def setUp(self):
        cache.clear()

    def _mock_response(self, payload):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = payload
        return response

    def _payload(self):
        return {
            "drinks": [
                {
                    "idDrink": "11007",
                    "strDrink": "Margarita",
                    "strCategory": "Ordinary Drink",
                    "strAlcoholic": "Alcoholic",
                    "strGlass": "Cocktail glass",
                    "strInstructions": "Rub the rim of the glass with salt.",
                    "strDrinkThumb": "https://www.thecocktaildb.com/images/media/drink/test.jpg",
                    "strTags": "IBA,NewEra",
                    "strIngredient1": "Tequila",
                    "strMeasure1": "1 1/2 oz",
                    "strIngredient2": "Triple sec",
                    "strMeasure2": "1/2 oz",
                    "strIngredient3": "",
                    "strMeasure3": "",
                }
            ]
        }

    @patch("apps.catalog.services.requests.get")
    def test_search_returns_normalized_results(self, mock_get):
        mock_get.return_value = self._mock_response(self._payload())
        response = self.client.get(reverse("cocktail-search"), {"q": "margarita"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["source"], "TheCocktailDB")
        drink = response.data["results"][0]
        self.assertEqual(drink["name"], "Margarita")
        self.assertEqual(drink["ingredients"][0], {"name": "Tequila", "measure": "1 1/2 oz"})
        self.assertEqual(len(drink["ingredients"]), 2)
        self.assertFalse(response.data["cached"])
        mock_get.assert_called_once()

    @patch("apps.catalog.services.requests.get")
    def test_search_uses_cache_for_repeated_queries(self, mock_get):
        mock_get.return_value = self._mock_response(self._payload())
        first = self.client.get(reverse("cocktail-search"), {"q": "margarita"})
        second = self.client.get(reverse("cocktail-search"), {"q": "Margarita"})
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertTrue(second.data["cached"])
        self.assertEqual(mock_get.call_count, 1)

    def test_search_requires_minimum_query_length(self):
        response = self.client.get(reverse("cocktail-search"), {"q": "a"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("q", response.data)

    @patch("apps.catalog.services.requests.get")
    def test_upstream_timeout_returns_502(self, mock_get):
        mock_get.side_effect = requests.Timeout("timeout")
        response = self.client.get(reverse("cocktail-search"), {"q": "mojito"})
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("detail", response.data)

    @patch("apps.catalog.services.requests.get")
    def test_invalid_upstream_json_returns_502(self, mock_get):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.side_effect = ValueError("JSON inválido")
        mock_get.return_value = response
        result = self.client.get(reverse("cocktail-search"), {"q": "negroni"})
        self.assertEqual(result.status_code, status.HTTP_502_BAD_GATEWAY)

    @patch("apps.catalog.services.requests.get")
    def test_random_cocktail(self, mock_get):
        mock_get.return_value = self._mock_response(self._payload())
        response = self.client.get(reverse("cocktail-random"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"][0]["name"], "Margarita")

    @patch("apps.catalog.services.requests.get")
    def test_random_without_results_returns_404(self, mock_get):
        mock_get.return_value = self._mock_response({"drinks": None})
        response = self.client.get(reverse("cocktail-random"))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
