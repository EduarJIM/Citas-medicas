# Guía de Despliegue

## Desarrollo Local

### Backend

```bash
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python manage.py migrate
python seed_all.py
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Docker Compose (Desarrollo)

```bash
docker compose up --build
```

Servicios:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## Producción

### Base de Datos

Editar `config/settings.py` o usar variables de entorno:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'citas_medicas',
        'USER': 'postgres',
        'PASSWORD': 'password-seguro',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Requiere instalar `psycopg2`: `pip install psycopg2-binary`

### Variables de Entorno

```env
# .env (producción)
SECRET_KEY=generar-clave-segura
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
PUBLIC_URL=https://tudominio.com
FRONTEND_URL=https://tudominio.com

# Email (SMTP real)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.tuproveedor.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=notificaciones@tudominio.com
EMAIL_HOST_PASSWORD=password-seguro
DEFAULT_FROM_EMAIL=notificaciones@tudominio.com
```

### Build Frontend

```bash
cd frontend
npm run build
```

Los archivos estáticos se generan en `frontend/dist/`.

### Servir con Nginx + Gunicorn

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin {
        proxy_pass http://127.0.0.1:8000;
    }

    location /swagger {
        proxy_pass http://127.0.0.1:8000;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
    }

    location /static {
        alias /ruta/a/citas_medicas/staticfiles;
    }

    location / {
        root /ruta/a/citas_medicas/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Instalar Gunicorn
pip install gunicorn

# Ejecutar
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Docker Producción

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: citas_medicas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password-seguro
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - DEBUG=False
      - SECRET_KEY=clave-segura
      - ALLOWED_HOSTS=tudominio.com
      - DB_ENGINE=postgresql
      - DB_NAME=citas_medicas
      - DB_USER=postgres
      - DB_PASSWORD=password-seguro
      - DB_HOST=db
    depends_on:
      - db

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"

volumes:
  postgres_data:
```

## Seguridad

- Generar `SECRET_KEY` segura: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- Configurar HTTPS con Certbot/Let's Encrypt
- Deshabilitar DEBUG en producción
- Configurar CORS solo con orígenes permitidos
- Usar contraseñas seguras para la base de datos
- Rotar credenciales de email SMTP

## Mantenimiento

```bash
# Respaldo de base de datos
python manage.py dumpdata > respaldo.json

# Restaurar
python manage.py loaddata respaldo.json

# Recolectar archivos estáticos
python manage.py collectstatic

# Aplicar migraciones
python manage.py migrate
```
