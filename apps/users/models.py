from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class Rol(models.Model):
    id_rol = models.SmallAutoField(primary_key=True)
    nombre = models.CharField(max_length=30, unique=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'rol'
        verbose_name_plural = 'roles'

    def __str__(self):
        return self.nombre


class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('activo', True)
        rol_admin, _ = Rol.objects.get_or_create(nombre='admin')
        extra_fields.setdefault('id_rol', rol_admin)
        return self.create_user(correo, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    id_usuario = models.BigAutoField(primary_key=True)
    correo = models.EmailField(max_length=150, unique=True)
    password = models.CharField(
        max_length=255, db_column='password_hash'
    )
    nombre_completo = models.CharField(max_length=150)
    documento = models.CharField(max_length=30, unique=True)
    telefono = models.CharField(max_length=30, blank=True, default='')
    id_rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column='id_rol')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    intentos_fallidos = models.SmallIntegerField(default=0)
    bloqueado_hasta = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre_completo', 'documento']

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    def __str__(self):
        return f'{self.nombre_completo} ({self.correo})'

    def clean(self):
        super().clean()
        self.correo = self.__class__.objects.normalize_email(self.correo)


class Paciente(models.Model):
    id_paciente = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, primary_key=True, db_column='id_paciente'
    )
    fecha_nacimiento = models.DateField(null=True, blank=True)
    sexo = models.CharField(max_length=1, blank=True, default='')
    eps = models.CharField(max_length=120, blank=True, default='')
    alergias = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'pacientes'
        verbose_name = 'paciente'
        verbose_name_plural = 'pacientes'

    def __str__(self):
        return f'Paciente: {self.id_paciente.nombre_completo}'


class TokenRecuperacion(models.Model):
    id_token = models.BigAutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        Usuario, on_delete=models.CASCADE, db_column='id_usuario'
    )
    token = models.CharField(max_length=255, unique=True)
    expira_en = models.DateTimeField()
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = 'tokens_recuperacion'
        verbose_name = 'token de recuperación'
        verbose_name_plural = 'tokens de recuperación'

    def __str__(self):
        return f'Token {self.id_usuario.correo}'
