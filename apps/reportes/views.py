import csv
from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from apps.citas.models import Cita, EstadoCita


@api_view(['GET'])
def reporte_citas_por_especialidad(request):
    if not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    from apps.medicos.models import Especialidad
    from django.db.models import Count, Q

    especialidades = Especialidad.objects.annotate(
        total=Count('medicoespecialidad__id_medico__horario__cita', distinct=True),
        canceladas=Count('medicoespecialidad__id_medico__horario__cita',
            distinct=True,
            filter=Q(medicoespecialidad__id_medico__horario__cita__id_estado__nombre='cancelada')),
        realizadas=Count('medicoespecialidad__id_medico__horario__cita',
            distinct=True,
            filter=Q(medicoespecialidad__id_medico__horario__cita__id_estado__nombre='realizada')),
    )

    return Response([{
        'especialidad': esp.nombre,
        'total': esp.total,
        'canceladas': esp.canceladas,
        'realizadas': esp.realizadas,
    } for esp in especialidades])


@api_view(['GET'])
def reporte_tasa_no_asistencia(request):
    if not request.user.is_superuser:
        return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    from apps.medicos.models import Medico
    from django.db.models import Count, Q

    total_no_asistio = Cita.objects.filter(id_estado__nombre='no_asistio').count()
    total_realizadas = Cita.objects.filter(id_estado__nombre='realizada').count()
    total_atendidas = total_realizadas + total_no_asistio

    medicos = Medico.objects.filter(estado='activo').select_related('id_medico').annotate(
        no_asistio=Count('horario__cita',
            filter=Q(horario__cita__id_estado__nombre='no_asistio'), distinct=True),
        realizadas=Count('horario__cita',
            filter=Q(horario__cita__id_estado__nombre='realizada'), distinct=True),
    )

    return Response([{
        'medico': m.id_medico.nombre_completo,
        'no_asistio': m.no_asistio,
        'realizadas': m.realizadas,
        'tasa_no_asistencia': round((m.no_asistio / (m.no_asistio + m.realizadas) * 100) if (m.no_asistio + m.realizadas) > 0 else 0, 2),
    } for m in medicos])


@api_view(['GET'])
def exportar_reportes(request, formato):
    if not request.user.is_superuser:
        return Response({'error': 'Solo administradores'}, status=status.HTTP_403_FORBIDDEN)

    if formato == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reporte_citas.csv"'
        writer = csv.writer(response)
        writer.writerow(['ID', 'Paciente', 'Medico', 'Fecha', 'Hora', 'Estado', 'Motivo'])

        citas = Cita.objects.select_related('id_paciente', 'id_horario__id_medico__id_medico', 'id_estado').all()
        for c in citas:
            writer.writerow([
                c.id_cita,
                c.id_paciente.nombre_completo,
                c.id_horario.id_medico.id_medico.nombre_completo,
                c.id_horario.fecha,
                c.id_horario.hora_inicio,
                c.id_estado.nombre,
                c.motivo,
            ])
        return response

    return Response({'error': 'Formato no soportado. Use "csv".'}, status=status.HTTP_400_BAD_REQUEST)
