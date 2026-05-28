from datetime import datetime, timedelta, time, date
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Horario
from .serializers import HorarioSerializer, DisponibilidadSlotSerializer
from apps.medicos.models import Medico
from django.db import IntegrityError


@api_view(['GET'])
def disponibilidad_list(request, medico_pk):
    try:
        medico = Medico.objects.get(pk=medico_pk)
    except Medico.DoesNotExist:
        return Response({'error': 'Médico no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    queryset = Horario.objects.filter(id_medico=medico, disponible=True, fecha__gte=date.today())
    fecha = request.query_params.get('fecha')
    if fecha:
        queryset = queryset.filter(fecha=fecha)
    queryset = queryset.order_by('fecha', 'hora_inicio')
    return Response(HorarioSerializer(queryset, many=True).data)


@api_view(['POST'])
def disponibilidad_create(request, medico_pk):
    try:
        medico = Medico.objects.get(pk=medico_pk)
    except Medico.DoesNotExist:
        return Response({'error': 'Médico no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id_usuario != medico.id_medico_id and not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    serializer = DisponibilidadSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    fecha_val = serializer.validated_data['fecha']
    hora_inicio = serializer.validated_data['hora_inicio']
    hora_fin = serializer.validated_data['hora_fin']
    duracion = serializer.validated_data['duracion_minutos']

    if hora_fin <= hora_inicio:
        return Response({'error': 'hora_fin debe ser mayor que hora_inicio'}, status=status.HTTP_400_BAD_REQUEST)

    # Generar slots
    start = datetime.combine(fecha_val, hora_inicio)
    end = datetime.combine(fecha_val, hora_fin)
    created = []
    errors = []

    current = start
    while current + timedelta(minutes=duracion) <= end:
        slot_inicio = current.time()
        slot_fin = (current + timedelta(minutes=duracion)).time()

        # Validar overlap
        overlap = Horario.objects.filter(
            id_medico=medico,
            fecha=fecha_val,
            hora_inicio__lt=slot_fin,
            hora_fin__gt=slot_inicio,
        ).exists()

        if overlap:
            errors.append(f'Slot {slot_inicio}-{slot_fin} se superpone con otro horario')
        else:
            try:
                h = Horario.objects.create(
                    id_medico=medico,
                    fecha=fecha_val,
                    hora_inicio=slot_inicio,
                    hora_fin=slot_fin,
                )
                created.append(HorarioSerializer(h).data)
            except IntegrityError:
                errors.append(f'Slot {slot_inicio}-{slot_fin} ya existe')

        current += timedelta(minutes=duracion)

    return Response({'created': created, 'errors': errors}, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
def disponibilidad_detail(request, medico_pk, pk):
    try:
        horario = Horario.objects.get(pk=pk, id_medico_id=medico_pk)
    except Horario.DoesNotExist:
        return Response({'error': 'Horario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.id_usuario != horario.id_medico.id_medico_id and not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = HorarioSerializer(horario, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        horario.delete()
        return Response({'mensaje': 'Horario eliminado'}, status=status.HTTP_204_NO_CONTENT)
