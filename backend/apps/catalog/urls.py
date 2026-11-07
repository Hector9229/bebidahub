from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BeverageViewSet, CategoryViewSet, CocktailRandomView, CocktailSearchView

router = DefaultRouter()
router.register("beverages", BeverageViewSet, basename="beverage")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("external/cocktails/random/", CocktailRandomView.as_view(), name="cocktail-random"),
    path("external/cocktails/", CocktailSearchView.as_view(), name="cocktail-search"),
    path("", include(router.urls)),
]
