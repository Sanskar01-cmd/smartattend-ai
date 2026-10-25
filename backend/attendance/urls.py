from django.urls import path
from . import views

urlpatterns = [
    # Student Endpoints
    path('my-history/', views.my_attendance_history, name='my_attendance_history'),
    # Protected Admin Endpoints
    path('scan/', views.scan_qr_pass, name='scan_qr_pass'),
    path('reports/', views.admin_attendance_reports, name='admin_attendance_reports'),
    path('export-csv/', views.admin_export_attendance_csv, name='admin_export_attendance_csv'),
]
