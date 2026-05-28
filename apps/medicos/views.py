from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Medico, Especialidad, MedicoEspecialidad
from .serializers import MedicoSerializer, MedicoListSerializer, EspecialidadSerializer


@api_view(['GET', 'POST'])
def medico_list_create(request):
    if request.method == 'GET':
        queryset = Medico.objects.filter(estado='activo')
        especialidad = request.query_params.get('especialidad')
        if especialidad:
            queryset = queryset.filter(
                medicoespecialidad__id_especialidad=especialidad
            ).distinct()
        return Response(MedicoListSerializer(queryset, many=True).data)

    if request.method == 'POST':
        if not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        # Crear médico vinculado a un usuario existente
        from apps.users.models import Usuario, Rol
        id_usuario = request.data.get('id_usuario')
        try:
            usuario = Usuario.objects.get(pk=id_usuario)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if Medico.objects.filter(id_medico=usuario).exists():
            return Response({'error': 'El usuario ya es médico'}, status=status.HTTP_400_BAD_REQUEST)
        if usuario.id_rol.nombre != 'medico':
            rol_medico = Rol.objects.get(nombre='medico')
            usuario.id_rol = rol_medico
            usuario.save(update_fields=['id_rol'])
        medico = Medico.objects.create(
            id_medico=usuario,
            registro_profesional=request.data.get('registro_profesional', ''),
            consultorio=request.data.get('consultorio', ''),
        )
        especialidades = request.data.get('especialidades', [])
        for esp_id in especialidades:
            MedicoEspecialidad.objects.create(
                id_medico=medico,
                id_especialidad_id=esp_id
            )
        return Response(MedicoSerializer(medico).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def medico_detail(request, pk):
    try:
        medico = Medico.objects.get(pk=pk)
    except Medico.DoesNotExist:
        return Response({'error': 'Médico no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(MedicoSerializer(medico).data)

    if request.method == 'PUT':
        if request.user.id_usuario != medico.id_medico_id and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        for field in ['registro_profesional', 'consultorio', 'estado']:
            if field in request.data:
                setattr(medico, field, request.data[field])
        medico.save()
        if 'especialidades' in request.data:
            MedicoEspecialidad.objects.filter(id_medico=medico).delete()
            for esp_id in request.data['especialidades']:
                MedicoEspecialidad.objects.create(id_medico=medico, id_especialidad_id=esp_id)
        return Response(MedicoSerializer(medico).data)

    if request.method == 'DELETE':
        if not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        medico.estado = 'inactivo'
        medico.save(update_fields=['estado'])
        return Response({'mensaje': 'Médico desactivado'}, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def especialidad_list_create(request):
    if request.method == 'GET':
        return Response(EspecialidadSerializer(Especialidad.objects.all(), many=True).data)

    if request.method == 'POST':
        if not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        serializer = EspecialidadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def especialidad_detail(request, pk):
    try:
        esp = Especialidad.objects.get(pk=pk)
    except Especialidad.DoesNotExist:
        return Response({'error': 'Especialidad no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = EspecialidadSerializer(esp, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        esp.delete()
        return Response({'mensaje': 'Especialidad eliminada'}, status=status.HTTP_204_NO_CONTENT)
