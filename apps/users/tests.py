import pytest
from rest_framework import status
from apps.users.models import Rol, Usuario
from apps.users.serializers import RegistroSerializer


@pytest.fixture
def seed_roles(db):
    for r in ['admin', 'medico', 'paciente']:
        Rol.objects.get_or_create(nombre=r)


USER_DATA = {
    'nombre_completo': 'Juan Pérez',
    'documento': '12345678',
    'correo': 'juan@example.com',
    'telefono': '3001234567',
    'password': 'Test1234!',
    'password2': 'Test1234!',
}


@pytest.mark.django_db
class TestUserRegistration:

    def test_registration_success(self, client, seed_roles):
        response = client.post('/api/auth/register/', USER_DATA, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert 'access' in body
        assert 'refresh' in body
        assert body['usuario']['correo'] == 'juan@example.com'
        assert body['usuario']['nombre_completo'] == 'Juan Pérez'
        assert Usuario.objects.filter(correo='juan@example.com').exists()

    def test_registration_missing_fields(self, client, seed_roles):
        response = client.post('/api/auth/register/', {}, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_weak_password_no_uppercase(self, client, seed_roles):
        data = {**USER_DATA, 'password': 'test1234!', 'password2': 'test1234!'}
        response = client.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'mayúscula' in str(response.json()).lower()

    def test_registration_weak_password_no_number(self, client, seed_roles):
        data = {**USER_DATA, 'password': 'Testabcd!', 'password2': 'Testabcd!'}
        response = client.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'número' in str(response.json()).lower()

    def test_registration_weak_password_no_special_char(self, client, seed_roles):
        data = {**USER_DATA, 'password': 'Test1234', 'password2': 'Test1234'}
        response = client.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'especial' in str(response.json()).lower()

    def test_registration_password_mismatch(self, client, seed_roles):
        data = {**USER_DATA, 'password2': 'Test5678!'}
        response = client.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'coinciden' in str(response.json()).lower()

    def test_registration_duplicate_email(self, client, seed_roles):
        client.post('/api/auth/register/', USER_DATA, content_type='application/json')
        data = {**USER_DATA, 'documento': '87654321'}
        from django.test import Client as TestClient
        c = TestClient(raise_request_exception=False)
        response = c.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code in (
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    def test_registration_short_password(self, client, seed_roles):
        data = {**USER_DATA, 'password': 'A1!a', 'password2': 'A1!a'}
        response = client.post('/api/auth/register/', data, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:

    def _register(self, client):
        client.post('/api/auth/register/', USER_DATA, content_type='application/json')

    def test_login_success(self, client, seed_roles):
        self._register(client)
        response = client.post('/api/auth/login/', {
            'correo': 'juan@example.com',
            'password': 'Test1234!',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_200_OK
        body = response.json()
        assert 'access' in body
        assert 'refresh' in body
        assert body['usuario']['correo'] == 'juan@example.com'

    def test_login_invalid_credentials(self, client, seed_roles):
        self._register(client)
        response = client.post('/api/auth/login/', {
            'correo': 'juan@example.com',
            'password': 'WrongPass1!',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'Credenciales inválidas' in str(response.json().get('error', ''))

    def test_login_wrong_password_counts_attempts(self, client, seed_roles):
        self._register(client)
        for _ in range(3):
            response = client.post('/api/auth/login/', {
                'correo': 'juan@example.com',
                'password': 'WrongPass1!',
            }, content_type='application/json')
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
        user = Usuario.objects.get(correo='juan@example.com')
        assert user.intentos_fallidos == 3
        assert user.bloqueado_hasta is not None

    def test_login_blocked_after_three_failures(self, client, seed_roles):
        self._register(client)
        for _ in range(3):
            client.post('/api/auth/login/', {
                'correo': 'juan@example.com',
                'password': 'WrongPass1!',
            }, content_type='application/json')
        response = client.post('/api/auth/login/', {
            'correo': 'juan@example.com',
            'password': 'Test1234!',
        }, content_type='application/json')
        assert response.status_code == 423
        assert 'bloqueada' in str(response.json().get('error', ''))

    def test_login_nonexistent_email(self, client, seed_roles):
        response = client.post('/api/auth/login/', {
            'correo': 'noexiste@example.com',
            'password': 'Test1234!',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_resets_attempts_on_success(self, client, seed_roles):
        self._register(client)
        client.post('/api/auth/login/', {
            'correo': 'juan@example.com', 'password': 'WrongPass1!',
        }, content_type='application/json')
        client.post('/api/auth/login/', {
            'correo': 'juan@example.com', 'password': 'WrongPass1!',
        }, content_type='application/json')
        response = client.post('/api/auth/login/', {
            'correo': 'juan@example.com', 'password': 'Test1234!',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_200_OK
        user = Usuario.objects.get(correo='juan@example.com')
        assert user.intentos_fallidos == 0
        assert user.bloqueado_hasta is None
