# Arquitectura del Sistema

## Actores

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Visitante     │     │   Paciente      │     │   Médico        │
│ (no auth)       │────>│ (rol=paciente)  │     │ (rol=medico)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                         ┌─────────────────┐              │
                         │   Admin         │<─────────────┘
                         │ (rol=admin)     │
                         └─────────────────┘
```

## Backend (Django)

### Estructura de Apps

```
config/
├── settings.py        # Configuración general
├── urls.py            # Enrutamiento principal
└── asgi.py / wsgi.py  # Puntos de entrada ASGI/WSGI

apps/
├── users/             # Usuario, Paciente, Roles, Autenticación JWT
│   ├── models.py      # Usuario (AbstractBaseUser), Paciente, Rol, Tokens
│   ├── views.py       # register, login, verify_email, password_reset
│   ├── serializers.py # RegistroSerializer, UsuarioSerializer
│   └── urls.py        # /api/auth/*
│
├── medicos/           # Médicos y Especialidades
│   ├── models.py      # Medico, Especialidad, MedicoEspecialidad
│   ├── views.py       # CRUD de médicos y especialidades
│   └── urls.py        # /api/medicos/*, /api/especialidades/*
│
├── horarios/          # Disponibilidad horaria
│   ├── models.py      # Horario (slots de 30 min)
│   ├── views.py       # disponibilidad CRUD, creación por bloques
│   └── urls.py        # /api/medicos/<pk>/disponibilidad/*
│
├── citas/             # Gestión de citas médicas
│   ├── models.py      # Cita, EstadoCita, AuditoriaCita
│   ├── views.py       # CRUD, confirmar, atender, eliminar, historial
│   └── urls.py        # /api/citas/*
│
├── notificaciones/    # Sistema de notificaciones
│   ├── models.py      # Notificacion
│   ├── views.py       # listar, crear, marcar leída, eliminar
│   └── urls.py        # /api/notificaciones/*
│
└── reportes/          # Reportes y exportación
    ├── views.py       # citas por especialidad, tasa no asistencia, CSV
    └── urls.py        # /api/reportes/*
```

### Flujo de Autenticación

```
1. Registro → POST /api/auth/register/
   → Crea usuario con email_verificado=False
   → Envía email con token de verificación
   → Responde: { mensaje: "Registro exitoso..." }

2. Verificar email → GET /verify-email/<token>/
   → Marca email_verificado=True
   → Muestra página de éxito/fracaso

3. Login → POST /api/auth/login/
   → Valida: activo, email_verificado, no bloqueado
   → 3 intentos fallidos → bloqueo 15 min
   → Éxito: responde con { access, refresh, usuario }
```

### Flujo de Agendamiento de Cita

```
1. GET  /api/especialidades/         → Lista especialidades
2. GET  /api/medicos/?especialidad=N → Filtra médicos
3. GET  /api/medicos/N/disponibilidad/?fecha=YYYY-MM-DD
                                      → Slots disponibles
4. POST /api/citas/ { id_horario, motivo }
   → Crea Cita (estado=pendiente)
   → Marca Horario como no disponible
   → Crea Notificación
   → Registra AuditoriaCita
   → Envía email
```

## Frontend (React)

### Estructura de Rutas

```
/                          Landing (público)
/login                     Inicio de sesión
/register                  Registro
/verify-email/:token       Verificación de email
/forgot-password           Recuperar contraseña
/reset-password/:token     Restablecer contraseña
/dashboard                 Portal según rol
  └─ rol=paciente          PacientePortal
  └─ rol=medico            DoctorDashboard
  └─ rol=admin             Dashboard genérico
/agendar                   Wizard de agendamiento
/mis-citas                 Lista de citas (tabla + calendario)
/admin                     Panel de administración
/perfil                    Editar perfil
/cambiar-password          Cambiar contraseña
/mis-pacientes             Pacientes del médico
/historial-paciente/:pk    Historial de paciente
```

### Flujo de Datos

```
React Component
    │
    ▼
AuthContext / useAuth()
    │
    ▼
api (Axios instance)
    │
    ├── Request Interceptor → añade Bearer token
    │
    ▼
Django REST API
    │
    ├── Response Interceptor → refresh automático en 401
    │
    ▼
Componente actualiza estado
```

## Seguridad

- JWT con refresh rotativo (access 90 min, refresh 1 día)
- Contraseñas: mínimo 8 chars, mayúscula, número, especial
- Bloqueo por 3 intentos fallidos (15 min)
- Verificación de email obligatoria antes del login
- Citas: cancelación con ventana de 24h para paciente
- Auditoría de todos los eventos sobre citas
