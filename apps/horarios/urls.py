from django.urls import path
from . import views

urlpatterns = [
    path('medicos/<int:medico_pk>/disponibilidad/', views.disponibilidad_list, name='disponibilidad-list'),
    path('medicos/<int:medico_pk>/disponibilidad/create/', views.disponibilidad_create, name='disponibilidad-create'),
    path('medicos/<int:medico_pk>/disponibilidad/<int:pk>/', views.disponibilidad_detail, name='disponibilidad-detail'),
]
