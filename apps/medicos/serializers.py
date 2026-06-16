from rest_framework import serializers
from .models import Medico, Especialidad, MedicoEspecialidad
from apps.users.serializers import UsuarioSerializer


class MedicoSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(source='id_medico', read_only=True)
    correo = serializers.EmailField(source='id_medico.correo', read_only=True)
    nombre_completo = serializers.CharField(source='id_medico.nombre_completo', read_only=True)

    class Meta:
        model = Medico
        fields = ('id_medico', 'correo', 'nombre_completo', 'registro_profesional', 'consultorio', 'estado', 'usuario')


class MedicoListSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(source='id_medico.nombre_completo')
    especialidades = serializers.SerializerMethodField()

    class Meta:
        model = Medico
        fields = ('id_medico', 'nombre_completo', 'registro_profesional', 'consultorio', 'estado', 'especialidades')

    def get_especialidades(self, obj):
        prefetched = getattr(obj, 'especialidades_cache', None)
        if prefetched is not None:
            return [me.id_especialidad.nombre for me in prefetched]
        return [me.id_especialidad.nombre for me in obj.medicoespecialidad_set.select_related('id_especialidad').all()]


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = ('id_especialidad', 'nombre')


class MedicoEspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicoEspecialidad
        fields = ('id_medico', 'id_especialidad')
