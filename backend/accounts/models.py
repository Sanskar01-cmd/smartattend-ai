"""
Accounts Models: Custom User and Student Digital Profile
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    """
    Custom user model with role-based access for Students and Administrators.
    """
    ROLE_STUDENT = 'student'
    ROLE_ADMIN = 'admin'
    ROLE_CHOICES = (
        (ROLE_STUDENT, 'Student'),
        (ROLE_ADMIN, 'Administrator'),
    )

    email = models.EmailField(unique=True, db_index=True, verbose_name='Email Address')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT, db_index=True)
    is_verified = models.BooleanField(default=False, help_text='Designates whether this user has verified their email address.')
    verification_token = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.verification_token:
            self.verification_token = uuid.uuid4().hex
        if (self.is_superuser or self.is_staff) and self.role == self.ROLE_STUDENT:
            self.role = self.ROLE_ADMIN
        super().save(*args, **kwargs)

    @property
    def is_student(self):
        return self.role == self.ROLE_STUDENT

    @property
    def is_admin_role(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser or self.is_staff

    def __str__(self):
        return f"{self.username} ({self.get_role_display()}) - {self.email}"


class StudentProfile(models.Model):
    """
    Official Digital Profile for College Students.
    Uses a stable internal integer primary key (id) so Student ID updates
    do not break relational integrity with future event registrations or attendance logs.
    """
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Student Roll ID'
    )
    department = models.CharField(max_length=100, verbose_name='Department')
    course = models.CharField(max_length=100, verbose_name='Course / Degree')
    academic_year = models.CharField(max_length=50, verbose_name='Academic Year')
    phone_number = models.CharField(max_length=25, blank=True, default='', verbose_name='Phone Number')
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True, verbose_name='Profile Photo File')
    photo_base64 = models.TextField(blank=True, default='', verbose_name='Profile Photo Data')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
        ordering = ['-created_at']

    @property
    def full_name(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name if name else self.user.username

    @property
    def email(self):
        return self.user.email

    def __str__(self):
        return f"{self.full_name} [{self.student_id}] - {self.department}"
