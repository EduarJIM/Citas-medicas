from django.urls import path
from . import views

urlpatterns = [
    path('reportes/citas-por-especialidad/', views.reporte_citas_por_especialidad, name='reporte-citas-especialidad'),
    path('reportes/tasa-no-asistencia/', views.reporte_tasa_no_asistencia, name='reporte-tasa-no-asistencia'),
]
