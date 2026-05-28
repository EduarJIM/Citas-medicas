import re
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Paciente, TokenRecuperacion, Rol


class RegistroSerializer(serializers.Serializer):
    nombre_completo = serializers.CharField(max_length=150)
    documento = serializers.CharField(max_length=30)
    correo = serializers.EmailField(max_length=150)
    telefono = serializers.CharField(max_length=30, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un carácter especial')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        rol_paciente = Rol.objects.get(nombre='paciente')
        usuario = Usuario(
            correo=validated_data['correo'],
            nombre_completo=validated_data['nombre_completo'],
            documento=validated_data['documento'],
            telefono=validated_data.get('telefono', ''),
            id_rol=rol_paciente,
        )
        usuario.set_password(password)
        usuario.save()
        Paciente.objects.create(id_paciente=usuario)
        return usuario


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.CharField(source='id_rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = ('id_usuario', 'correo', 'nombre_completo', 'documento', 'telefono', 'rol', 'activo')


class PacienteSerializer(serializers.ModelSerializer):
    correo = serializers.EmailField(source='id_paciente.correo', read_only=True)
    nombre_completo = serializers.CharField(source='id_paciente.nombre_completo', read_only=True)

    class Meta:
        model = Paciente
        fields = ('id_paciente', 'correo', 'nombre_completo', 'fecha_nacimiento', 'sexo', 'eps', 'alergias')


class PasswordResetRequestSerializer(serializers.Serializer):
    correo = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)
    password2 = serializers.CharField(min_length=8)

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un número')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError('La contraseña debe contener al menos un carácter especial')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden'})
        return data
