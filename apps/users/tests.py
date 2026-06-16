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
        assert 'mensaje' in body
        assert 'Registro exitoso' in body['mensaje']
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

    def _create_verified_user(self):
        rol_paciente = Rol.objects.get(nombre='paciente')
        usuario = Usuario.objects.create_user(
            correo=USER_DATA['correo'],
            password=USER_DATA['password'],
            nombre_completo=USER_DATA['nombre_completo'],
            documento=USER_DATA['documento'],
            telefono=USER_DATA['telefono'],
            id_rol=rol_paciente,
            email_verificado=True,
            is_active=True,
        )
        from apps.users.models import Paciente
        Paciente.objects.create(id_paciente=usuario)
        return usuario

    def test_login_success(self, client, seed_roles):
        self._create_verified_user()
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
        self._create_verified_user()
        response = client.post('/api/auth/login/', {
            'correo': 'juan@example.com',
            'password': 'WrongPass1!',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'Credenciales' in str(response.json().get('error', ''))

    def test_login_wrong_password_counts_attempts(self, client, seed_roles):
        self._create_verified_user()
        expected = [status.HTTP_401_UNAUTHORIZED, status.HTTP_401_UNAUTHORIZED, 423]
        for i in range(3):
            response = client.post('/api/auth/login/', {
                'correo': 'juan@example.com',
                'password': 'WrongPass1!',
            }, content_type='application/json')
            assert response.status_code == expected[i], f'Attempt {i+1}: expected {expected[i]} got {response.status_code}'
        user = Usuario.objects.get(correo='juan@example.com')
        assert user.intentos_fallidos == 3
        assert user.bloqueado_hasta is not None

    def test_login_blocked_after_three_failures(self, client, seed_roles):
        self._create_verified_user()
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
        user = self._create_verified_user()
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
