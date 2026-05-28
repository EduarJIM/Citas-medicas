from django.db import models
from apps.users.models import Usuario


class Medico(models.Model):
    id_medico = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, primary_key=True, db_column='id_medico'
    )
    registro_profesional = models.CharField(max_length=60, blank=True, default='')
    consultorio = models.CharField(max_length=60, blank=True, default='')
    estado = models.CharField(max_length=20, default='activo')

    class Meta:
        db_table = 'medicos'
        verbose_name = 'médico'
        verbose_name_plural = 'médicos'

    def __str__(self):
        return f'Dr. {self.id_medico.nombre_completo}'


class Especialidad(models.Model):
    id_especialidad = models.SmallAutoField(primary_key=True)
    nombre = models.CharField(max_length=120, unique=True)

    class Meta:
        db_table = 'especialidades'
        verbose_name = 'especialidad'
        verbose_name_plural = 'especialidades'

    def __str__(self):
        return self.nombre


class MedicoEspecialidad(models.Model):
    id_medico = models.ForeignKey(Medico, on_delete=models.CASCADE, db_column='id_medico')
    id_especialidad = models.ForeignKey(Especialidad, on_delete=models.CASCADE, db_column='id_especialidad')

    class Meta:
        db_table = 'medico_especialidad'
        unique_together = ('id_medico', 'id_especialidad')
        verbose_name = 'médico-especialidad'
        verbose_name_plural = 'médicos-especialidades'

    def __str__(self):
        return f'{self.id_medico} - {self.id_especialidad}'
