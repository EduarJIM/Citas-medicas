from django.db import models
from apps.citas.models import Cita
from apps.users.models import Usuario

class Receta(models.Model):
    id_receta = models.BigAutoField(primary_key=True)
    id_cita = models.ForeignKey(Cita, on_delete=models.CASCADE, db_column='id_cita', related_name='recetas')
    medicamento = models.CharField(max_length=200)
    dosis = models.CharField(max_length=200)
    frecuencia = models.CharField(max_length=200, help_text="Ej: cada 8 horas")
    duracion = models.CharField(max_length=100, blank=True, default='')
    indicaciones = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recetas'
        verbose_name = 'Receta'
        verbose_name_plural = 'Recetas'

    def __str__(self):
        return f'{self.medicamento} - Cita #{self.id_cita_id}'
