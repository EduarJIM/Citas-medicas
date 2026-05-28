from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ('id_notificacion', 'id_usuario', 'titulo', 'mensaje', 'leida', 'created_at')
        read_only_fields = ('id_notificacion', 'created_at')
