"""Serializers de cuentas: registro, login JWT y perfil."""
import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

# Rechaza etiquetas HTML/scripts y caracteres de control en datos de usuario.
SAFE_TEXT = re.compile(r"^[^<>\x00-\x1f\x7f]+$")


def _clean_name(value: str, field_label: str) -> str:
    value = " ".join(value.split())
    if len(value) < 2:
        raise serializers.ValidationError(f"El {field_label} debe tener al menos 2 caracteres.")
    if not SAFE_TEXT.match(value):
        raise serializers.ValidationError(f"El {field_label} contiene caracteres no permitidos.")
    return value


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "full_name", "date_joined")
        read_only_fields = ("id", "email", "date_joined")
        extra_kwargs = {
            "first_name": {"required": False, "max_length": 80},
            "last_name": {"required": False, "allow_blank": True, "max_length": 80},
        }

    def validate_first_name(self, value):
        return _clean_name(value, "nombre")

    def validate_last_name(self, value):
        if not value:
            return ""
        return _clean_name(value, "apellido")


class RegisterSerializer(serializers.Serializer):
    """Valida y crea una cuenta nueva con contraseña robusta."""

    first_name = serializers.CharField(max_length=80, min_length=2)
    last_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, min_length=10, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_first_name(self, value):
        return _clean_name(value, "nombre")

    def validate_last_name(self, value):
        if not value:
            return ""
        return _clean_name(value, "apellido")

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ya existe una cuenta registrada con este correo.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        candidate = User(
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Incluye los datos del usuario en la respuesta del login."""

    default_error_messages = {
        "no_active_account": "El correo o la contraseña son incorrectos.",
    }

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
