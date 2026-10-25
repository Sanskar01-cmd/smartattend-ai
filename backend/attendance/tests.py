"""
Unit tests for Attendance & Scanner security
"""

from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase, TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from attendance.views import scan_qr_pass, admin_attendance_reports, admin_export_attendance_csv, my_attendance_history
from attendance.models import AttendanceRecord
from accounts.models import StudentProfile
from events.models import Event
from registrations.models import EventRegistration, Certificate

User = get_user_model()


class AttendancePermissionsTestCase(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.student_user = User(
            id=10,
            username='student1',
            email='student1@college.edu',
            role=User.ROLE_STUDENT,
            is_active=True
        )
        self.admin_user = User(
            id=1,
            username='admin1',
            email='admin1@college.edu',
            role=User.ROLE_ADMIN,
            is_staff=True,
            is_active=True
        )

    def test_student_cannot_call_scanner_endpoint(self):
        """Ensure students are blocked from scanning QR passes (HTTP 403)"""
        request = self.factory.post('/api/attendance/scan/', {
            'pass_token': 'SA-PASS-TEST123'
        }, format='json')
        force_authenticate(request, user=self.student_user)

        response = scan_qr_pass(request)
        self.assertEqual(response.status_code, 403)

    def test_student_cannot_view_admin_reports(self):
        """Ensure students cannot view overall institutional attendance reports (HTTP 403)"""
        request = self.factory.get('/api/attendance/reports/')
        force_authenticate(request, user=self.student_user)

        response = admin_attendance_reports(request)
        self.assertEqual(response.status_code, 403)

    def test_student_cannot_export_attendance_csv(self):
        """Ensure students cannot export CSV attendance rosters (HTTP 403)"""
        request = self.factory.get('/api/attendance/export-csv/')
        force_authenticate(request, user=self.student_user)

        response = admin_export_attendance_csv(request)
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_view_attendance_history(self):
        """Ensure unauthenticated visitors cannot view personal attendance history"""
        request = self.factory.get('/api/attendance/my-history/')
        response = my_attendance_history(request)
        self.assertEqual(response.status_code, 401)


class AttendanceWorkflowTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Create Admin
        self.admin_user = User.objects.create_user(
            username='gateadmin',
            email='gateadmin@college.edu',
            password='Password123!',
            role=User.ROLE_ADMIN,
            is_staff=True
        )
        # Create Student User & Profile
        self.student_user = User.objects.create_user(
            username='student_rahul',
            first_name='Rahul',
            last_name='Sharma',
            email='rahul@college.edu',
            password='Password123!',
            role=User.ROLE_STUDENT
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id='CS-2026-999',
            department='Computer Science & Engineering',
            course='B.Tech CSE',
            academic_year='4th Year'
        )
        # Create Event
        self.event = Event.objects.create(
            title='Autonomous AI Agents Workshop',
            category='Workshop',
            date='Oct 30, 2026',
            time='10:00 AM - 04:00 PM',
            venue='Auditorium Hall A',
            capacity=100,
            status='Upcoming'
        )
        # Create Registration
        self.registration = EventRegistration.objects.create(
            student=self.student_profile,
            event=self.event,
            status='Confirmed'
        )

    def test_valid_qr_scan_marks_attendance_and_issues_certificate(self):
        """Valid QR scan marks attendance and auto-issues certificate"""
        request = self.factory.post('/api/attendance/scan/', {
            'pass_token': self.registration.pass_token,
            'device_info': 'Gate 1 Main Scanner'
        }, format='json')
        force_authenticate(request, user=self.admin_user)

        response = scan_qr_pass(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['verification_status'], 'Verified')

        # Check DB updates
        self.registration.refresh_from_db()
        self.assertEqual(self.registration.status, 'Attended')
        self.assertTrue(AttendanceRecord.objects.filter(
            registration=self.registration,
            verification_status='Verified'
        ).exists())
        self.assertTrue(Certificate.objects.filter(
            student=self.student_profile,
            event=self.event
        ).exists())

    def test_duplicate_qr_scan_blocked_with_409_conflict(self):
        """Duplicate scan of already checked-in pass returns HTTP 409 Conflict"""
        # First scan
        request1 = self.factory.post('/api/attendance/scan/', {
            'pass_token': self.registration.pass_token,
            'device_info': 'Gate 1 Main Scanner'
        }, format='json')
        force_authenticate(request1, user=self.admin_user)
        res1 = scan_qr_pass(request1)
        self.assertEqual(res1.status_code, 200)

        # Second scan (anti-passback test)
        request2 = self.factory.post('/api/attendance/scan/', {
            'pass_token': self.registration.pass_token,
            'device_info': 'Gate 2 Side Entrance'
        }, format='json')
        force_authenticate(request2, user=self.admin_user)
        res2 = scan_qr_pass(request2)

        self.assertEqual(res2.status_code, 409)
        self.assertEqual(res2.data['status'], 'duplicate')
        self.assertEqual(res2.data['verification_status'], 'Duplicate_Attempt')
        self.assertIn('DUPLICATE PASS DETECTED', res2.data['message'])

        # Verify audit log captured the duplicate attempt
        self.assertTrue(AttendanceRecord.objects.filter(
            registration=self.registration,
            verification_status='Duplicate_Attempt'
        ).exists())

    def test_invalid_token_returns_404(self):
        """Invalid token not in database returns HTTP 404"""
        request = self.factory.post('/api/attendance/scan/', {
            'pass_token': 'SA-PASS-NONEXISTENT',
            'device_info': 'Gate 1 Main Scanner'
        }, format='json')
        force_authenticate(request, user=self.admin_user)

        response = scan_qr_pass(request)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data['verification_status'], 'Invalid_Token')

    def test_cancelled_event_scan_returns_400(self):
        """Scanning a pass for a cancelled event returns HTTP 400"""
        self.event.status = 'Cancelled'
        self.event.save()

        request = self.factory.post('/api/attendance/scan/', {
            'pass_token': self.registration.pass_token,
            'device_info': 'Gate 1'
        }, format='json')
        force_authenticate(request, user=self.admin_user)

        response = scan_qr_pass(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['verification_status'], 'Event_Cancelled')

    def test_composite_token_format_handling(self):
        """Scanner correctly decodes composite payload (SMARTATTEND:<token>:<event>:<student>)"""
        composite_payload = f"SMARTATTEND:{self.registration.pass_token}:{self.event.id}:{self.student_profile.student_id}"
        request = self.factory.post('/api/attendance/scan/', {
            'pass_token': composite_payload,
            'device_info': 'Gate 3 Scanner'
        }, format='json')
        force_authenticate(request, user=self.admin_user)

        response = scan_qr_pass(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['verification_status'], 'Verified')

