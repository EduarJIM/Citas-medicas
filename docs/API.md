# API REST

Base URL: `/api`

## Autenticación

### Registro
```
POST /auth/register/
Body: { nombre_completo, documento, correo, telefono, password, password2 }
Resp: 201 { mensaje: "Registro exitoso. Revisa tu correo para verificar tu cuenta." }
```

### Login
```
POST /auth/login/
Body: { correo, password }
Resp: 200 { access, refresh, usuario: { id_usuario, correo, nombre_completo, rol, ... } }
Resp: 403 { error: "Debes verificar tu correo..." } (si no verificado)
Resp: 423 { error: "Cuenta bloqueada...", bloqueado, segundos_restantes }
```

### Verificar Email
```
GET  /auth/verify-email/<token>/
Resp: HTML (éxito/fracaso)
```

### Recuperar Contraseña
```
POST /auth/password-reset/
Body: { correo }
Resp: 200 { mensaje }
```

```
POST /auth/password-reset/confirm/
Body: { token, password, password2 }
Resp: 200 { mensaje }
```

### Cambiar Contraseña (autenticado)
```
POST /auth/cambiar-password/
Body: { password, password2 }
Resp: 200 { mensaje }
```

### Perfil
```
GET  /auth/usuarios/<pk>/   → datos del usuario
PUT  /auth/usuarios/<pk>/   → actualizar nombre, teléfono
```

## Médicos

```
GET    /medicos/                  → lista (filtro: ?especialidad=N)
POST   /medicos/                  → crear (admin)
GET    /medicos/<pk>/             → detalle
PUT    /medicos/<pk>/             → editar (médico propio o admin)
DELETE /medicos/<pk>/             → desactivar (admin)
GET    /medicos/mi-perfil/        → perfil del médico autenticado
GET    /especialidades/            → lista
POST   /especialidades/            → crear (admin)
PUT    /especialidades/<pk>/       → editar (admin)
DELETE /especialidades/<pk>/       → eliminar (admin)
```

## Disponibilidad

```
GET    /medicos/<pk>/disponibilidad/          → slots (filtro: ?fecha=YYYY-MM-DD)
POST   /medicos/<pk>/disponibilidad/create/   → crear bloques
Body: { fecha, hora_inicio, hora_fin, duracion_minutos }
Resp: { created: [...], errors: [...] }

PUT    /medicos/<pk>/disponibilidad/<pk>/     → editar slot
DELETE /medicos/<pk>/disponibilidad/<pk>/     → eliminar slot
```

## Citas

```
GET    /citas/                        → lista (filtro: ?estado=pendiente&fecha=...)
POST   /citas/                        → crear
Body: { id_horario, motivo }

GET    /citas/<pk>/                   → detalle
PUT    /citas/<pk>/                   → reprogramar
DELETE /citas/<pk>/                   → cancelar

PATCH  /citas/<pk>/confirmar/         → confirmar (médico)
PATCH  /citas/<pk>/atender/           → atender (médico)
Body: { accion: "realizada" | "no_asistio" }

DELETE /citas/<pk>/eliminar/          → eliminar (solo si cancelada)

GET    /citas/mis-pacientes/          → agenda del día (médico)
GET    /citas/mis-citas-medico/       → todas las citas (médico)
GET    /citas/pacientes-medico/       → pacientes del médico
GET    /pacientes/<pk>/historial/     → historial del paciente
```

## Notificaciones

```
GET    /notificaciones/               → lista (filtro: ?leida=true)
POST   /notificaciones/               → crear
PUT    /notificaciones/<pk>/          → marcar leída
DELETE /notificaciones/<pk>/          → eliminar
```

## Reportes

```
GET /reportes/citas-por-especialidad/   → estadísticas (admin)
GET /reportes/tasa-no-asistencia/       → tasa por médico (admin)
GET /reportes/exportar/csv/             → descargar CSV (admin)
```

## Tokens JWT

```
POST /token/           → { access, refresh }
POST /token/refresh/   → { access }
```

## Documentación

```
/swagger/   → Swagger UI
/redoc/     → ReDoc UI
/admin/     → Admin Django
```

## Ejemplos

### Registrar paciente
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"correo":"juan@email.com","password":"Pass1234!","password2":"Pass1234!","nombre_completo":"Juan Pérez","documento":"12345","telefono":"3001234567"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo":"paciente@test.com","password":"Pass1234!"}'
```

### Agendar cita (con token JWT)
```bash
TOKEN="eyJ..."
curl -X POST http://localhost:8000/api/citas/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id_horario":1,"motivo":"Control general"}'
```

### Listar médicos por especialidad
```bash
curl "http://localhost:8000/api/medicos/?especialidad=1"
```
