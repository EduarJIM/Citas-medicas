import pytest
from rest_framework import status
from apps.users.models import Rol, Usuario
from apps.notificaciones.models import Notificacion


@pytest.fixture
def seed_roles(db):
    for r in ['admin', 'medico', 'paciente']:
        Rol.objects.get_or_create(nombre=r)


@pytest.fixture
def paciente_user(db, seed_roles):
    rol = Rol.objects.get(nombre='paciente')
    return Usuario.objects.create_user(
        correo='paciente@test.com', password='Pac1234!',
        nombre_completo='Paciente Test', documento='11111111',
        telefono='3001111111', id_rol=rol,
        email_verificado=True, is_active=True,
    )


@pytest.fixture
def paciente_token(client, paciente_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'paciente@test.com', 'password': 'Pac1234!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def notificacion(db, paciente_user):
    return Notificacion.objects.create(
        id_usuario=paciente_user,
        titulo='Cita agendada',
        mensaje='Tu cita fue agendada exitosamente',
    )


@pytest.mark.django_db
class TestNotificacionListCreate:

    def test_list_notificaciones_empty(self, client, paciente_token):
        response = client.get(
            '/api/notificaciones/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_notificaciones_with_data(self, client, paciente_user, paciente_token, notificacion):
        response = client.get(
            '/api/notificaciones/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['titulo'] == 'Cita agendada'
        assert data[0]['leida'] is False

    def test_list_notificaciones_filters_leida(self, client, paciente_user, paciente_token, notificacion):
        response = client.get(
            '/api/notificaciones/?leida=true',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_notificaciones_only_own(self, client, paciente_user, paciente_token, notificacion):
        otro_rol = Rol.objects.get(nombre='medico')
        otro = Usuario.objects.create_user(
            correo='medico@test.com', password='Med1234!',
            nombre_completo='Dr. Test', documento='22222222',
            id_rol=otro_rol, email_verificado=True, is_active=True,
        )
        resp = client.post('/api/auth/login/', {
            'correo': 'medico@test.com', 'password': 'Med1234!',
        }, content_type='application/json')
        otro_token = resp.json()['access']
        response = client.get(
            '/api/notificaciones/',
            HTTP_AUTHORIZATION=f'Bearer {otro_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_create_notificacion(self, client, paciente_user, paciente_token):
        response = client.post('/api/notificaciones/', {
            'id_usuario': paciente_user.id_usuario,
            'titulo': 'Recordatorio',
            'mensaje': 'Tienes una cita mañana',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        assert response.status_code == status.HTTP_201_CREATED
        assert Notificacion.objects.filter(titulo='Recordatorio').exists()

    def test_create_notificacion_missing_fields(self, client, paciente_token):
        response = client.post('/api/notificaciones/', {
            'titulo': 'Solo titulo',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestNotificacionDetail:

    def test_mark_as_read(self, client, paciente_user, paciente_token, notificacion):
        response = client.put(
            f'/api/notificaciones/{notificacion.id_notificacion}/',
            {'leida': True},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['leida'] is True
        notif = Notificacion.objects.get(pk=notificacion.id_notificacion)
        assert notif.leida is True

    def test_delete_notificacion(self, client, paciente_user, paciente_token, notificacion):
        response = client.delete(
            f'/api/notificaciones/{notificacion.id_notificacion}/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Notificacion.objects.filter(pk=notificacion.id_notificacion).exists()

    def test_notificacion_not_found(self, client, paciente_token):
        response = client.put(
            '/api/notificaciones/99999/',
            {'leida': True},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_access_other_user_notificacion(self, client, paciente_user, paciente_token, notificacion):
        otro_rol = Rol.objects.get(nombre='medico')
        otro = Usuario.objects.create_user(
            correo='medico@test.com', password='Med1234!',
            nombre_completo='Dr. Test', documento='22222222',
            id_rol=otro_rol, email_verificado=True, is_active=True,
        )
        resp = client.post('/api/auth/login/', {
            'correo': 'medico@test.com', 'password': 'Med1234!',
        }, content_type='application/json')
        otro_token = resp.json()['access']
        response = client.put(
            f'/api/notificaciones/{notificacion.id_notificacion}/',
            {'leida': True},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {otro_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
