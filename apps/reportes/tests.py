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
def admin_user(db, seed_roles):
    user = Usuario.objects.create_superuser(
        correo='admin@test.com', password='Admin123!',
        nombre_completo='Admin Test', documento='00000000',
    )
    user.email_verificado = True
    user.save(update_fields=['email_verificado'])
    return user


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'admin@test.com', 'password': 'Admin123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def paciente_user(db, seed_roles):
    rol = Rol.objects.get(nombre='paciente')
    user = Usuario.objects.create_user(
        correo='paciente@test.com', password='Pac1234!',
        nombre_completo='Paciente Test', documento='11111111',
        id_rol=rol, email_verificado=True, is_active=True,
    )
    Paciente.objects.create(id_paciente=user)
    return user


@pytest.fixture
def medico_user(db, seed_roles):
    rol = Rol.objects.get(nombre='medico')
    user = Usuario.objects.create_user(
        correo='medico@test.com', password='Med1234!',
        nombre_completo='Dr. Test', documento='22222222',
        id_rol=rol, email_verificado=True, is_active=True,
    )
    Medico.objects.create(id_medico=user, registro_profesional='RP12345', consultorio='101')
    return user


@pytest.fixture
def especialidad(db):
    return Especialidad.objects.create(nombre='Cardiologia')


@pytest.fixture
def medico_con_especialidad(db, medico_user, especialidad):
    MedicoEspecialidad.objects.create(
        id_medico=Medico.objects.get(id_medico=medico_user),
        id_especialidad=especialidad,
    )
    return medico_user


@pytest.fixture
def horario_futuro(db, medico_user):
    medico = Medico.objects.get(id_medico=medico_user)
    futuro = timezone.now().date() + timedelta(days=7)
    return Horario.objects.create(
        id_medico=medico, fecha=futuro,
        hora_inicio=time(9, 0), hora_fin=time(9, 30),
    )


def _crear_cita(client, token, horario_id, estado_nombre='pendiente'):
    resp = client.post('/api/citas/', {
        'id_horario': horario_id, 'motivo': 'Consulta',
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {token}')
    return resp


@pytest.mark.django_db
class TestReporteCitasPorEspecialidad:

    def test_reporte_forbidden_for_non_admin(self, client, paciente_user):
        resp = client.post('/api/auth/login/', {
            'correo': 'paciente@test.com', 'password': 'Pac1234!',
        }, content_type='application/json')
        token = resp.json()['access']
        response = client.get(
            '/api/reportes/citas-por-especialidad/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_reporte_empty(self, client, admin_token):
        response = client.get(
            '/api/reportes/citas-por-especialidad/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_reporte_with_data(self, client, admin_token, admin_user,
                               paciente_user, medico_con_especialidad,
                               horario_futuro, seed_estados):
        resp = client.post('/api/auth/login/', {
            'correo': 'paciente@test.com', 'password': 'Pac1234!',
        }, content_type='application/json')
        p_token = resp.json()['access']
        _crear_cita(client, p_token, horario_futuro.id_horario)

        response = client.get(
            '/api/reportes/citas-por-especialidad/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        cardiologia = next((r for r in data if r['especialidad'] == 'Cardiologia'), None)
        assert cardiologia is not None
        assert cardiologia['total'] >= 1


@pytest.mark.django_db
class TestReporteTasaNoAsistencia:

    def test_reporte_forbidden_for_non_admin(self, client, paciente_user):
        resp = client.post('/api/auth/login/', {
            'correo': 'paciente@test.com', 'password': 'Pac1234!',
        }, content_type='application/json')
        token = resp.json()['access']
        response = client.get(
            '/api/reportes/tasa-no-asistencia/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_tasa_zero_when_no_citas(self, client, admin_token):
        response = client.get(
            '/api/reportes/tasa-no-asistencia/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        for r in response.json():
            assert r['tasa_no_asistencia'] == 0


@pytest.mark.django_db
class TestExportarCSV:

    def test_export_csv_forbidden_for_non_admin(self, client, paciente_user):
        resp = client.post('/api/auth/login/', {
            'correo': 'paciente@test.com', 'password': 'Pac1234!',
        }, content_type='application/json')
        token = resp.json()['access']
        response = client.get(
            '/api/reportes/exportar/csv/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_export_csv_success(self, client, admin_token):
        response = client.get(
            '/api/reportes/exportar/csv/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert 'reporte_citas.csv' in response['Content-Disposition']

    def test_export_invalid_format(self, client, admin_token):
        response = client.get(
            '/api/reportes/exportar/pdf/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
