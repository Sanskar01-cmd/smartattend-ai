from django.urls import path
from . import views

urlpatterns = [
    # Student Endpoints
    path('register/', views.register_for_event, name='register_for_event'),
    path('my-passes/', views.my_passes, name='my_passes'),
    path('my-certificates/', views.my_certificates, name='my_certificates'),
    path('cancel/<int:pk>/', views.cancel_my_registration, name='cancel_my_registration'),
    # Protected Admin Endpoints
    path('all/', views.admin_all_registrations, name='admin_all_registrations'),
    path('issue-certificate/', views.admin_issue_certificate, name='admin_issue_certificate'),
]
