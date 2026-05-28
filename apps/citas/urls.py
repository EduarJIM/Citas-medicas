from django.urls import path
from . import views

urlpatterns = [
    path('citas/', views.cita_list_create, name='cita-list-create'),
    path('citas/mis-pacientes/', views.mis_pacientes, name='cita-mis-pacientes'),
    path('citas/<int:pk>/', views.cita_detail, name='cita-detail'),
    path('citas/<int:pk>/confirmar/', views.confirmar_cita, name='cita-confirmar'),
    path('citas/<int:pk>/atender/', views.atender_cita, name='cita-atender'),
    path('citas/<int:pk>/eliminar/', views.eliminar_cita, name='cita-eliminar'),
    path('pacientes/<int:pk>/historial/', views.historial_paciente, name='historial-paciente'),
]
