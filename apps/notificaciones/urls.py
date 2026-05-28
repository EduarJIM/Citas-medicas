from django.urls import path
from . import views

urlpatterns = [
    path('notificaciones/', views.notificacion_list_create, name='notificacion-list-create'),
    path('notificaciones/<int:pk>/', views.notificacion_detail, name='notificacion-detail'),
]
