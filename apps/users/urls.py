from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='auth-register'),
    path('login/', views.login, name='auth-login'),
    path('password-reset/', views.password_reset_request, name='auth-password-reset'),
    path('password-reset/confirm/', views.password_reset_confirm, name='auth-password-reset-confirm'),
    path('usuarios/<int:pk>/', views.usuario_detail, name='usuario-detail'),
    path('usuarios/<int:pk>/delete/', views.usuario_delete, name='usuario-delete'),
]
