"""
Core API Views: Health check, API directory, and global error handling
"""

from datetime import datetime
from django.db import connections
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework import status

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint: Verifies service vitality and MySQL connectivity status.
    Endpoint: /api/health/
    """
    db_status = "untested"
    db_details = ""
    db_conn = connections['default']
    db_engine = db_conn.settings_dict.get('ENGINE', 'django.db.backends.sqlite3')
    is_sqlite = 'sqlite' in db_engine

    try:
        db_conn.cursor()
        db_status = "connected"
        if is_sqlite:
            db_details = f"Successfully connected to SQLite database ({db_conn.settings_dict.get('NAME')}). To use MySQL, set DB_ENGINE=mysql and DB_PASSWORD in backend/.env."
        else:
            db_details = f"Successfully connected to MySQL database '{db_conn.settings_dict.get('NAME')}' at {db_conn.settings_dict.get('HOST')}:{db_conn.settings_dict.get('PORT')}"
    except OperationalError as exc:
        db_status = "disconnected"
        db_details = f"Database connection pending. Error: {str(exc)}. Please ensure database is running and credentials in .env are correct."
    except Exception as exc:
        db_status = "error"
        db_details = f"Unexpected database error: {str(exc)}"

    return Response({
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "SmartAttend AI Backend",
        "description": "College Event & Workshop Attendance Management System",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": {
            "configured_engine": db_engine,
            "connection_status": db_status,
            "details": db_details,
            "note": "Local SQLite active for zero-config development. MySQL ready in .env." if is_sqlite else "MySQL configured in .env."
        },
        "modules": {
            "accounts": "Active (Student & Admin Auth)",
            "events": "Active (Event Scheduling)",
            "registrations": "Active (QR Pass Generation)",
            "attendance": "Active (QR Gate Scanner)",
            "ai_assistant": "Active (Event Intelligence)"
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Root API directory listing endpoints and system status.
    Endpoint: /api/
    """
    return Response({
        "project": "SmartAttend AI API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health/",
            "accounts": "/api/accounts/",
            "events": "/api/events/",
            "registrations": "/api/registrations/",
            "attendance": "/api/attendance/",
            "ai": "/api/ai/"
        },
        "documentation": "SmartAttend AI College Capstone Project"
    })


def custom_exception_handler(exc, context):
    """
    Custom exception handler to standardize DRF JSON error responses
    and gracefully report database connection errors.
    """
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "status": "error",
            "status_code": response.status_code,
            "error_detail": response.data,
            "path": context.get('request').path if context.get('request') else None
        }
    else:
        from django.db.utils import OperationalError, DatabaseError
        if isinstance(exc, (OperationalError, DatabaseError)):
            return Response({
                "status": "error",
                "message": f"Database connection error: {str(exc)}. Please check your database settings or credentials in backend/.env.",
                "error_detail": str(exc),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return response
