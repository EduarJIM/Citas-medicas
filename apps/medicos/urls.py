from django.urls import path
from . import views

urlpatterns = [
    path('medicos/', views.medico_list_create, name='medico-list-create'),
    path('medicos/mi-perfil/', views.mi_perfil_medico, name='medico-mi-perfil'),
    path('medicos/<int:pk>/', views.medico_detail, name='medico-detail'),
    path('especialidades/', views.especialidad_list_create, name='especialidad-list-create'),
    path('especialidades/<int:pk>/', views.especialidad_detail, name='especialidad-detail'),
]
