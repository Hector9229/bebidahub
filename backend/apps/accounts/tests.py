"""Pruebas automatizadas de registro, login JWT y perfil."""
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

PASSWORD = "ClaveSegura#2026"


class AccountsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="lucia@example.com",
            password=PASSWORD,
            first_name="Lucía",
            last_name="Mendoza",
        )

    def _auth(self, email="lucia@example.com", password=PASSWORD):
        response = self.client.post(
            reverse("accounts:login"), {"email": email, "password": password}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return response

    # ── Registro ───────────────────────────────────────────────────
    def test_register_returns_tokens_and_user(self):
        payload = {
            "first_name": "Diego",
            "last_name": "Ramírez",
            "email": "diego@example.com",
            "password": "CaféConLeche#2026",
            "password_confirm": "CaféConLeche#2026",
        }
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "diego@example.com")
        self.assertNotIn("password", response.data["user"])
        self.assertTrue(User.objects.filter(email="diego@example.com").exists())

    def test_register_rejects_duplicate_email_case_insensitive(self):
        payload = {
            "first_name": "Otra",
            "last_name": "Persona",
            "email": "LUCIA@EXAMPLE.COM",
            "password": "OtraClave#2026",
            "password_confirm": "OtraClave#2026",
        }
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_rejects_weak_password(self):
        payload = {
            "first_name": "Ana",
            "email": "ana@example.com",
            "password": "1234567890",
            "password_confirm": "1234567890",
        }
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_register_rejects_mismatched_passwords(self):
        payload = {
            "first_name": "Ana",
            "email": "ana@example.com",
            "password": "ClaveSegura#2026",
            "password_confirm": "ClaveDistinta#2026",
        }
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_register_rejects_html_in_name(self):
        payload = {
            "first_name": "<script>alert(1)</script>",
            "email": "xss@example.com",
            "password": "ClaveSegura#2026",
            "password_confirm": "ClaveSegura#2026",
        }
        response = self.client.post(reverse("accounts:register"), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("first_name", response.data)

    # ── Login ──────────────────────────────────────────────────────
    def test_login_with_email_returns_tokens_and_user(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"email": "lucia@example.com", "password": PASSWORD},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["first_name"], "Lucía")

    def test_login_rejects_wrong_password(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"email": "lucia@example.com", "password": "Incorrecta#2026"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Perfil y logout ────────────────────────────────────────────
    def test_me_requires_authentication(self):
        response = self.client.get(reverse("accounts:me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_and_updates_profile(self):
        self._auth()
        response = self.client.get(reverse("accounts:me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "lucia@example.com")

        patch = self.client.patch(
            reverse("accounts:me"), {"first_name": "Lucía Fernanda"}, format="json"
        )
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        self.assertEqual(patch.data["first_name"], "Lucía Fernanda")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Lucía Fernanda")

    def test_logout_blacklists_refresh_token(self):
        login = self._auth()
        refresh = login.data["refresh"]
        logout = self.client.post(
            reverse("accounts:logout"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)

        retry = self.client.post(
            reverse("accounts:refresh"), {"refresh": refresh}, format="json"
        )
        self.assertEqual(retry.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_valid_token(self):
        self._auth()
        response = self.client.post(
            reverse("accounts:logout"), {"refresh": "token-invalido"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
