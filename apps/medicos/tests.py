import pytest
from rest_framework import status
from apps.users.models import Rol, Usuario
from apps.medicos.models import Medico, Especialidad, MedicoEspecialidad


@pytest.fixture
def seed_roles(db):
    for r in ['admin', 'medico', 'paciente']:
        Rol.objects.get_or_create(nombre=r)


@pytest.fixture
def admin_user(db, seed_roles):
    return Usuario.objects.create_superuser(
        correo='admin@test.com',
        password='Admin123!',
        nombre_completo='Admin Test',
        documento='00000000',
    )


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
def especialidad(db):
    return Especialidad.objects.create(nombre='Cardiología')


@pytest.fixture
def otra_especialidad(db):
    return Especialidad.objects.create(nombre='Pediatría')


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'admin@test.com', 'password': 'Admin123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.fixture
def paciente_token(client, paciente_user):
    resp = client.post('/api/auth/login/', {
        'correo': 'paciente@test.com', 'password': 'Paciente123!',
    }, content_type='application/json')
    return resp.json()['access']


@pytest.mark.django_db
class TestMedicoList:

    def test_list_medicos_empty(self, client):
        response = client.get('/api/medicos/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_medicos_with_data(self, client, medico_user, especialidad):
        MedicoEspecialidad.objects.create(
            id_medico=Medico.objects.get(id_medico=medico_user),
            id_especialidad=especialidad,
        )
        response = client.get('/api/medicos/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['nombre_completo'] == 'Dr. Test'

    def test_list_medicos_filters_by_especialidad(self, client, medico_user, especialidad, otra_especialidad):
        medico = Medico.objects.get(id_medico=medico_user)
        MedicoEspecialidad.objects.create(id_medico=medico, id_especialidad=especialidad)
        altri_medico = Usuario.objects.create_user(
            correo='medico2@test.com', password='Medico123!',
            nombre_completo='Dr. Segundo', documento='33333333',
            id_rol=Rol.objects.get(nombre='medico'),
        )
        Medico.objects.create(id_medico=altri_medico, registro_profesional='RP99999')
        MedicoEspecialidad.objects.create(
            id_medico=Medico.objects.get(id_medico=altri_medico),
            id_especialidad=otra_especialidad,
        )
        response = client.get(f'/api/medicos/?especialidad={especialidad.id_especialidad}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1
        assert response.json()[0]['nombre_completo'] == 'Dr. Test'

    def test_list_medicos_filter_no_match(self, client, medico_user):
        response = client.get('/api/medicos/?especialidad=99999')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_medicos_excludes_inactive(self, client, medico_user):
        Medico.objects.filter(id_medico=medico_user).update(estado='inactivo')
        response = client.get('/api/medicos/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []


@pytest.mark.django_db
class TestMedicoCreate:

    def test_create_medico_as_admin(self, client, admin_user, admin_token, paciente_user, especialidad):
        response = client.post('/api/medicos/', {
            'id_usuario': paciente_user.id_usuario,
            'registro_profesional': 'RP99999',
            'consultorio': '202',
            'especialidades': [especialidad.id_especialidad],
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        assert response.status_code == status.HTTP_201_CREATED
        assert Medico.objects.filter(id_medico=paciente_user).exists()
        assert MedicoEspecialidad.objects.filter(
            id_medico__id_medico=paciente_user, id_especialidad=especialidad
        ).exists()

    def test_create_medico_as_admin_promotes_role(self, client, admin_user, admin_token, paciente_user):
        response = client.post('/api/medicos/', {
            'id_usuario': paciente_user.id_usuario,
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        assert response.status_code == status.HTTP_201_CREATED
        user = Usuario.objects.get(pk=paciente_user.id_usuario)
        assert user.id_rol.nombre == 'medico'

    def test_create_medico_forbidden_for_non_admin(self, client, medico_user, paciente_token, paciente_user):
        response = client.post('/api/medicos/', {
            'id_usuario': paciente_user.id_usuario,
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {paciente_token}')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_medico_nonexistent_user(self, client, admin_user, admin_token):
        response = client.post('/api/medicos/', {
            'id_usuario': 99999,
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_medico_duplicate(self, client, admin_user, admin_token, medico_user):
        response = client.post('/api/medicos/', {
            'id_usuario': medico_user.id_usuario,
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ya es médico' in str(response.json()).lower()


@pytest.mark.django_db
class TestMedicoDetail:

    def test_medico_detail_success(self, client, medico_user):
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['nombre_completo'] == 'Dr. Test'
        assert response.json()['registro_profesional'] == 'RP12345'
        assert response.json()['consultorio'] == '101'

    def test_medico_detail_not_found(self, client):
        response = client.get('/api/medicos/99999/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_medico_detail_shows_especialidades(self, client, medico_user, especialidad):
        medico = Medico.objects.get(id_medico=medico_user)
        MedicoEspecialidad.objects.create(id_medico=medico, id_especialidad=especialidad)
        response = client.get(f'/api/medicos/{medico_user.id_usuario}/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestMedicoUpdate:

    def test_update_medico_as_self(self, client, medico_user, especialidad):
        from apps.users.models import Paciente
        resp = client.post('/api/auth/login/', {
            'correo': 'medico@test.com', 'password': 'Medico123!',
        }, content_type='application/json')
        token = resp.json()['access']
        response = client.put(
            f'/api/medicos/{medico_user.id_usuario}/',
            {'consultorio': '303', 'registro_profesional': 'RP-NEW'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        assert response.status_code == status.HTTP_200_OK
        medico = Medico.objects.get(id_medico=medico_user)
        assert medico.consultorio == '303'
        assert medico.registro_profesional == 'RP-NEW'

    def test_update_medico_forbidden_for_other(self, client, medico_user, paciente_token):
        response = client.put(
            f'/api/medicos/{medico_user.id_usuario}/',
            {'consultorio': '999'},
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestMedicoDelete:

    def test_delete_medico_as_admin(self, client, admin_user, admin_token, medico_user):
        response = client.delete(
            f'/api/medicos/{medico_user.id_usuario}/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_200_OK
        medico = Medico.objects.get(id_medico=medico_user)
        assert medico.estado == 'inactivo'

    def test_delete_medico_forbidden_for_non_admin(self, client, medico_user, paciente_token):
        response = client.delete(
            f'/api/medicos/{medico_user.id_usuario}/',
            HTTP_AUTHORIZATION=f'Bearer {paciente_token}',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_medico_not_found(self, client, admin_token):
        response = client.delete(
            '/api/medicos/99999/',
            HTTP_AUTHORIZATION=f'Bearer {admin_token}',
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
