from django.contrib import admin
from .models import EstadoCita, Cita, AuditoriaCita


@admin.register(EstadoCita)
class EstadoCitaAdmin(admin.ModelAdmin):
    list_display = ('id_estado', 'nombre')


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ('id_cita', 'id_paciente', 'id_horario', 'id_estado', 'fecha_creacion')
    list_filter = ('id_estado',)
    search_fields = ('id_paciente__nombre_completo',)


@admin.register(AuditoriaCita)
class AuditoriaCitaAdmin(admin.ModelAdmin):
    list_display = ('id_auditoria', 'id_cita', 'evento', 'fecha_evento')
    list_filter = ('evento',)
