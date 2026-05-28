from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title='Sistema de Gestión de Citas Médicas API',
        default_version='v1',
        description='API REST para el sistema de gestión de citas médicas online',
        contact=openapi.Contact(email='admin@citasmedicas.com'),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/', include('apps.medicos.urls')),
    path('api/', include('apps.horarios.urls')),
    path('api/', include('apps.citas.urls')),
    path('api/', include('apps.notificaciones.urls')),
    path('api/', include('apps.reportes.urls')),
    path('api/', include('apps.recetas.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Swagger
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
