"""
SmartAttend AI URL Configuration
"""

import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.static import serve


def serve_react_app(request):
    """Serve the compiled React Vite single page application"""
    index_file = settings.FRONTEND_DIST_DIR / 'index.html'
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        "<h1>SmartAttend AI Backend Active</h1><p>Frontend production bundle compiling...</p>",
        content_type='text/html'
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    # Core API endpoints (Health check, root status)
    path('api/', include('core.urls')),
    # Domain module endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/events/', include('events.urls')),
    path('api/registrations/', include('registrations.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/ai/', include('ai_assistant.urls')),
]

# Assets routing for production Vite frontend
if hasattr(settings, 'FRONTEND_DIST_DIR') and (settings.FRONTEND_DIST_DIR / 'assets').exists():
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.FRONTEND_DIST_DIR / 'assets'}),
    ]

# SPA Catch-all: send all other requests to React index.html
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|static/).*$', serve_react_app, name='react_spa'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
