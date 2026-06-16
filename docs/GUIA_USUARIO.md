# Guía de Usuario

## Visitante

- **Landing**: Página principal con información institucional, quiénes somos, mapa, redes sociales y normativas.
- **Registro**: Crear cuenta como paciente (nombre, documento, correo, teléfono, contraseña segura).
- **Inicio de sesión**: Acceder con correo y contraseña.
- **Recuperación**: Solicitar restablecimiento de contraseña vía email.

## Paciente

### Portal del Paciente
Al iniciar sesión, accedes a tu portal con:
- Tarjetas resumen de tus citas
- Citas vigentes (próximas)
- Historial de citas anteriores (filtrable)
- Acceso rápido a agendar nueva cita

### Agendar Cita
1. En el menú, selecciona **Agendar Cita**
2. Selecciona la **especialidad** médica
3. Selecciona un **médico** disponible
4. Elige una **fecha** con horarios disponibles
5. Selecciona un **horario** específico (slots de 30 min)
6. Opcional: agrega un **motivo** de consulta
7. Confirma la cita
8. Recibirás una notificación y un email de confirmación

### Mis Citas
- Vista en **tabla** con todas tus citas
- Vista en **calendario**
- Filtros por estado (pendiente, confirmada, realizada, cancelada)
- Acciones: **cancelar** (hasta 24h antes), **eliminar** (solo si ya está cancelada)

### Perfil
- Editar nombre y teléfono
- Cambiar contraseña

## Médico

### Panel del Médico (pestañas)
- **Resumen**: Estadísticas rápidas de tu agenda
- **Agenda de Hoy**: Citas del día con acciones rápidas
- **Mis Citas**: Todas tus citas con filtros
- **Disponibilidad**: Crear y eliminar slots horarios
- **Pacientes**: Lista de pacientes que has atendido
- **Perfil**: Editar consultorio y datos profesionales

### Gestionar Citas
- **Confirmar** una cita pendiente
- **Atender**: Marcar como "realizada" o "no asistió"
- **Cancelar**: Cancelar una cita (sin restricción horaria)

### Disponibilidad
- Crear bloques de horario con duración configurable
- Los slots se generan automáticamente en intervalos
- Eliminar slots individuales si es necesario

## Administrador

### Panel de Administración
- **Gestión de Médicos**: Crear, editar y desactivar médicos. Asignar especialidades.
- **Gestión de Especialidades**: Crear, editar y eliminar especialidades.
- **Reportes**: Ver estadísticas de citas por especialidad y tasa de no asistencia.
- **Exportar CSV**: Descargar todas las citas en formato CSV.

### Acceso Avanzado
- Panel de administración de Django en `/admin/`
- Documentación Swagger en `/swagger/`
- Documentación ReDoc en `/redoc/`
