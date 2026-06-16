# Sistema de Gestión de Citas Médicas

Plataforma web para agendar, gestionar y administrar citas médicas online. Desarrollada con **Django REST Framework** (backend) y **React** (frontend).

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.13, Django 6.0, DRF 3.17 |
| Frontend | React 19, Vite 8, React Router 7 |
| Autenticación | JWT (SimpleJWT) |
| Base de datos | SQLite3 (dev) / PostgreSQL (prod) |
| Contenedores | Docker + Docker Compose |
| Documentación API | Swagger + ReDoc |

## Requisitos

- Python 3.12+
- Node.js 20+
- Opcional: Docker + Docker Compose

## Inicio Rápido

### 1. Clonar e instalar backend

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python seed_all.py
```

### 2. Iniciar backend

```bash
python manage.py runserver
```http://localhost:8000/

### 3. Instalar e iniciar frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173

### Con Docker

```bash
docker compose up --build
```

## Usuarios de Prueba

| Rol | Correo | Contraseña |
|-----|--------|-----------|
| Admin | admin@citas.com | Admin123! |
| Médico | md1001@clinica.com | Medico123! |
| Paciente | paciente@test.com | Pass1234! |

Hay 12 médicos con distintas especialidades (md1001 a md1012).

## Variables de Entorno (`.env`)

```
SECRET_KEY=clave-segura
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
PUBLIC_URL=http://localhost:5173
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Comandos Útiles

```bash
# Ejecutar tests backend
pytest

# Ejecutar tests frontend
cd frontend && npm test

# Poblar datos de ejemplo
python seed_all.py

# Verificar datos cargados
python check_data.py

# Build frontend
cd frontend && npm run build
```

## Estructura del Proyecto

```
citas_medicas/
├── apps/               # Aplicaciones Django
│   ├── users/          # Usuarios, roles, autenticación
│   ├── medicos/        # Médicos y especialidades
│   ├── horarios/       # Disponibilidad de médicos
│   ├── citas/          # Gestión de citas
│   ├── notificaciones/ # Notificaciones internas + email
│   └── reportes/       # Reportes y exportación CSV
├── config/             # Configuración Django
├── frontend/           # Aplicación React
│   └── src/
│       ├── pages/      # Componentes de página
│       ├── components/ # Componentes reutilizables
│       ├── context/    # Contexto de autenticación
│       └── api/        # Cliente Axios con JWT
├── docs/               # Documentación
├── manage.py
├── seed_all.py
└── docker-compose.yml
```

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [Guía de Usuario](docs/GUIA_USUARIO.md)
- [API](docs/API.md)
- [Despliegue](docs/DEPLOY.md)
