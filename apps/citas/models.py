from django.db import models
from apps.users.models import Usuario
from apps.horarios.models import Horario


class EstadoCita(models.Model):
    id_estado = models.SmallAutoField(primary_key=True)
    nombre = models.CharField(max_length=40, unique=True)

    class Meta:
        db_table = 'estados_cita'
        verbose_name = 'estado de cita'
        verbose_name_plural = 'estados de cita'

    def __str__(self):
        return self.nombre


class Cita(models.Model):
    id_cita = models.BigAutoField(primary_key=True)
    id_paciente = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_paciente',
        related_name='citas_como_paciente'
    )
    id_horario = models.OneToOneField(
        Horario, on_delete=models.CASCADE, db_column='id_horario'
    )
    id_estado = models.ForeignKey(
        EstadoCita, on_delete=models.PROTECT, db_column='id_estado', default=1
    )
    motivo = models.CharField(max_length=255, blank=True, default='')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    cancelada_por = models.CharField(
        max_length=10, null=True, blank=True,
        choices=[('paciente', 'Paciente'), ('medico', 'Médico'), ('admin', 'Admin')]
    )
    fecha_cancelacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'citas'
        verbose_name = 'cita'
        verbose_name_plural = 'citas'

    def __str__(self):
        return f'Cita #{self.id_cita} - {self.id_paciente}'


class AuditoriaCita(models.Model):
    id_auditoria = models.BigAutoField(primary_key=True)
    id_cita = models.ForeignKey(Cita, on_delete=models.CASCADE, db_column='id_cita')
    evento = models.CharField(max_length=40)
    detalle = models.TextField(blank=True, default='')
    actor_id_usuario = models.ForeignKey(
        Usuario, on_delete=models.SET_NULL, null=True, db_column='actor_id_usuario'
    )
    fecha_evento = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auditoria_citas'
        verbose_name = 'auditoría de cita'
        verbose_name_plural = 'auditorías de citas'

    def __str__(self):
        return f'{self.evento} - Cita #{self.id_cita_id}'
