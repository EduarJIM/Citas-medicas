from django.utils import timezone
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Paciente, TokenRecuperacion, TokenVerificacion, Rol
from .serializers import (
    RegistroSerializer, UsuarioSerializer,
    PacienteSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, VerificacionSerializer,
    ReenviarVerificacionSerializer
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

    token = secrets.token_urlsafe(32)
    TokenVerificacion.objects.create(
        id_usuario=usuario,
        token=token,
        expira_en=timezone.now() + timedelta(hours=24),
    )

    enlace = f'{settings.FRONTEND_URL}/verify-email/{token}'
    enlace_directo = f'{request.scheme}://{request.get_host()}/api/auth/verify-email/{token}/'
    try:
        send_mail(
            subject='Verifica tu correo electrónico - Citas Médicas',
            message=f'Hola {usuario.nombre_completo},\n\n'
                    f'Gracias por registrarte. Por favor verifica tu correo haciendo clic en el siguiente enlace:\n\n'
                    f'{enlace_directo}\n\n'
                    f'Este enlace expira en 24 horas.\n\n'
                    f'Si no creaste esta cuenta, ignora este mensaje.\n\n'
                    f'Saludos,\nEquipo de Citas Médicas',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.correo],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({
        'mensaje': 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request, token=None):
    if request.method == 'GET':
        if not token:
            return HttpResponse('Token no proporcionado', status=400)
        data = {'token': token}
    else:
        serializer = VerificacionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

    try:
        token_obj = TokenVerificacion.objects.get(
            token=data['token'],
            usado=False,
            expira_en__gt=timezone.now()
        )
    except TokenVerificacion.DoesNotExist:
        if request.method == 'GET':
            return HttpResponse(
                '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5;">'
                '<div style="text-align:center;padding:2rem;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:400px;">'
                '<div style="font-size:3rem;margin-bottom:1rem;">&#10060;</div>'
                '<h2 style="color:#e74c3c;margin:0 0 0.5rem;">Token inválido o expirado</h2>'
                '<p style="color:#666;">El enlace de verificación no es válido o ya expiró. Solicita uno nuevo en la página de inicio de sesión.</p>'
                f'<a href="{settings.FRONTEND_URL}/login" style="display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#3498db;color:white;text-decoration:none;border-radius:6px;">Ir a iniciar sesión</a>'
                '</div></body></html>',
                status=400,
                content_type='text/html; charset=utf-8'
            )
        return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = token_obj.id_usuario
    usuario.email_verificado = True
    usuario.is_active = True
    usuario.save(update_fields=['email_verificado', 'is_active'])

    token_obj.usado = True
    token_obj.save(update_fields=['usado'])

    if request.method == 'GET':
        return HttpResponse(
            '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5;">'
            '<div style="text-align:center;padding:2rem;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);max-width:400px;">'
            '<div style="font-size:3rem;margin-bottom:1rem;">&#10004;</div>'
            '<h2 style="color:#27ae60;margin:0 0 0.5rem;">¡Correo verificado!</h2>'
            '<p style="color:#666;">Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión.</p>'
            f'<a href="{settings.FRONTEND_URL}/login" style="display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#3498db;color:white;text-decoration:none;border-radius:6px;">Ir a iniciar sesión</a>'
            '</div></body></html>',
            content_type='text/html; charset=utf-8'
        )

    return Response({'mensaje': 'Correo verificado exitosamente. Ahora puedes iniciar sesión.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification(request):
    serializer = ReenviarVerificacionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario = Usuario.objects.get(
            correo=serializer.validated_data['correo'],
            email_verificado=False
        )
    except Usuario.DoesNotExist:
        return Response({'mensaje': 'Si el correo existe y no está verificado, recibirás un enlace.'})

    TokenVerificacion.objects.filter(id_usuario=usuario, usado=False).update(usado=True)

    token = secrets.token_urlsafe(32)
    TokenVerificacion.objects.create(
        id_usuario=usuario,
        token=token,
        expira_en=timezone.now() + timedelta(hours=24),
    )

    enlace_directo = f'{request.scheme}://{request.get_host()}/api/auth/verify-email/{token}/'
    try:
        send_mail(
            subject='Verifica tu correo electrónico - Citas Médicas',
            message=f'Hola {usuario.nombre_completo},\n\n'
                    f'Has solicitado reenviar el enlace de verificación. Haz clic aquí para verificar tu correo:\n\n'
                    f'{enlace_directo}\n\n'
                    f'Este enlace expira en 24 horas.\n\n'
                    f'Saludos,\nEquipo de Citas Médicas',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.correo],
            fail_silently=True,
        )
    except Exception:
        pass

    return Response({'mensaje': 'Si el correo existe y no está verificado, recibirás un enlace.'})


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

    if not usuario.email_verificado:
        return Response({
            'error': 'Debes verificar tu correo electrónico antes de iniciar sesión.',
            'codigo': 'email_no_verificado'
        }, status=status.HTTP_403_FORBIDDEN)

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
