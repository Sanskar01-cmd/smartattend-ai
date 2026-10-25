"""
Registrations & QR Pass API Views for SmartAttend AI
"""

import logging
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from accounts.models import StudentProfile
from events.models import Event
from .models import EventRegistration, Certificate
from .serializers import (
    EventRegistrationSerializer,
    CertificateSerializer,
    IssueCertificateSerializer,
)

logger = logging.getLogger(__name__)


def send_registration_pass_email(registration):
    """
    Sends pass confirmation email to student with their unique QR Pass token.
    Returns structured delivery metadata: status ('delivered', 'dev_console', 'unconfigured', 'failed').
    """
    student = registration.student
    event = registration.event
    backend_name = getattr(settings, 'EMAIL_BACKEND', '')
    is_console = 'console' in backend_name.lower()

    # Check if SMTP is specified but no host user is provided
    if 'smtp' in backend_name.lower() and not getattr(settings, 'EMAIL_HOST_USER', None):
        logger.info(f"Email delivery skipped for {student.email}: SMTP credentials not configured.")
        return {
            "status": "unconfigured",
            "recipient": student.email,
            "message": "SMTP credentials not configured in environment. Digital Pass is available in dashboard."
        }

    subject = f"SmartAttend AI — QR Pass: {event.title}"
    body = (
        f"Hello {student.full_name},\n\n"
        f"You have successfully registered for {event.title}!\n\n"
        f"--- Event Pass Details ---\n"
        f"Event: {event.title} ({event.category})\n"
        f"Date: {event.date} at {event.time}\n"
        f"Venue: {event.venue}\n"
        f"QR Pass Token: {registration.pass_token}\n\n"
        f"Present your Digital QR Pass on your mobile device at the entrance gate for instant scanner check-in.\n\n"
        f"Best regards,\nSmartAttend AI Event Administration"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[student.email],
            fail_silently=False,
        )
        if is_console:
            logger.info(f"QR Pass email logged to development console for {student.email} ({event.title})")
            return {
                "status": "dev_console",
                "recipient": student.email,
                "message": "Pass email printed to server development console."
            }
        logger.info(f"QR Pass email sent to {student.email} for {event.title}")
        return {
            "status": "delivered",
            "recipient": student.email,
            "message": f"Pass confirmation email delivered to {student.email}."
        }
    except Exception as exc:
        logger.warning(f"Could not send QR pass email to {student.email}: {exc}")
        return {
            "status": "failed",
            "recipient": student.email,
            "message": f"Email delivery failed: {str(exc)}"
        }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_for_event(request):
    """
    Student One-Click Event Registration Endpoint
    POST /api/registrations/register/
    Payload: { "event_id": 1 }
    """
    if not hasattr(request.user, 'student_profile'):
        return Response({
            "status": "error",
            "message": "Only registered students can obtain event QR passes."
        }, status=status.HTTP_403_FORBIDDEN)

    student = request.user.student_profile
    event_id = request.data.get('event_id')

    if not event_id:
        return Response({
            "status": "error",
            "message": "event_id is required."
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({
            "status": "error",
            "message": "The selected event does not exist."
        }, status=status.HTTP_404_NOT_FOUND)

    if event.status == 'Cancelled':
        return Response({
            "status": "error",
            "message": "This event has been cancelled by administration."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check existing registration
    existing = EventRegistration.objects.filter(student=student, event=event).first()
    if existing:
        if existing.status == 'Cancelled':
            existing.status = 'Confirmed'
            existing.save(update_fields=['status'])
            return Response({
                "status": "success",
                "message": "Your registration has been reactivated.",
                "registration": EventRegistrationSerializer(existing, context={'request': request}).data
            }, status=status.HTTP_200_OK)
        return Response({
            "status": "info",
            "message": "You are already registered for this event.",
            "registration": EventRegistrationSerializer(existing, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    # Capacity check
    if event.is_full:
        return Response({
            "status": "error",
            "message": f"This event has reached full capacity ({event.capacity} seats)."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create new registration & QR pass
    registration = EventRegistration.objects.create(
        student=student,
        event=event,
        status='Confirmed'
    )

    # Send QR pass confirmation email
    email_delivery = send_registration_pass_email(registration)

    serializer = EventRegistrationSerializer(registration, context={'request': request})
    return Response({
        "status": "success",
        "message": f"Registered successfully for {event.title}! QR Pass has been generated.",
        "registration": serializer.data,
        "email_dispatched": email_delivery["status"] in ["delivered", "dev_console"],
        "email_delivery": email_delivery,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_passes(request):
    """
    Student QR Passes Endpoint.
    Strictly restricted: Students can only view their own passes!
    GET /api/registrations/my-passes/
    """
    if not hasattr(request.user, 'student_profile'):
        return Response({
            "status": "error",
            "message": "Digital passes are reserved for registered students."
        }, status=status.HTTP_403_FORBIDDEN)

    student = request.user.student_profile
    registrations = EventRegistration.objects.filter(
        student=student,
        status__in=['Confirmed', 'Attended']
    ).select_related('event', 'student').order_by('-registered_at')

    count = len(registrations) if isinstance(registrations, list) else registrations.count()
    serializer = EventRegistrationSerializer(registrations, many=True, context={'request': request})
    return Response({
        "status": "success",
        "count": count,
        "passes": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_my_registration(request, pk):
    """
    Student cancels their own event registration
    POST /api/registrations/cancel/<int:pk>/
    """
    if not hasattr(request.user, 'student_profile'):
        return Response({
            "status": "error",
            "message": "Only students can manage personal registrations."
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        registration = EventRegistration.objects.get(pk=pk, student=request.user.student_profile)
    except EventRegistration.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Registration record not found or does not belong to you."
        }, status=status.HTTP_404_NOT_FOUND)

    registration.status = 'Cancelled'
    registration.save(update_fields=['status'])

    return Response({
        "status": "success",
        "message": f"Registration for '{registration.event.title}' cancelled."
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    """
    Student Certificates Endpoint.
    Strictly restricted: Students can only see their own certificates!
    GET /api/registrations/my-certificates/
    """
    if not hasattr(request.user, 'student_profile'):
        return Response({
            "status": "error",
            "message": "Certificates are reserved for registered students."
        }, status=status.HTTP_403_FORBIDDEN)

    student = request.user.student_profile
    certs = Certificate.objects.filter(student=student, status='Issued').select_related('event', 'student')
    count = len(certs) if isinstance(certs, list) else certs.count()
    serializer = CertificateSerializer(certs, many=True, context={'request': request})
    return Response({
        "status": "success",
        "count": count,
        "certificates": serializer.data
    }, status=status.HTTP_200_OK)


# --- Protected Admin Endpoints ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_all_registrations(request):
    """
    Admin Endpoint: View all campus event registrations
    GET /api/registrations/all/
    """
    registrations = EventRegistration.objects.select_related('student', 'event').all().order_by('-registered_at')
    
    event_id = request.query_params.get('event_id')
    if event_id:
        registrations = registrations.filter(event_id=event_id)

    status_filter = request.query_params.get('status')
    if status_filter:
        registrations = registrations.filter(status=status_filter)

    count = len(registrations) if isinstance(registrations, list) else registrations.count()
    serializer = EventRegistrationSerializer(registrations, many=True, context={'request': request})
    return Response({
        "status": "success",
        "count": count,
        "registrations": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_issue_certificate(request):
    """
    Admin Endpoint: Issue verified certificate to an attendee
    POST /api/registrations/issue-certificate/
    """
    serializer = IssueCertificateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    student_id = serializer.validated_data['student_id'].strip()
    event_id = serializer.validated_data['event_id']
    grade = serializer.validated_data.get('grade', 'Distinction')

    student = StudentProfile.objects.filter(student_id__iexact=student_id).first()
    if not student:
        return Response({
            "status": "error",
            "message": f"Student with ID '{student_id}' not found."
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({
            "status": "error",
            "message": "Event not found."
        }, status=status.HTTP_404_NOT_FOUND)

    cert_title = serializer.validated_data.get('title') or f"Certificate of Participation - {event.title}"

    certificate, created = Certificate.objects.get_or_create(
        student=student,
        event=event,
        defaults={
            'title': cert_title,
            'grade_or_score': grade,
            'status': 'Issued',
        }
    )

    return Response({
        "status": "success",
        "message": f"Certificate {'issued' if created else 'already issued'} for {student.full_name}.",
        "certificate": CertificateSerializer(certificate, context={'request': request}).data
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
