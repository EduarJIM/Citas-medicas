from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Notificacion
from .serializers import NotificacionSerializer


@api_view(['GET', 'POST'])
def notificacion_list_create(request):
    if request.method == 'GET':
        queryset = Notificacion.objects.filter(id_usuario=request.user)
        leida = request.query_params.get('leida')
        if leida is not None:
            queryset = queryset.filter(leida=leida.lower() == 'true')
        queryset = queryset.order_by('-created_at')
        return Response(NotificacionSerializer(queryset, many=True).data)

    if request.method == 'POST':
        serializer = NotificacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            try:
                send_mail(
                    subject=serializer.validated_data['titulo'],
                    message=serializer.validated_data['mensaje'],
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[request.user.correo],
                    fail_silently=True,
                )
            except Exception:
                pass
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def notificacion_detail(request, pk):
    try:
        notif = Notificacion.objects.get(pk=pk, id_usuario=request.user)
    except Notificacion.DoesNotExist:
        return Response({'error': 'Notificación no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        notif.leida = request.data.get('leida', notif.leida)
        notif.save(update_fields=['leida'])
        return Response(NotificacionSerializer(notif).data)

    if request.method == 'DELETE':
        notif.delete()
        return Response({'mensaje': 'Notificación eliminada'}, status=status.HTTP_204_NO_CONTENT)
