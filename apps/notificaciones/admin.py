from django.contrib import admin
from .models import Notificacion


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('id_notificacion', 'id_usuario', 'titulo', 'leida', 'created_at')
    list_filter = ('leida',)
