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
    actions = ['eliminar_citas']

    @admin.action(description='Eliminar permanentemente citas seleccionadas')
    def eliminar_citas(self, request, queryset):
        for cita in queryset:
            if cita.id_estado.nombre == 'pendiente':
                self.message_user(request, f'Cita #{cita.id_cita}: debe cancelarse antes de eliminar', level='WARNING')
                continue
            cita.id_horario.disponible = True
            cita.id_horario.save(update_fields=['disponible'])
            cita.delete()
        self.message_user(request, f'{queryset.count()} cita(s) eliminadas permanentemente')


@admin.register(AuditoriaCita)
class AuditoriaCitaAdmin(admin.ModelAdmin):
    list_display = ('id_auditoria', 'id_cita', 'evento', 'fecha_evento')
    list_filter = ('evento',)
