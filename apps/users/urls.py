from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='auth-register'),
    path('login/', views.login, name='auth-login'),
    path('verify-email/', views.verify_email, name='auth-verify-email'),
    path('verify-email/<str:token>/', views.verify_email, name='auth-verify-email-token'),
    path('resend-verification/', views.resend_verification, name='auth-resend-verification'),
    path('password-reset/', views.password_reset_request, name='auth-password-reset'),
    path('password-reset/confirm/', views.password_reset_confirm, name='auth-password-reset-confirm'),
    path('usuarios/<int:pk>/', views.usuario_detail, name='usuario-detail'),
    path('usuarios/<int:pk>/delete/', views.usuario_delete, name='usuario-delete'),
    path('cambiar-password/', views.cambiar_password, name='auth-cambiar-password'),
]
