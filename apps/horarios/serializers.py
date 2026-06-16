from rest_framework import serializers
from .models import Horario


ZONA_HORARIA = 'America/Bogota (UTC-5)'

DIAS_SEMANA = {
    0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves',
    4: 'Viernes', 5: 'Sábado', 6: 'Domingo',
}


class HorarioSerializer(serializers.ModelSerializer):
    dia_semana = serializers.SerializerMethodField()
    zona_horaria = serializers.SerializerMethodField()

    class Meta:
        model = Horario
        fields = ('id_horario', 'id_medico', 'fecha', 'hora_inicio', 'hora_fin', 'disponible', 'dia_semana', 'zona_horaria')
        read_only_fields = ('id_horario', 'disponible', 'dia_semana', 'zona_horaria')

    def get_dia_semana(self, obj):
        return DIAS_SEMANA.get(obj.fecha.weekday(), '')

    def get_zona_horaria(self, obj):
        return ZONA_HORARIA


class DisponibilidadSlotSerializer(serializers.Serializer):
    fecha = serializers.DateField()
    hora_inicio = serializers.TimeField()
    hora_fin = serializers.TimeField()
    duracion_minutos = serializers.IntegerField(default=30, min_value=15, max_value=60)
