from django.urls import path
from . import views

urlpatterns = [
    path('recetas/', views.receta_list_create, name='receta-list-create'),
    path('recetas/<int:pk>/', views.receta_detail, name='receta-detail'),
]
