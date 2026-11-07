from django.contrib import admin

from .models import Beverage, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "slug", "order", "beverage_count")
    list_editable = ("order",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Bebidas")
    def beverage_count(self, obj):
        return obj.beverages.count()


@admin.register(Beverage)
class BeverageAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "owner",
        "category",
        "abv",
        "price",
        "rating",
        "is_favorite",
        "created_at",
    )
    list_filter = ("category", "is_alcoholic", "is_favorite", "rating")
    search_fields = ("name", "description", "owner__email")
    autocomplete_fields = ("owner",)
    list_select_related = ("owner", "category")
    date_hierarchy = "created_at"
