from django.urls import path
from . import views

urlpatterns = [
    path('', views.events_list_or_create, name='events_list_or_create'),
    path('<int:pk>/', views.event_detail_manage, name='event_detail_manage'),
    path('<int:pk>/cancel/', views.event_cancel, name='event_cancel'),
]
