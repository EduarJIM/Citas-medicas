from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Paciente, TokenRecuperacion, Rol
from .serializers import (
    RegistroSerializer, LoginSerializer, UsuarioSerializer,
    PacienteSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
import secrets
from datetime import timedelta


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegistroSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    usuario = serializer.save()
    refresh = RefreshToken.for_user(usuario)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'usuario': UsuarioSerializer(usuario).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    correo = request.data.get('correo', '')
    password = request.data.get('password', '')
    try:
        usuario = Usuario.objects.get(correo=correo)
    except Usuario.DoesNotExist:
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

    if not usuario.activo:
        return Response({'error': 'Cuenta desactivada'}, status=status.HTTP_403_FORBIDDEN)

    if usuario.bloqueado_hasta and timezone.now() < usuario.bloqueado_hasta:
        return Response({'error': 'Cuenta bloqueada. Intente más tarde.'}, status=status.HTTP_423_LOCKED)

    user = authenticate(correo=correo, password=password)
    if not user:
        usuario.intentos_fallidos += 1
        if usuario.intentos_fallidos >= 3:
            usuario.bloqueado_hasta = timezone.now() + timedelta(minutes=15)
        usuario.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    usuario.save(update_fields=['intentos_fallidos', 'bloqueado_hasta'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'usuario': UsuarioSerializer(user).data,
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def usuario_detail(request, pk):
    try:
        usuario = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UsuarioSerializer(usuario).data)

    if request.method == 'PUT':
        if request.user.id_usuario != usuario.id_usuario and not request.user.is_superuser:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UsuarioSerializer(usuario, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def usuario_delete(request, pk):
    if not request.user.is_superuser:
        return Response({'error': 'Solo administradores pueden eliminar usuarios'}, status=status.HTTP_403_FORBIDDEN)
    try:
        usuario = Usuario.objects.get(pk=pk)
        usuario.activo = False
        usuario.save(update_fields=['activo'])
        return Response({'mensaje': 'Usuario desactivado'}, status=status.HTTP_200_OK)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        usuario = Usuario.objects.get(correo=serializer.validated_data['correo'])
        token = secrets.token_urlsafe(32)
        TokenRecuperacion.objects.create(
            id_usuario=usuario,
            token=token,
            expira_en=timezone.now() + timedelta(hours=1),
        )
        # En producción se enviaría un correo real
        return Response({'mensaje': 'Si el correo existe, recibirás un enlace de recuperación', 'token': token})
    except Usuario.DoesNotExist:
        return Response({'mensaje': 'Si el correo existe, recibirás un enlace de recuperación'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        token_obj = TokenRecuperacion.objects.get(
            token=serializer.validated_data['token'],
            usado=False,
            expira_en__gt=timezone.now()
        )
        usuario = token_obj.id_usuario
        usuario.set_password(serializer.validated_data['password'])
        usuario.save(update_fields=['password'])
        token_obj.usado = True
        token_obj.save(update_fields=['usado'])
        return Response({'mensaje': 'Contraseña actualizada correctamente'})
    except TokenRecuperacion.DoesNotExist:
        return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)
