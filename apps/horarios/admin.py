from django.contrib import admin
from .models import Horario


@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = ('id_horario', 'id_medico', 'fecha', 'hora_inicio', 'hora_fin', 'disponible')
    list_filter = ('disponible', 'fecha')
    search_fields = ('id_medico__id_medico__nombre_completo',)
