from django.db import models
from apps.medicos.models import Medico


class Horario(models.Model):
    id_horario = models.BigAutoField(primary_key=True)
    id_medico = models.ForeignKey(Medico, on_delete=models.CASCADE, db_column='id_medico')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    disponible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'horarios'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(hora_fin__gt=models.F('hora_inicio')),
                name='check_hora_fin_gt_hora_inicio'
            ),
            models.UniqueConstraint(
                fields=['id_medico', 'fecha', 'hora_inicio', 'hora_fin'],
                name='unique_medico_fecha_horario'
            ),
        ]
        verbose_name = 'horario'
        verbose_name_plural = 'horarios'

    def __str__(self):
        return f'{self.id_medico} - {self.fecha} {self.hora_inicio}-{self.hora_fin}'
