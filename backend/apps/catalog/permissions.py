from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Defensa en profundidad: sólo el dueño puede mutar una bebida."""

    message = "No tienes permiso para modificar esta bebida."

    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj.owner_id == request.user.id)
