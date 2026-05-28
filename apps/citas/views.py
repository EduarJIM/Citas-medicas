from datetime import timedelta
from django.utils import timezone
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Cita, EstadoCita, AuditoriaCita
from .serializers import CitaSerializer, CrearCitaSerializer, CancelarCitaSerializer
from apps.horarios.models import Horario


def _get_estado(nombre):
    try:
        return EstadoCita.objects.get(nombre=nombre)
    except EstadoCita.DoesNotExist:
        return None


@api_view(['GET', 'POST'])
def cita_list_create(request):
    if request.method == 'GET':
        queryset = Cita.objects.select_related(
            'id_paciente', 'id_horario', 'id_horario__id_medico', 'id_horario__id_medico__id_medico', 'id_estado'
        ).all()

        # Filtros
        if not request.user.is_superuser:
            # Paciente ve solo sus citas
            queryset = queryset.filter(id_paciente=request.user)
        estado = request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(id_estado__nombre=estado)
        fecha_desde = request.query_params.get('fecha_desde')
        if fecha_desde:
            queryset = queryset.filter(id_horario__fecha__gte=fecha_desde)
        fecha_hasta = request.query_params.get('fecha_hasta')
        if fecha_hasta:
            queryset = queryset.filter(id_horario__fecha__lte=fecha_hasta)

        queryset = queryset.order_by('-id_horario__fecha', '-id_horario__hora_inicio')
        return Response(CitaSerializer(queryset, many=True).data)

    if request.method == 'POST':
        serializer = CrearCitaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            horario = Horario.objects.select_related('id_medico').get(
                pk=serializer.validated_data['id_horario'],
                disponible=True
            )
        except Horario.DoesNotExist:
            return Response({'error': 'Horario no disponible'}, status=status.HTTP_409_CONFLICT)

        estado_pendiente = _get_estado('pendiente')
        if not estado_pendiente:
            return Response({'error': 'Error de configuración: estado pendiente no encontrado'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        with transaction.atomic():
            try:
                cita = Cita.objects.create(
                    id_paciente=request.user,
                    id_horario=horario,
                    id_estado=estado_pendiente,
                    motivo=serializer.validated_data.get('motivo', ''),
                )
                horario.disponible = False
                horario.save(update_fields=['disponible'])
                AuditoriaCita.objects.create(
                    id_cita=cita,
                    evento='creada',
                    actor_id_usuario=request.user,
                    detalle='Cita creada por paciente',
                )
            except IntegrityError:
                return Response({'error': 'Este horario ya fue reservado por otro paciente'},
                                status=status.HTTP_409_CONFLICT)

        return Response(CitaSerializer(cita).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def cita_detail(request, pk):
    try:
        cita = Cita.objects.select_related(
            'id_paciente', 'id_horario', 'id_horario__id_medico', 'id_estado'
        ).get(pk=pk)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CitaSerializer(cita).data)

    if request.method == 'PUT':
        # Reprogramar - cambiar horario
        nuevo_horario_id = request.data.get('id_horario')
        if nuevo_horario_id:
            try:
                nuevo_horario = Horario.objects.get(pk=nuevo_horario_id, disponible=True)
            except Horario.DoesNotExist:
                return Response({'error': 'Nuevo horario no disponible'}, status=status.HTTP_409_CONFLICT)

            with transaction.atomic():
                horario_viejo = cita.id_horario
                horario_viejo.disponible = True
                horario_viejo.save(update_fields=['disponible'])
                cita.id_horario = nuevo_horario
                nuevo_horario.disponible = False
                nuevo_horario.save(update_fields=['disponible'])
                cita.save(update_fields=['id_horario'])
                AuditoriaCita.objects.create(
                    id_cita=cita, evento='reprogramada',
                    actor_id_usuario=request.user,
                    detalle=f'Reprogramada del horario {horario_viejo.id_horario} al {nuevo_horario.id_horario}'
                )
        return Response(CitaSerializer(cita).data)

    if request.method == 'DELETE':
        return cancelar_cita(request, cita)


@api_view(['PATCH'])
def atender_cita(request, pk):
    try:
        cita = Cita.objects.select_related('id_horario__id_medico', 'id_estado').get(pk=pk)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    medico = cita.id_horario.id_medico
    if request.user.id_usuario != medico.id_medico_id and not request.user.is_superuser:
        return Response({'error': 'Solo el médico asignado puede atender esta cita'},
                        status=status.HTTP_403_FORBIDDEN)

    if cita.id_estado.nombre not in ('pendiente', 'confirmada'):
        return Response({'error': f'No se puede atender una cita {cita.id_estado.nombre}'},
                        status=status.HTTP_400_BAD_REQUEST)

    accion = request.data.get('accion', 'realizada')
    if accion == 'realizada':
        nuevo_estado = _get_estado('realizada')
        evento = 'realizada'
    elif accion == 'no_asistio':
        nuevo_estado = _get_estado('no_asistio')
        evento = 'no_asistio'
    else:
        return Response({'error': 'Acción inválida. Use "realizada" o "no_asistio".'},
                        status=status.HTTP_400_BAD_REQUEST)
    if not nuevo_estado:
        return Response({'error': f'Error de configuración: estado {evento} no encontrado'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    cita.id_estado = nuevo_estado
    cita.save(update_fields=['id_estado'])
    AuditoriaCita.objects.create(
        id_cita=cita, evento=evento,
        actor_id_usuario=request.user,
        detalle=request.data.get('notas', ''),
    )
    return Response(CitaSerializer(cita).data)


@api_view(['DELETE'])
def eliminar_cita(request, pk):
    try:
        cita = Cita.objects.get(pk=pk)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if not request.user.is_superuser and cita.id_paciente != request.user:
        return Response({'error': 'No tienes permiso para eliminar esta cita'},
                        status=status.HTTP_403_FORBIDDEN)

    if cita.id_estado.nombre == 'pendiente':
        return Response({'error': 'Debes cancelar la cita antes de eliminarla'},
                        status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        cita.id_horario.disponible = True
        cita.id_horario.save(update_fields=['disponible'])
        cita.delete()

    return Response({'mensaje': 'Cita eliminada permanentemente'})


def cancelar_cita(request, cita):
    ahora = timezone.now()
    hora_cita = timezone.make_aware(
        timezone.datetime.combine(cita.id_horario.fecha, cita.id_horario.hora_inicio)
    )

    if cita.id_estado.nombre in ('cancelada', 'realizada', 'no_asistio'):
        return Response({'error': f'La cita ya está {cita.id_estado.nombre}'},
                        status=status.HTTP_409_CONFLICT)

    # Validar ventana de 24h para pacientes
    es_admin = request.user.is_superuser
    es_medico = cita.id_horario.id_medico.id_medico_id == request.user.id_usuario

    if not es_admin and not es_medico:
        if hora_cita - ahora < timedelta(hours=24):
            return Response({
                'error': 'Solo puedes cancelar citas con al menos 24 horas de anticipación'
            }, status=status.HTTP_409_CONFLICT)

    cancelada_por = 'paciente'
    if es_admin:
        cancelada_por = 'admin'
    elif es_medico:
        cancelada_por = 'medico'

    estado_cancelada = _get_estado('cancelada')
    if not estado_cancelada:
        return Response({'error': 'Error de configuración: estado cancelada no encontrado'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    with transaction.atomic():
        cita.id_estado = estado_cancelada
        cita.cancelada_por = cancelada_por
        cita.fecha_cancelacion = ahora
        cita.save(update_fields=['id_estado', 'cancelada_por', 'fecha_cancelacion'])
        cita.id_horario.disponible = True
        cita.id_horario.save(update_fields=['disponible'])
        AuditoriaCita.objects.create(
            id_cita=cita, evento='cancelada',
            actor_id_usuario=request.user,
        )

    return Response({'mensaje': 'Cita cancelada correctamente'})
