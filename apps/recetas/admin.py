from django.contrib import admin
from .models import Receta

@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ('id_receta', 'id_cita', 'medicamento', 'dosis', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('medicamento',)
