"""
Unit tests for Events module & role-based permissions
"""

from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from events.views import events_list_or_create, event_detail_manage

User = get_user_model()


class EventPermissionsTestCase(SimpleTestCase):
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

    def test_student_cannot_create_event(self):
        """Ensure students are blocked from creating events (HTTP 403)"""
        request = self.factory.post('/api/events/', {
            'title': 'Hacker Workshop',
            'category': 'Workshop',
            'date': 'Oct 30, 2026',
            'time': '10:00 AM',
            'venue': 'Lab 1',
            'capacity': 50,
        }, format='json')
        force_authenticate(request, user=self.student_user)

        response = events_list_or_create(request)
        self.assertEqual(response.status_code, 403)
        self.assertIn('Access Denied', response.data['message'])

    def test_unauthenticated_cannot_create_event(self):
        """Ensure unauthenticated visitors cannot create events (HTTP 403)"""
        request = self.factory.post('/api/events/', {
            'title': 'Unauthorized Workshop',
            'category': 'Workshop',
        }, format='json')

        response = events_list_or_create(request)
        self.assertEqual(response.status_code, 403)

    @patch('events.models.Event.objects.all')
    def test_anyone_can_read_event_catalog(self, mock_all):
        """Ensure public and student catalog read access works"""
        mock_all.return_value.order_by.return_value = []
        request = self.factory.get('/api/events/')

        response = events_list_or_create(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')
