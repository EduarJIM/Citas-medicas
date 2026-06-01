from django.contrib import admin
from .models import Rol, Usuario, Paciente, TokenRecuperacion, TokenVerificacion


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id_rol', 'nombre')


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id_usuario', 'correo', 'nombre_completo', 'documento',
                    'activo', 'email_verificado', 'is_staff')
    list_filter = ('activo', 'email_verificado', 'is_staff', 'id_rol')
    search_fields = ('correo', 'nombre_completo', 'documento')
    fieldsets = (
        (None, {'fields': ('correo', 'password')}),
        ('Información personal', {'fields': ('nombre_completo', 'documento', 'telefono')}),
        ('Verificación', {'fields': ('email_verificado',)}),
        ('Roles y permisos', {'fields': ('id_rol', 'activo', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('id_paciente', 'eps', 'sexo')


@admin.register(TokenRecuperacion)
class TokenRecuperacionAdmin(admin.ModelAdmin):
    list_display = ('id_token', 'id_usuario', 'usado', 'expira_en')


@admin.register(TokenVerificacion)
class TokenVerificacionAdmin(admin.ModelAdmin):
    list_display = ('id_token', 'id_usuario', 'usado', 'expira_en')
    list_filter = ('usado',)
    search_fields = ('id_usuario__correo',)
