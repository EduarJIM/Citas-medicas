import pytest
from django.utils import timezone
from datetime import timedelta, time
from rest_framework import status
from apps.users.models import Rol, Usuario
from apps.medicos.models import Medico
from apps.horarios.models import Horario


@pytest.fixture
def seed_roles(db):
    for r in ['admin', 'medico', 'paciente']:
        Rol.objects.get_or_create(nombre=r)


@pytest.fixture
def medico_user(db, seed_roles):
    rol_medico = Rol.objects.get(nombre='medico')
    user = Usuario.objects.create_user(
        correo='medico@test.com',
        password='Medico123!',
        nombre_completo='Dr. Test',
        documento='22222222',
        telefono='3002222222',
        id_rol=rol_medico,
    )
    Medico.objects.create(id_medico=user, registro_profesional='RP12345', consultorio='101')
    return user


@pytest.fixture
def paciente_user(db, seed_roles):
    from apps.users.models import Paciente
    rol_paciente = Rol.objects.get(nombre='paciente')
    user = Usuario.objects.create_user(
        correo='paciente@test.com',
        password='Paciente123!',
        nombre_completo='Paciente Test',
        documento='11111111',
        telefono='3001111111',
        id_rol=rol_paciente,
    )
    Paciente.objects.create(id_paciente=user)
    return user


@pytest.fixture
def medico_token(client, medico_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'medico@test.com', 'password': 'Medico123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def paciente_token(client, paciente_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'paciente@test.com', 'password': 'Paciente123!',
    }, content_type='application/json')
    return resp.json()['access']


def _fecha_futura():
    return timezone.now().date() + timedelta(days=7)


@pytest.mark.django_db
class TestDisponibilidadList:

    def test_list_disponibilidad_empty(self, client, medico_user):
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/disponibilidad/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_disponibilidad_with_horarios(self, client, medico_user):
        futuro = _fecha_futura()
        Horario.objects.create(
            id_medico=Medico.objects.get(id_medico=medico_user),
            fecha=futuro, hora_inicio=time(9, 0), hora_fin=time(9, 30),
        )
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/disponibilidad/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['disponible'] is True
        assert data[0]['fecha'] == futuro.isoformat()

    def test_list_disponibilidad_filters_by_fecha(self, client, medico_user):
        futuro = _fecha_futura()
        otro_dia = futuro + timedelta(days=1)
        medico = Medico.objects.get(id_medico=medico_user)
        Horario.objects.create(
            id_medico=medico, fecha=futuro, hora_inicio=time(9, 0), hora_fin=time(9, 30),
        )
        Horario.objects.create(
            id_medico=medico, fecha=otro_dia, hora_inicio=time(10, 0), hora_fin=time(10, 30),
        )
        response = client.get(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/?fecha={futuro}'
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    def test_list_disponibilidad_excludes_non_disponible(self, client, medico_user):
        futuro = _fecha_futura()
        Horario.objects.create(
            id_medico=Medico.objects.get(id_medico=medico_user),
            fecha=futuro, hora_inicio=time(9, 0), hora_fin=time(9, 30),
            disponible=False,
        )
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/disponibilidad/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_disponibilidad_medico_not_found(self, client):
        response = client.get('/api/medicos/99999/disponibilidad/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_list_disponibilidad_excludes_past_dates(self, client, medico_user):
        pasado = timezone.now().date() - timedelta(days=1)
        Horario.objects.create(
            id_medico=Medico.objects.get(id_medico=medico_user),
            fecha=pasado, hora_inicio=time(9, 0), hora_fin=time(9, 30),
        )
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/disponibilidad/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []


@pytest.mark.django_db
class TestDisponibilidadCreate:

    def test_create_horario_success(self, client, medico_user, medico_token):
        futuro = _fecha_futura()
        response = client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert len(body['created']) == 2
        assert len(body['errors']) == 0
        medico = Medico.objects.get(id_medico=medico_user)
        assert Horario.objects.filter(id_medico=medico).count() == 2

    def test_create_horario_multiple_slots(self, client, medico_user, medico_token):
        futuro = _fecha_futura()
        response = client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '10:00',
                'duracion_minutos': 60,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.json()['created']) == 2  # 08:00-09:00, 09:00-10:00

    def test_create_horario_unauthorized_as_paciente(self, client, medico_user, paciente_token):
        futuro = _fecha_futura()
        response = client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_horario_invalid_date(self, client, medico_user, medico_token):
        response = client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': 'invalid-date',
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_horario_medico_not_found(self, client, medico_token):
        futuro = _fecha_futura()
        response = client.post(
            '/api/medicos/99999/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_horario_overlap_detected(self, client, medico_user, medico_token):
        futuro = _fecha_futura()
        client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        response = client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '08:00',
                'hora_fin': '09:00',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        body = response.json()
        assert len(body['errors']) > 0
        assert any('superpone' in e for e in body['errors'])


@pytest.mark.django_db
class TestHorarioDisponible:

    def test_horario_listed_as_disponible_after_creation(self, client, medico_user, medico_token):
        futuro = _fecha_futura()
        client.post(
            f'/api/medicos/{medico_user.id_usuario}/disponibilidad/create/',
            {
                'fecha': futuro.isoformat(),
                'hora_inicio': '10:00',
                'hora_fin': '10:30',
                'duracion_minutos': 30,
            },
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/disponibilidad/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['disponible'] is True
