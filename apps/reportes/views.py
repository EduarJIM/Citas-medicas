from django.db.models import Count, Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from apps.citas.models import Cita, EstadoCita


@api_view(['GET'])
def reporte_citas_por_especialidad(request):
    if not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    from apps.medicos.models import Especialidad, MedicoEspecialidad
    from django.db.models import Count
    import json

    data = []
    for esp in Especialidad.objects.all():
        total = Cita.objects.filter(
            id_horario__id_medico__medicoespecialidad__id_especialidad=esp
        ).count()
        canceladas = Cita.objects.filter(
            id_horario__id_medico__medicoespecialidad__id_especialidad=esp,
            id_estado__nombre='cancelada'
        ).count()
        realizadas = Cita.objects.filter(
            id_horario__id_medico__medicoespecialidad__id_especialidad=esp,
            id_estado__nombre='realizada'
        ).count()
        data.append({
            'especialidad': esp.nombre,
            'total': total,
            'canceladas': canceladas,
            'realizadas': realizadas,
        })

    return Response(data)


@api_view(['GET'])
def reporte_tasa_no_asistencia(request):
    if not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    from apps.medicos.models import Medico

    data = []
    total_no_asistio = Cita.objects.filter(id_estado__nombre='no_asistio').count()
    total_realizadas = Cita.objects.filter(id_estado__nombre='realizada').count()
    total_atendidas = total_realizadas + total_no_asistio

    for medico in Medico.objects.filter(estado='activo'):
        no_asistio = Cita.objects.filter(
            id_horario__id_medico=medico,
            id_estado__nombre='no_asistio'
        ).count()
        realizadas = Cita.objects.filter(
            id_horario__id_medico=medico,
            id_estado__nombre='realizada'
        ).count()
        total_medico = no_asistio + realizadas
        tasa = (no_asistio / total_medico * 100) if total_medico > 0 else 0
        data.append({
            'medico': medico.id_medico.nombre_completo,
            'no_asistio': no_asistio,
            'realizadas': realizadas,
            'tasa_no_asistencia': round(tasa, 2),
        })

    return Response(data)
