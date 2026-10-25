from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_student, name='account_register'),
    path('login/', views.login_user, name='account_login'),
    path('logout/', views.logout_user, name='account_logout'),
    path('profile/', views.user_profile, name='account_profile'),
    path('verify-email/', views.verify_email, name='account_verify_email'),
    # Protected Admin Endpoints
    path('admin/overview/', views.admin_overview_stats, name='admin_overview'),
    path('admin/create-admin/', views.admin_create_admin, name='admin_create_admin'),
    path('admin/setup-status/', views.admin_setup_status, name='admin_setup_status'),
    path('admin/setup-first-admin/', views.admin_setup_first_admin, name='admin_setup_first_admin'),
]
