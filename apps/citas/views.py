from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Cita, EstadoCita, AuditoriaCita
from .serializers import CitaSerializer, CrearCitaSerializer, CancelarCitaSerializer
from apps.horarios.models import Horario
from apps.medicos.models import Medico
from apps.notificaciones.models import Notificacion


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

        try:
            Notificacion.objects.create(
                id_usuario=request.user,
                titulo='Cita agendada exitosamente',
                mensaje=f'Tu cita con el médico {horario.id_medico.id_usuario.nombre_completo} '
                        f'ha sido agendada para el {horario.fecha} a las {horario.hora_inicio}.',
            )
            send_mail(
                subject='Cita agendada exitosamente',
                message=f'Tu cita con el médico {horario.id_medico.id_usuario.nombre_completo} '
                        f'ha sido agendada para el {horario.fecha} a las {horario.hora_inicio}.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.correo],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response(CitaSerializer(cita).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def mis_pacientes(request):
    try:
        medico = Medico.objects.get(pk=request.user.id_usuario)
    except Medico.DoesNotExist:
        return Response({'error': 'Solo los médicos pueden acceder'}, status=status.HTTP_403_FORBIDDEN)

    queryset = Cita.objects.select_related(
        'id_paciente', 'id_horario', 'id_estado'
    ).filter(
        id_horario__id_medico=medico,
        id_horario__fecha=timezone.now().date()
    ).order_by('id_horario__hora_inicio')

    return Response(CitaSerializer(queryset, many=True).data)


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
    try:
        mensaje_notif = 'Tu cita fue atendida exitosamente.' if evento == 'realizada' else 'No asististe a tu cita.'
        Notificacion.objects.create(
            id_usuario=cita.id_paciente,
            titulo='Cita atendida' if evento == 'realizada' else 'No asistió',
            mensaje=mensaje_notif,
        )
        send_mail(
            subject='Cita atendida' if evento == 'realizada' else 'No asistió',
            message=mensaje_notif,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[cita.id_paciente.correo],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response(CitaSerializer(cita).data)


@api_view(['PATCH'])
def confirmar_cita(request, pk):
    try:
        cita = Cita.objects.select_related('id_horario__id_medico', 'id_estado').get(pk=pk)
    except Cita.DoesNotExist:
        return Response({'error': 'Cita no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    medico = cita.id_horario.id_medico
    if request.user.id_usuario != medico.id_medico_id and not request.user.is_superuser:
        return Response({'error': 'Solo el médico asignado puede confirmar esta cita'},
                        status=status.HTTP_403_FORBIDDEN)

    if cita.id_estado.nombre != 'pendiente':
        return Response({'error': f'No se puede confirmar una cita {cita.id_estado.nombre}'},
                        status=status.HTTP_400_BAD_REQUEST)

    estado_confirmada = EstadoCita.objects.get_or_create(nombre='confirmada')[0]
    cita.id_estado = estado_confirmada
    cita.save(update_fields=['id_estado'])

    Notificacion.objects.create(
        id_usuario=cita.id_paciente,
        titulo='Cita Confirmada',
        mensaje=f'Tu cita del {cita.id_horario.fecha} a las {cita.id_horario.hora_inicio} ha sido confirmada por el médico.'
    )

    AuditoriaCita.objects.create(
        id_cita=cita, evento='confirmada',
        actor_id_usuario=request.user,
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


@api_view(['GET'])
def historial_paciente(request, pk):
    if not request.user.is_superuser and request.user.id_usuario != pk:
        return Response({'error': 'No tienes permiso'}, status=status.HTTP_403_FORBIDDEN)

    from apps.users.models import Usuario
    try:
        paciente = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    citas = Cita.objects.select_related(
        'id_horario', 'id_horario__id_medico__id_medico', 'id_estado'
    ).filter(id_paciente=pk).order_by('-id_horario__fecha', '-id_horario__hora_inicio')

    return Response({
        'paciente_nombre': paciente.nombre_completo,
        'citas': CitaSerializer(citas, many=True).data,
    })


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

    try:
        Notificacion.objects.create(
            id_usuario=cita.id_paciente,
            titulo='Cita cancelada',
            mensaje=f'Tu cita del {cita.id_horario.fecha} a las {cita.id_horario.hora_inicio} '
                    f'ha sido cancelada ({cancelada_por}).',
        )
        send_mail(
            subject='Cita cancelada',
            message=f'Tu cita del {cita.id_horario.fecha} a las {cita.id_horario.hora_inicio} '
                    f'ha sido cancelada ({cancelada_por}).',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[cita.id_paciente.correo],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({'mensaje': 'Cita cancelada correctamente'})
