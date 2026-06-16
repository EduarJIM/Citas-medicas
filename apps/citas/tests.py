import pytest
from django.utils import timezone
from datetime import timedelta, time
from rest_framework import status
from apps.users.models import Rol, Usuario
from apps.users.models import Paciente
from apps.medicos.models import Medico, Especialidad, MedicoEspecialidad
from apps.horarios.models import Horario
from apps.citas.models import Cita, EstadoCita


@pytest.fixture
def seed_roles(db):
    for r in ['admin', 'medico', 'paciente']:
        Rol.objects.get_or_create(nombre=r)


@pytest.fixture
def seed_estados(db):
    for e in ['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio']:
        EstadoCita.objects.get_or_create(nombre=e)


@pytest.fixture
def paciente_user(db, seed_roles):
    rol_paciente = Rol.objects.get(nombre='paciente')
    user = Usuario.objects.create_user(
        correo='paciente@test.com',
        password='Paciente123!',
        nombre_completo='Paciente Test',
        documento='11111111',
        telefono='3001111111',
        id_rol=rol_paciente,
        email_verificado=True,
        is_active=True,
    )
    Paciente.objects.create(id_paciente=user)
    return user


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
        email_verificado=True,
        is_active=True,
    )
    Medico.objects.create(id_medico=user, registro_profesional='RP12345', consultorio='101')
    return user


@pytest.fixture
def admin_user(db, seed_roles):
    user = Usuario.objects.create_superuser(
        correo='admin@test.com',
        password='Admin123!',
        nombre_completo='Admin Test',
        documento='00000000',
    )
    user.email_verificado = True
    user.save(update_fields=['email_verificado'])
    return user


