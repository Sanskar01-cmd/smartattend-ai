"""
Attendance API Views: Strictly QR-Only Attendance Scanner & Audit Logs
"""

import csv
import logging
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from registrations.models import EventRegistration, Certificate
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer, QRScanRequestSerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def scan_qr_pass(request):
    """
    Admin Gate QR Scanner Check-in Endpoint.
    Strictly QR Matrix verification. Rejects duplicate scans.
    POST /api/attendance/scan/
    """
    serializer = QRScanRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "message": "Invalid scanner payload.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    raw_token = serializer.validated_data['pass_token'].strip()
    device_info = serializer.validated_data.get('device_info', 'Institutional Gate Scanner')

    # Handle composite payload if student scanned full string (e.g. SMARTATTEND:SA-PASS-XXX:...)
    clean_token = raw_token
    if raw_token.startswith('SMARTATTEND:'):
        parts = raw_token.split(':')
        if len(parts) >= 2:
            clean_token = parts[1]

    with transaction.atomic():
        # Query registration with select_for_update to prevent concurrent double-scans
        registration = EventRegistration.objects.select_for_update().filter(
            pass_token=clean_token
        ).select_related('student', 'event').first()

        if not registration:
            return Response({
                "status": "error",
                "verification_status": "Invalid_Token",
                "message": f"QR Pass Token '{clean_token}' not found in college event database.",
            }, status=status.HTTP_404_NOT_FOUND)

        # Check if event was cancelled
        if registration.event.status == 'Cancelled':
            return Response({
                "status": "error",
                "verification_status": "Event_Cancelled",
                "message": f"Event '{registration.event.title}' has been cancelled by administration.",
                "student_name": registration.student.full_name,
                "student_id": registration.student.student_id,
                "event_title": registration.event.title,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if registration was cancelled
        if registration.status == 'Cancelled':
            return Response({
                "status": "error",
                "verification_status": "Registration_Cancelled",
                "message": f"Registration for {registration.student.full_name} was previously cancelled.",
                "student_name": registration.student.full_name,
                "student_id": registration.student.student_id,
                "event_title": registration.event.title,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check for Duplicate Scan (Anti-Passback Protection)
        existing_scan = AttendanceRecord.objects.select_for_update().filter(
            registration=registration,
            verification_status='Verified'
        ).first()

        if existing_scan:
            # Log duplicate attempt for security audit
            AttendanceRecord.objects.create(
                registration=registration,
                scanned_by=request.user,
                device_info=device_info,
                verification_status='Duplicate_Attempt',
                notes=f"Duplicate attempt blocked. First verified at {existing_scan.verified_at.strftime('%H:%M:%S')}"
            )
            return Response({
                "status": "duplicate",
                "verification_status": "Duplicate_Attempt",
                "message": f"DUPLICATE PASS DETECTED: {registration.student.full_name} ({registration.student.student_id}) was already checked in at {existing_scan.verified_at.strftime('%I:%M %p')}.",
                "student_name": registration.student.full_name,
                "student_id": registration.student.student_id,
                "event_title": registration.event.title,
                "first_verified_at": existing_scan.verified_at.isoformat(),
            }, status=status.HTTP_409_CONFLICT)

        # Verify student attendance
        record = AttendanceRecord.objects.create(
            registration=registration,
            scanned_by=request.user,
            device_info=device_info,
            verification_status='Verified'
        )

        # Update registration status
        registration.status = 'Attended'
        registration.save(update_fields=['status'])

        # Issue Certificate of Participation automatically upon verified attendance
        Certificate.objects.get_or_create(
            student=registration.student,
            event=registration.event,
            defaults={
                'title': f"Certificate of Completion - {registration.event.title}",
                'grade_or_score': 'Distinction',
                'status': 'Issued',
            }
        )

        return Response({
            "status": "success",
            "verification_status": "Verified",
            "message": f"Attendance verified successfully for {registration.student.full_name} ({registration.student.student_id}).",
            "record": AttendanceRecordSerializer(record).data,
            "student": {
                "name": registration.student.full_name,
                "student_id": registration.student.student_id,
                "department": registration.student.department,
                "course": registration.student.course,
                "email": registration.student.email,
            },
            "event": {
                "id": registration.event.id,
                "title": registration.event.title,
                "category": registration.event.category,
                "venue": registration.event.venue,
            }
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_attendance_history(request):
    """
    Student Attendance History Endpoint.
    Strictly restricted: Students can only view their own attendance logs!
    GET /api/attendance/my-history/
    """
    if not hasattr(request.user, 'student_profile'):
        return Response({
            "status": "error",
            "message": "Only registered students can access attendance records."
        }, status=status.HTTP_403_FORBIDDEN)

    student = request.user.student_profile
    records = AttendanceRecord.objects.filter(
        registration__student=student,
        verification_status='Verified'
    ).select_related('registration', 'registration__event').order_by('-verified_at')

    count = len(records) if isinstance(records, list) else records.count()
    serializer = AttendanceRecordSerializer(records, many=True)
    return Response({
        "status": "success",
        "count": count,
        "history": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_attendance_reports(request):
    """
    Admin Attendance Reports & Audit Summary Endpoint.
    GET /api/attendance/reports/
    """
    records = AttendanceRecord.objects.select_related(
        'registration',
        'registration__student',
        'registration__event',
        'scanned_by'
    ).all().order_by('-verified_at')

    event_id = request.query_params.get('event_id')
    if event_id:
        records = records.filter(registration__event_id=event_id)

    total_scans = records.count()
    verified_count = records.filter(verification_status='Verified').count()
    duplicate_count = records.filter(verification_status='Duplicate_Attempt').count()

    serializer = AttendanceRecordSerializer(records[:100], many=True)

    return Response({
        "status": "success",
        "summary": {
            "total_scans": total_scans,
            "verified_count": verified_count,
            "duplicate_count": duplicate_count,
            "verification_mode": "Strictly QR-Matrix Codes (Zero Biometrics)",
        },
        "records": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_export_attendance_csv(request):
    """
    Export verified attendance logs to downloadable CSV spreadsheet.
    GET /api/attendance/export-csv/
    """
    response = HttpResponse(content_type='text/csv')
    timestamp_str = timezone.now().strftime('%Y%m%d_%H%M%S')
    response['Content-Disposition'] = f'attachment; filename="smartattend_attendance_{timestamp_str}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Record ID',
        'Student ID',
        'Student Name',
        'Email',
        'Department',
        'Course',
        'Event Title',
        'Event Category',
        'Venue',
        'QR Pass Token',
        'Verification Status',
        'Verified Timestamp',
        'Scanning Station',
    ])

    records = AttendanceRecord.objects.select_related(
        'registration__student',
        'registration__event'
    ).order_by('-verified_at')

    for r in records:
        reg = r.registration
        st = reg.student
        ev = reg.event
        writer.writerow([
            r.id,
            st.student_id,
            st.full_name,
            st.email,
            st.department,
            st.course,
            ev.title,
            ev.category,
            ev.venue,
            reg.pass_token,
            r.verification_status,
            r.verified_at.strftime('%Y-%m-%d %H:%M:%S') if r.verified_at else '',
            r.device_info,
        ])

    return response
