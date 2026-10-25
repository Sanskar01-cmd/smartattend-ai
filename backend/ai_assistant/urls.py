from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.ai_assistant_query, name='ai_assistant_query'),
]
