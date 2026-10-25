"""
Unit Tests for SmartAttend AI Accounts, Authentication, Admin Role & Profile Serializers
"""

from unittest.mock import patch, MagicMock
from django.test import SimpleTestCase, RequestFactory
from django.contrib.auth import get_user_model
from accounts.serializers import (
    StudentRegisterSerializer,
    StudentProfileUpdateSerializer,
    LoginSerializer,
    AdminCreateSerializer,
)
from accounts.permissions import IsAdminRole
from accounts.views import login_user, admin_overview_stats

User = get_user_model()


class AccountsSerializerTests(SimpleTestCase):
    @patch('accounts.models.StudentProfile.objects.filter')
    @patch('django.contrib.auth.get_user_model')
    def test_student_register_validation_success(self, mock_user_cls, mock_profile_filter):
        """Test valid student registration data structure."""
        mock_profile_filter.return_value.exists.return_value = False
        mock_user_filter = mock_user_cls.return_value.objects.filter
        mock_user_filter.return_value.exists.return_value = False

        data = {
            'full_name': 'Sanskar Agre',
            'student_id': 'CS2023-8942',
            'email': 'sanskar.test@college.edu',
            'password': 'StrongPassword2026!',
            'confirm_password': 'StrongPassword2026!',
            'department': 'Computer Science & Engineering',
            'course': 'B.Tech CSE',
            'academic_year': '2025 - 2026',
            'phone_number': '+91 9876543210',
        }
        with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
            mock_u_filter.return_value.exists.return_value = False
            serializer = StudentRegisterSerializer(data=data)
            self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_password_mismatch_rejected(self):
        """Test that mismatched passwords fail registration."""
        data = {
            'full_name': 'Test Student',
            'student_id': 'CS-0001',
            'email': 'student@college.edu',
            'password': 'SecurePassword123',
            'confirm_password': 'DifferentPassword456',
            'department': 'CSE',
            'course': 'B.Tech',
            'academic_year': '2025 - 2026',
        }
        with patch('accounts.models.StudentProfile.objects.filter') as mock_p_filter:
            mock_p_filter.return_value.exists.return_value = False
            with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
                mock_u_filter.return_value.exists.return_value = False
                serializer = StudentRegisterSerializer(data=data)
                self.assertFalse(serializer.is_valid())
                self.assertIn('confirm_password', serializer.errors)

    def test_short_password_rejected(self):
        """Test that passwords shorter than 8 characters fail validation."""
        data = {
            'full_name': 'Test Student',
            'student_id': 'CS-0002',
            'email': 'shortpass@college.edu',
            'password': 'short',
            'confirm_password': 'short',
            'department': 'CSE',
            'course': 'B.Tech',
            'academic_year': '2025 - 2026',
        }
        with patch('accounts.models.StudentProfile.objects.filter') as mock_p_filter:
            mock_p_filter.return_value.exists.return_value = False
            with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
                mock_u_filter.return_value.exists.return_value = False
                serializer = StudentRegisterSerializer(data=data)
                self.assertFalse(serializer.is_valid())
                self.assertIn('password', serializer.errors)

    def test_invalid_student_id_format_rejected(self):
        """Test that student ID containing illegal characters is rejected."""
        data = {
            'full_name': 'Invalid ID Student',
            'student_id': 'ID with spaces & <script>',
            'email': 'invalid_id@college.edu',
            'password': 'ValidPassword2026!',
            'confirm_password': 'ValidPassword2026!',
            'department': 'IT',
            'course': 'B.Tech',
            'academic_year': '2025 - 2026',
        }
        with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
            mock_u_filter.return_value.exists.return_value = False
            serializer = StudentRegisterSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn('student_id', serializer.errors)

    def test_login_serializer_requires_fields(self):
        """Test login serializer validates required identifier and password."""
        serializer = LoginSerializer(data={'identifier': ''})
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_profile_update_validation(self):
        """Test profile update serializer handles permitted fields."""
        update_data = {
            'full_name': 'Sanskar Agre (Updated)',
            'student_id': 'CS2023-8942-A',
            'phone_number': '+91 9999988888',
            'department': 'AI & Data Science',
            'course': 'B.Tech AI',
            'academic_year': '2025 - 2026',
        }
        with patch('accounts.models.StudentProfile.objects.filter') as mock_p_filter:
            mock_p_filter.return_value.exists.return_value = False
            mock_p_filter.return_value.exclude.return_value.exists.return_value = False
            serializer = StudentProfileUpdateSerializer(data=update_data)
            self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_duplicate_student_id_rejected_on_update(self):
        """Test that updating student ID to an existing one is rejected."""
        update_data = {
            'student_id': 'CS-DUPLICATE-ID',
        }
        with patch('accounts.models.StudentProfile.objects.filter') as mock_p_filter:
            mock_p_filter.return_value.exclude.return_value.exists.return_value = True
            serializer = StudentProfileUpdateSerializer(data=update_data)
            self.assertFalse(serializer.is_valid())
            self.assertIn('student_id', serializer.errors)

    def test_admin_create_serializer_valid(self):
        """Test AdminCreateSerializer validates unique admin email and username."""
        data = {
            'username': 'faculty_admin',
            'email': 'faculty@college.edu',
            'password': 'AdminPassword2026!',
            'name': 'Dr. Sharma',
        }
        with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
            mock_u_filter.return_value.exists.return_value = False
            serializer = AdminCreateSerializer(data=data)
            self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_admin_create_serializer_rejects_duplicate_email(self):
        """Test AdminCreateSerializer rejects duplicate email."""
        data = {
            'username': 'unique_user',
            'email': 'existing@college.edu',
            'password': 'AdminPassword2026!',
        }
        with patch('accounts.serializers.User.objects.filter') as mock_u_filter:
            # Simulate email exists
            mock_u_filter.return_value.exists.return_value = True
            serializer = AdminCreateSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn('email', serializer.errors)


class AdminAuthorizationTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsAdminRole()

    def test_unauthenticated_user_denied_admin_permission(self):
        """Test unauthenticated user is denied IsAdminRole permission."""
        request = self.factory.get('/api/accounts/admin/overview/')
        request.user = MagicMock(is_authenticated=False)
        self.assertFalse(self.permission.has_permission(request, None))

    def test_student_user_denied_admin_permission(self):
        """Test student user is denied IsAdminRole permission."""
        request = self.factory.get('/api/accounts/admin/overview/')
        request.user = MagicMock(
            is_authenticated=True,
            role='student',
            is_staff=False,
            is_superuser=False
        )
        self.assertFalse(self.permission.has_permission(request, None))

    def test_admin_user_granted_admin_permission(self):
        """Test administrator user is granted IsAdminRole permission."""
        request = self.factory.get('/api/accounts/admin/overview/')
        request.user = MagicMock(
            is_authenticated=True,
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.assertTrue(self.permission.has_permission(request, None))

    def test_admin_login_rejects_student_with_forbidden(self):
        """Test login_user endpoint rejects Student account when portal_type='admin'."""
        request = self.factory.post('/api/accounts/login/', {
            'identifier': 'student@college.edu',
            'password': 'StudentPassword123',
            'portal_type': 'admin',
        }, content_type='application/json')

        mock_student_user = MagicMock()
        mock_student_user.check_password.return_value = True
        mock_student_user.is_active = True
        mock_student_user.is_admin_role = False
        mock_student_user.role = 'student'

        with patch('accounts.views.User.objects.filter') as mock_u_filter:
            mock_u_filter.return_value.first.return_value = mock_student_user
            response = login_user(request)
            self.assertEqual(response.status_code, 403)
            self.assertIn("Administrator privileges required", response.data['message'])

    def test_admin_login_accepts_admin_user(self):
        """Test login_user endpoint accepts Administrator when portal_type='admin'."""
        request = self.factory.post('/api/accounts/login/', {
            'identifier': 'admin@college.edu',
            'password': 'AdminPassword123',
            'portal_type': 'admin',
        }, content_type='application/json')

        mock_admin_user = MagicMock()
        mock_admin_user.check_password.return_value = True
        mock_admin_user.is_active = True
        mock_admin_user.is_admin_role = True
        mock_admin_user.role = 'admin'
        mock_admin_user.first_name = 'Admin'
        mock_admin_user.last_name = 'User'
        mock_admin_user.username = 'admin'
        mock_admin_user.email = 'admin@college.edu'
        mock_admin_user.is_verified = True
        mock_admin_user.is_staff = True
        mock_admin_user.is_superuser = True

        mock_token = MagicMock(key='test-admin-token-12345')

        with patch('accounts.views.User.objects.filter') as mock_u_filter:
            mock_u_filter.return_value.first.return_value = mock_admin_user
            with patch('accounts.views.Token.objects.get_or_create', return_value=(mock_token, True)):
                response = login_user(request)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data['token'], 'test-admin-token-12345')
                self.assertEqual(response.data['role'], 'admin')
                self.assertTrue(response.data['is_admin'])
