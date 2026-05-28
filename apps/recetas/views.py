from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Receta
from .serializers import RecetaSerializer
from apps.citas.models import Cita

@api_view(['GET', 'POST'])
def receta_list_create(request):
    if request.method == 'GET':
        if request.user.is_superuser:
            recetas = Receta.objects.all()
        elif hasattr(request.user, 'medico'):
            from apps.medicos.models import Medico
            try:
                medico = Medico.objects.get(pk=request.user.id_usuario)
                recetas = Receta.objects.filter(id_cita__id_horario__id_medico=medico)
            except Medico.DoesNotExist:
                recetas = Receta.objects.none()
        else:
            recetas = Receta.objects.filter(id_cita__id_paciente=request.user)

        return Response(RecetaSerializer(recetas, many=True).data)

    if request.method == 'POST':
        try:
            from apps.medicos.models import Medico
            medico = Medico.objects.get(pk=request.user.id_usuario)
        except Medico.DoesNotExist:
            return Response({'error': 'Solo médicos pueden crear recetas'}, status=status.HTTP_403_FORBIDDEN)

        cita = Cita.objects.select_related('id_horario__id_medico').get(
            pk=request.data.get('id_cita')
        )
        if cita.id_horario.id_medico != medico and not request.user.is_superuser:
            return Response({'error': 'No puedes recetar en esta cita'}, status=status.HTTP_403_FORBIDDEN)

        serializer = RecetaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'DELETE'])
def receta_detail(request, pk):
    try:
        receta = Receta.objects.get(pk=pk)
    except Receta.DoesNotExist:
        return Response({'error': 'Receta no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(RecetaSerializer(receta).data)

    if request.method == 'DELETE':
        receta.delete()
        return Response({'mensaje': 'Receta eliminada'})
