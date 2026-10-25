"""
Accounts API Views: Student Registration, Login, Logout, Profile Management & Email Verification
"""

import logging
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model, logout as django_logout
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import StudentProfile
from .permissions import IsAdminRole
from .serializers import (
    StudentRegisterSerializer,
    StudentProfileSerializer,
    StudentProfileUpdateSerializer,
    UserSerializer,
    LoginSerializer,
    AdminCreateSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()


def send_student_verification_email(user):
    """
    Safely sends a verification email using configured Django email backend.
    Logs to console if console backend is used, and fails silently without crashing registration.
    """
    token = user.verification_token
    subject = "SmartAttend AI — Verify your Student Account"
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        f"Thank you for registering on SmartAttend AI — College Event & Workshop Attendance System.\n\n"
        f"Please verify your account by clicking the link below or entering your token:\n"
        f"{verify_url}\n\n"
        f"Verification Token: {token}\n\n"
        f"Best regards,\nSmartAttend AI Administration"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Verification email dispatched for {user.email}")
        return True
    except Exception as exc:
        logger.warning(f"Could not send email to {user.email}: {exc}")
        return False


@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request):
    """
    Student Sign Up Endpoint
    POST /api/accounts/register/
    """
    serializer = StudentRegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Registration validation failed.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    profile = serializer.save()
    user = profile.user

    # Generate DRF Authentication Token for instant sign-in
    token, _ = Token.objects.get_or_create(user=user)

    # Attempt to send verification email
    email_sent = send_student_verification_email(user)

    profile_data = StudentProfileSerializer(profile).data

    return Response({
        "status": "success",
        "message": "Student registration completed successfully.",
        "token": token.key,
        "user": UserSerializer(user).data,
        "profile": profile_data,
        "email_verification": {
            "sent": email_sent,
            "mode": "SMTP" if "smtp" in settings.EMAIL_BACKEND.lower() else "Console / Dev",
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """
    User Login Endpoint (Student & Administrator)
    POST /api/accounts/login/
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Invalid login data.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    identifier = serializer.validated_data['identifier'].strip()
    password = serializer.validated_data['password']
    portal_type = serializer.validated_data.get('portal_type', 'student').strip().lower()

    # Locate user by email, username, or student_id
    user = None
    if '@' in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
    else:
        # Check by student_id in profile
        profile = StudentProfile.objects.filter(student_id__iexact=identifier).select_related('user').first()
        if profile:
            user = profile.user
        else:
            user = User.objects.filter(username__iexact=identifier).first()

    if user is None or not user.check_password(password):
        return Response({
            "status": "error",
            "message": "Invalid credentials. Please verify your Email/Username and Password.",
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            "status": "error",
            "message": "This account has been deactivated. Please contact college administration.",
        }, status=status.HTTP_403_FORBIDDEN)

    # Backend Role Enforcement: Reject students attempting to log in via Admin Portal
    if portal_type == 'admin' and not user.is_admin_role:
        return Response({
            "status": "error",
            "message": "Access Denied: Administrator privileges required. Student accounts cannot sign in through the Admin Portal.",
        }, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)

    # Attach profile data if student
    profile_data = None
    if hasattr(user, 'student_profile'):
        profile_data = StudentProfileSerializer(user.student_profile).data

    return Response({
        "status": "success",
        "message": f"Welcome back, {user.first_name or user.username}!",
        "token": token.key,
        "user": UserSerializer(user).data,
        "profile": profile_data,
        "role": user.role,
        "is_admin": user.is_admin_role,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    User Logout Endpoint
    POST /api/accounts/logout/
    """
    # Delete DRF authentication token
    try:
        Token.objects.filter(user=request.user).delete()
    except Exception as exc:
        logger.warning(f"Token deletion error during logout: {exc}")

    django_logout(request)

    return Response({
        "status": "success",
        "message": "Successfully logged out.",
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_profile(request):
    """
    Digital Profile Endpoint
    GET: Retrieve the authenticated user's digital profile
    PATCH/PUT: Safely update permitted student profile fields
    """
    user = request.user

    if request.method == 'GET':
        if hasattr(user, 'student_profile'):
            data = StudentProfileSerializer(user.student_profile).data
            return Response({
                "status": "success",
                "role": "student",
                "profile": data,
            }, status=status.HTTP_200_OK)

        # For Admin users without a student profile
        return Response({
            "status": "success",
            "role": user.role,
            "user": UserSerializer(user).data,
            "profile": None,
        }, status=status.HTTP_200_OK)

    elif request.method in ('PATCH', 'PUT'):
        if not hasattr(user, 'student_profile'):
            return Response({
                "status": "error",
                "message": "Only students have an editable Student Digital Profile.",
            }, status=status.HTTP_403_FORBIDDEN)

        profile = user.student_profile
        serializer = StudentProfileUpdateSerializer(
            instance=profile,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response({
                "status": "error",
                "message": "Profile update validation failed.",
                "errors": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_profile = serializer.save()
        fresh_data = StudentProfileSerializer(updated_profile).data

        return Response({
            "status": "success",
            "message": "Digital Profile updated successfully.",
            "profile": fresh_data,
        }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Email Verification Endpoint
    GET / POST /api/accounts/verify-email/?token=<token>
    """
    token = request.query_params.get('token') or request.data.get('token')
    if not token:
        return Response({
            "status": "error",
            "message": "Verification token is required.",
        }, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(verification_token=token.strip()).first()
    if not user:
        return Response({
            "status": "error",
            "message": "Invalid or expired verification token.",
        }, status=status.HTTP_404_NOT_FOUND)

    user.is_verified = True
    user.save(update_fields=['is_verified'])

    return Response({
        "status": "success",
        "message": f"Email address {user.email} verified successfully.",
        "user": UserSerializer(user).data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_overview_stats(request):
    """
    Protected Admin Dashboard Overview API.
    Rejects Students and unauthenticated requests with HTTP 403 / 401.
    """
    from events.models import Event
    from registrations.models import EventRegistration
    from attendance.models import AttendanceRecord

    total_students = StudentProfile.objects.count()
    verified_students = User.objects.filter(role=User.ROLE_STUDENT, is_verified=True).count()
    total_admins = User.objects.filter(
        models.Q(role=User.ROLE_ADMIN) | models.Q(is_superuser=True) | models.Q(is_staff=True)
    ).distinct().count()

    active_events = Event.objects.exclude(status='Cancelled').count()
    total_registrations = EventRegistration.objects.count()
    total_scanned = AttendanceRecord.objects.filter(verification_status='Verified').count()

    recent_profiles = StudentProfile.objects.select_related('user').order_by('-created_at')[:10]
    recent_list = [
        {
            "id": p.id,
            "student_id": p.student_id,
            "full_name": p.full_name,
            "email": p.email,
            "department": p.department,
            "course": p.course,
            "academic_year": p.academic_year,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in recent_profiles
    ]

    return Response({
        "status": "success",
        "admin_user": {
            "username": request.user.username,
            "email": request.user.email,
            "full_name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
            "role": request.user.role,
        },
        "stats": {
            "total_students": total_students,
            "verified_students": verified_students,
            "total_admins": total_admins,
            "active_events": active_events,
            "total_registrations": total_registrations,
            "total_scanned_attendances": total_scanned,
        },
        "recent_students": recent_list,
        "modules": {
            "dashboard": "Active (Admin Overview)",
            "manage_events": "Active (Campus Event Management)",
            "student_management": "Active (Student Registry)",
            "registrations": "Active (Event Registrations & Passes)",
            "qr_attendance": "Active (QR Gate Scanner)",
            "attendance_reports": "Active (CSV & Audit Logs)",
            "certificates": "Active (Certificate Management)",
            "settings": "Active (System & Security Settings)"
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_create_admin(request):
    """
    Secure Admin Provisioning Endpoint:
    Allows an authenticated Administrator to provision additional Administrator accounts.
    Enforces backend permissions (Rejects Students and unauthenticated callers).
    """
    serializer = AdminCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Administrator account creation failed.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    admin_user = serializer.save()
    return Response({
        "status": "success",
        "message": f"Administrator account '{admin_user.username}' created successfully.",
        "admin": {
            "id": admin_user.id,
            "username": admin_user.username,
            "email": admin_user.email,
            "full_name": f"{admin_user.first_name} {admin_user.last_name}".strip() or admin_user.username,
            "role": admin_user.role,
            "is_staff": admin_user.is_staff,
            "created_at": admin_user.created_at.isoformat() if admin_user.created_at else None,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_setup_status(request):
    """
    Checks if initial administrator setup is required.
    GET /api/accounts/admin/setup-status/
    """
    admin_count = User.objects.filter(
        models.Q(role=User.ROLE_ADMIN) | models.Q(is_superuser=True) | models.Q(is_staff=True)
    ).distinct().count()

    return Response({
        "status": "success",
        "needs_setup": admin_count == 0,
        "admin_count": admin_count,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_setup_first_admin(request):
    """
    Secure First-Time Initial Administrator Setup.
    Allows creation of the first institutional administrator account ONLY when 0 admins exist.
    Permanently locked once the first administrator has been initialized.
    POST /api/accounts/admin/setup-first-admin/
    """
    admin_count = User.objects.filter(
        models.Q(role=User.ROLE_ADMIN) | models.Q(is_superuser=True) | models.Q(is_staff=True)
    ).distinct().count()

    if admin_count > 0:
        return Response({
            "status": "error",
            "message": "Initial administrator has already been established. Public administrator setup is locked. Please sign in or ask an administrator to provision your account.",
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = AdminCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Administrator setup validation failed.",
            "errors": serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    admin_user = serializer.save()
    token, _ = Token.objects.get_or_create(user=admin_user)

    return Response({
        "status": "success",
        "message": f"First institutional Administrator '{admin_user.username}' created successfully!",
        "token": token.key,
        "user": UserSerializer(admin_user).data,
        "role": "admin",
        "is_admin": True,
    }, status=status.HTTP_201_CREATED)
