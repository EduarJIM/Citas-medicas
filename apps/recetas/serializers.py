from rest_framework import serializers
from .models import Receta

class RecetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receta
        fields = '__all__'
        read_only_fields = ('id_receta', 'created_at')
