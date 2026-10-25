"""
Unit tests for Registrations & Pass permissions
"""

from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase, TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from registrations.views import register_for_event, my_passes, admin_all_registrations, admin_issue_certificate
from registrations.models import EventRegistration
from accounts.models import StudentProfile
from events.models import Event

User = get_user_model()


class RegistrationPermissionsTestCase(SimpleTestCase):
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

    def test_student_cannot_access_admin_all_registrations(self):
        """Ensure students are blocked from viewing all college registrations (HTTP 403)"""
        request = self.factory.get('/api/registrations/all/')
        force_authenticate(request, user=self.student_user)

        response = admin_all_registrations(request)
        self.assertEqual(response.status_code, 403)

    def test_student_cannot_issue_certificates(self):
        """Ensure students cannot issue certificates (HTTP 403)"""
        request = self.factory.post('/api/registrations/issue-certificate/', {
            'student_id': 'CS-2024-001',
            'event_id': 1
        }, format='json')
        force_authenticate(request, user=self.student_user)

        response = admin_issue_certificate(request)
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_cannot_access_my_passes(self):
        """Ensure unauthenticated visitors cannot view passes"""
        request = self.factory.get('/api/registrations/my-passes/')
        response = my_passes(request)
        self.assertEqual(response.status_code, 401)


class RegistrationWorkflowTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Student 1
        self.student_user1 = User.objects.create_user(
            username='student_priya',
            first_name='Priya',
            last_name='Patel',
            email='priya@college.edu',
            password='Password123!',
            role=User.ROLE_STUDENT
        )
        self.student_profile1 = StudentProfile.objects.create(
            user=self.student_user1,
            student_id='CS-2026-001',
            department='Computer Science',
            course='B.Tech CSE',
            academic_year='3rd Year'
        )
        # Student 2
        self.student_user2 = User.objects.create_user(
            username='student_arjun',
            first_name='Arjun',
            last_name='Verma',
            email='arjun@college.edu',
            password='Password123!',
            role=User.ROLE_STUDENT
        )
        self.student_profile2 = StudentProfile.objects.create(
            user=self.student_user2,
            student_id='CS-2026-002',
            department='Information Technology',
            course='B.Tech IT',
            academic_year='2nd Year'
        )
        # Event with capacity 1
        self.limited_event = Event.objects.create(
            title='Limited Masterclass',
            category='Seminar',
            date='Nov 10, 2026',
            time='02:00 PM - 05:00 PM',
            venue='Seminar Room 2',
            capacity=1,
            status='Upcoming'
        )

    def test_student_event_registration_generates_unique_token_and_qr(self):
        """Student registers successfully, receives unique pass_token and QR data URL"""
        request = self.factory.post('/api/registrations/register/', {
            'event_id': self.limited_event.id
        }, format='json')
        force_authenticate(request, user=self.student_user1)

        response = register_for_event(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], 'success')
        self.assertIn('registration', response.data)

        reg_data = response.data['registration']
        self.assertTrue(reg_data['pass_token'].startswith('SA-PASS-'))
        self.assertIsNotNone(reg_data['qr_data_url'])
        self.assertTrue(reg_data['qr_data_url'].startswith('data:image/png;base64,'))
        self.assertIn('email_delivery', response.data)

    def test_duplicate_registration_returns_info(self):
        """Registering twice for the same event does not duplicate and returns info status"""
        # Register once
        EventRegistration.objects.create(
            student=self.student_profile1,
            event=self.limited_event,
            status='Confirmed'
        )

        request = self.factory.post('/api/registrations/register/', {
            'event_id': self.limited_event.id
        }, format='json')
        force_authenticate(request, user=self.student_user1)

        response = register_for_event(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'info')
        self.assertIn('already registered', response.data['message'])

    def test_full_capacity_registration_rejected(self):
        """When event reaches capacity, additional registrations are rejected with 400"""
        # Fill capacity with student 1
        EventRegistration.objects.create(
            student=self.student_profile1,
            event=self.limited_event,
            status='Confirmed'
        )

        # Student 2 attempts to register
        request = self.factory.post('/api/registrations/register/', {
            'event_id': self.limited_event.id
        }, format='json')
        force_authenticate(request, user=self.student_user2)

        response = register_for_event(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('full capacity', response.data['message'])

    def test_cancelled_event_registration_rejected(self):
        """Registering for a cancelled event is rejected with 400"""
        self.limited_event.status = 'Cancelled'
        self.limited_event.save()

        request = self.factory.post('/api/registrations/register/', {
            'event_id': self.limited_event.id
        }, format='json')
        force_authenticate(request, user=self.student_user1)

        response = register_for_event(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn('cancelled', response.data['message'])

    def test_student_can_view_my_passes(self):
        """Student can view their generated passes via my_passes endpoint"""
        reg = EventRegistration.objects.create(
            student=self.student_profile1,
            event=self.limited_event,
            status='Confirmed'
        )

        request = self.factory.get('/api/registrations/my-passes/')
        force_authenticate(request, user=self.student_user1)

        response = my_passes(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['passes'][0]['pass_token'], reg.pass_token)

