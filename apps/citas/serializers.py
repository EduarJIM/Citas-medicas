from rest_framework import serializers
from .models import Cita, EstadoCita, AuditoriaCita


class EstadoCitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoCita
        fields = ('id_estado', 'nombre')


class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.CharField(source='id_paciente.nombre_completo', read_only=True)
    medico_nombre = serializers.SerializerMethodField()
    especialidad = serializers.SerializerMethodField()
    estado = serializers.CharField(source='id_estado.nombre', read_only=True)
    fecha = serializers.DateField(source='id_horario.fecha', read_only=True)
    hora_inicio = serializers.TimeField(source='id_horario.hora_inicio', read_only=True)
    hora_fin = serializers.TimeField(source='id_horario.hora_fin', read_only=True)

    class Meta:
        model = Cita
        fields = (
            'id_cita', 'id_paciente', 'paciente_nombre', 'id_horario',
            'fecha', 'hora_inicio', 'hora_fin', 'medico_nombre',
            'especialidad', 'id_estado', 'estado', 'motivo',
            'fecha_creacion', 'cancelada_por', 'fecha_cancelacion'
        )
        read_only_fields = ('id_cita', 'fecha_creacion', 'fecha_actualizacion')

    def get_medico_nombre(self, obj):
        return obj.id_horario.id_medico.id_medico.nombre_completo

    def get_especialidad(self, obj):
        from apps.medicos.models import MedicoEspecialidad
        me = MedicoEspecialidad.objects.filter(id_medico=obj.id_horario.id_medico).first()
        return me.id_especialidad.nombre if me else ''


class CrearCitaSerializer(serializers.Serializer):
    id_horario = serializers.IntegerField()
    motivo = serializers.CharField(max_length=255, required=False, allow_blank=True)


class CancelarCitaSerializer(serializers.Serializer):
    motivo = serializers.CharField(max_length=255, required=False, allow_blank=True)
