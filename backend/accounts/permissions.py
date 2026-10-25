"""
Custom DRF Permissions for SmartAttend AI
"""

from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Permission class that grants access only to authenticated users with
    an Administrator role (role == 'admin', is_staff, or is_superuser).
    Rejects Students and unauthenticated requests.
    """
    message = "Access Denied: Administrator privileges are required to access this resource."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            (
                getattr(user, 'role', '') == 'admin' or
                getattr(user, 'is_staff', False) or
                getattr(user, 'is_superuser', False)
            )
        )