@pytest.fixture
def paciente_token(client, paciente_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'paciente@test.com', 'password': 'Paciente123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def medico_token(client, medico_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'medico@test.com', 'password': 'Medico123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'admin@test.com', 'password': 'Admin123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def horario_futuro(db, medico_user):
    medico = Medico.objects.get(id_medico=medico_user)
    futuro = timezone.now().date() + timedelta(days=7)
    return Horario.objects.create(
        id_medico=medico,
        fecha=futuro,
        hora_inicio=time(9, 0),
        hora_fin=time(9, 30),
    )


@pytest.fixture
def estado_pendiente(db, seed_estados):
    return EstadoCita.objects.get(nombre='pendiente')


def _crear_cita(client, token, horario_id, motivo=''):
    return client.post('/api/citas/', {
        'id_horario': horario_id,
        'motivo': motivo or 'Consulta',
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')


@pytest.mark.django_db
class TestCrearCita:

    def test_create_cita_success(self, client, paciente_user, paciente_token, horario_futuro, seed_estados):
        response = _crear_cita(client, paciente_token, horario_futuro.id_horario, 'Control general')
        assert response.status_code == status.HTTP_201_CREATED
        body = response.json()
        assert body['estado'] == 'pendiente'
        assert body['motivo'] == 'Control general'
        assert Cita.objects.count() == 1
        horario = Horario.objects.get(pk=horario_futuro.id_horario)
        assert horario.disponible is False

    def test_create_cita_horario_not_available(self, client, paciente_user, paciente_token, horario_futuro, seed_estados):
        horario_futuro.disponible = False
        horario_futuro.save()
        response = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_create_cita_nonexistent_horario(self, client, paciente_user, paciente_token, seed_estados):
        response = _crear_cita(client, paciente_token, 99999)
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_create_cita_missing_horario(self, client, paciente_user, paciente_token, seed_estados):
        response = client.post('/api/citas/', {
            'motivo': 'No horario',
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_cita_twice_same_horario(self, client, paciente_user, paciente_token, horario_futuro, seed_estados):
        _crear_cita(client, paciente_token, horario_futuro.id_horario)
        response = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.django_db
class TestCancelarCita:

    def _crear_y_cancelar(self, client, paciente_token, horario_futuro):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        return resp.json()['id_cita']

    def test_cancel_cita_success(self, client, paciente_user, paciente_token, horario_futuro, seed_estados):
        cita_id = self._crear_y_cancelar(client, paciente_token, horario_futuro)
        response = client.delete(
            f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        cita = Cita.objects.get(pk=cita_id)
        assert cita.id_estado.nombre == 'cancelada'
        assert cita.cancelada_por == 'paciente'
        assert Horario.objects.get(pk=horario_futuro.id_horario).disponible is True

    def test_cancel_cita_not_found(self, client, paciente_token):
        response = client.delete(
            '/api/citas/99999/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cancel_cita_already_canceled(self, client, paciente_user, paciente_token, horario_futuro, seed_estados):
        cita_id = self._crear_y_cancelar(client, paciente_token, horario_futuro)
        client.delete(f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        response = client.delete(
            f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_cancel_cita_as_admin(self, client, paciente_user, admin_user, admin_token,
                                  paciente_token, horario_futuro, seed_estados):
        cita_id = self._crear_y_cancelar(client, paciente_token, horario_futuro)
        response = client.delete(
            f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        cita = Cita.objects.get(pk=cita_id)
        assert cita.cancelada_por == 'admin'


@pytest.mark.django_db
class TestAtenderCita:

    def _crear_cita(self, client, paciente_token, horario_futuro):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        return resp.json()['id_cita']

    def test_attend_cita_realizada(self, client, paciente_user, paciente_token,
                                   medico_user, medico_token, horario_futuro, seed_estados):
        cita_id = self._crear_cita(client, paciente_token, horario_futuro)
        response = client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'realizada'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert Cita.objects.get(pk=cita_id).id_estado.nombre == 'realizada'

    def test_attend_cita_no_asistio(self, client, paciente_user, paciente_token,
                                    medico_user, medico_token, horario_futuro, seed_estados):
        cita_id = self._crear_cita(client, paciente_token, horario_futuro)
        response = client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'no_asistio'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert Cita.objects.get(pk=cita_id).id_estado.nombre == 'no_asistio'

    def test_attend_cita_forbidden_non_medico(self, client, paciente_user, paciente_token,
                                              horario_futuro, seed_estados):
        cita_id = self._crear_cita(client, paciente_token, horario_futuro)
        response = client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'realizada'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_attend_cita_not_found(self, client, medico_token):
        response = client.patch(
            '/api/citas/99999/atender/',
            {'accion': 'realizada'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_attend_cita_invalid_action(self, client, medico_user, medico_token,
                                        paciente_token, horario_futuro, seed_estados):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        cita_id = resp.json()['id_cita']
        response = client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'invalid'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_attend_cita_already_attended(self, client, paciente_user, paciente_token,
                                          medico_user, medico_token, horario_futuro, seed_estados):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        cita_id = resp.json()['id_cita']
        client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'realizada'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        response = client.patch(
            f'/api/citas/{cita_id}/atender/',
            {'accion': 'no_asistio'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestEliminarCita:

    def _crear_y_cancelar(self, client, paciente_token, horario_futuro):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        cita_id = resp.json()['id_cita']
        client.delete(f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        return cita_id

    def test_eliminar_cita_success(self, client, paciente_user, paciente_token,
                                   horario_futuro, seed_estados):
        cita_id = self._crear_y_cancelar(client, paciente_token, horario_futuro)
        response = client.delete(
            f'/api/citas/{cita_id}/eliminar/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert not Cita.objects.filter(pk=cita_id).exists()
        assert Horario.objects.get(pk=horario_futuro.id_horario).disponible is True

    def test_eliminar_cita_not_found(self, client, paciente_token):
        response = client.delete(
            '/api/citas/99999/eliminar/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_cannot_eliminar_pendiente_cita(self, client, paciente_user, paciente_token,
                                            horario_futuro, seed_estados):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        cita_id = resp.json()['id_cita']
        response = client.delete(
            f'/api/citas/{cita_id}/eliminar/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_eliminar_cita_forbidden_other_user(self, client, paciente_user, paciente_token,
                                                medico_token, horario_futuro, seed_estados):
        resp = _crear_cita(client, paciente_token, horario_futuro.id_horario)
        cita_id = resp.json()['id_cita']
        client.delete(f'/api/citas/{cita_id}/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        response = client.delete(
            f'/api/citas/{cita_id}/eliminar/',
            HTTP_AUTHORIZATION=f'Bearer {medico_token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCitaList:

    def test_list_citas_empty(self, client, paciente_token, seed_estados):
        response = client.get(
            '/api/citas/', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['results'] == []

    def test_list_citas_filters_by_estado(self, client, paciente_user, paciente_token,
                                          horario_futuro, seed_estados):
        _crear_cita(client, paciente_token, horario_futuro.id_horario)
        response = client.get(
            '/api/citas/?estado=pendiente', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 1

    def test_list_citas_estado_no_match(self, client, paciente_user, paciente_token,
                                        horario_futuro, seed_estados):
        _crear_cita(client, paciente_token, horario_futuro.id_horario)
        response = client.get(
            '/api/citas/?estado=realizada', HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['results'] == []

    def test_list_citas_paciente_only_sees_own(self, client, paciente_user, paciente_token,
                                               medico_user, horario_futuro, seed_estados):
        _crear_cita(client, paciente_token, horario_futuro.id_horario)
        otro_paciente = Usuario.objects.create_user(
            correo='otro@test.com', password='Pac1234!',
            nombre_completo='Otro', documento='99999999',
            id_rol=Rol.objects.get(nombre='paciente'),
            email_verificado=True,
            is_active=True,
        )
        otro_token = client.post('/api/auth/login/', {
            'correo': 'otro@test.com', 'password': 'Pac1234!',
        }, content_type='application/json').json()['access']
        response = client.get(
            '/api/citas/', HTTP_AUTHORIZATION=f'Bearer {otro_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 0

    def test_list_citas_admin_sees_all(self, client, paciente_user, paciente_token,
                                       medico_user, admin_user, admin_token,
                                       horario_futuro, seed_estados):
        _crear_cita(client, paciente_token, horario_futuro.id_horario)
        response = client.get(
            '/api/citas/', HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()['results']) == 1
