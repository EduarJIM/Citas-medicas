from rest_framework import serializers
from .models import Horario


class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = ('id_horario', 'id_medico', 'fecha', 'hora_inicio', 'hora_fin', 'disponible')
        read_only_fields = ('id_horario', 'disponible')


class DisponibilidadSlotSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    duracion_minutos = serializers.IntegerField(default=30, min_value=15, max_value=60)
