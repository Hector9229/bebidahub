from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Paginación estable para el catálogo (máx. 48 elementos por página)."""

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 48
