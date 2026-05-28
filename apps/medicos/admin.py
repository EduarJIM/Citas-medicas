from django.contrib import admin
from .models import Medico, Especialidad, MedicoEspecialidad


@admin.register(Medico)
class MedicoAdmin(admin.ModelAdmin):
    list_display = ('id_medico', 'registro_profesional', 'consultorio', 'estado')
    list_filter = ('estado',)


@admin.register(Especialidad)
class EspecialidadAdmin(admin.ModelAdmin):
    list_display = ('id_especialidad', 'nombre')
    search_fields = ('nombre',)


@admin.register(MedicoEspecialidad)
class MedicoEspecialidadAdmin(admin.ModelAdmin):
    list_display = ('id_medico', 'id_especialidad')
