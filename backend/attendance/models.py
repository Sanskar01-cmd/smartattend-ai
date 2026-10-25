"""
Attendance Models for SmartAttend AI

CRITICAL ARCHITECTURE REQUIREMENT:
- SmartAttend AI uses QR-code passes exclusively for attendance verification.
- Face detection, facial recognition, biometrics, and liveness checks are strictly prohibited.
- Camera access is used solely by the scanner component to decode standard 2D QR matrix codes.
"""

from django.db import models
from django.conf import settings


class AttendanceRecord(models.Model):
    """
    Verified Attendance Record created upon scanning student's QR pass token.
    Prevents duplicate scans / anti-passback.
    """
    STATUS_CHOICES = (
        ('Verified', 'Verified'),
        ('Duplicate_Attempt', 'Duplicate Attempt'),
        ('Invalid_Token', 'Invalid Token'),
    )

    id = models.BigAutoField(primary_key=True)
    registration = models.ForeignKey(
        'registrations.EventRegistration',
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    verified_at = models.DateTimeField(auto_now_add=True)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scanned_attendances'
    )
    device_info = models.CharField(
        max_length=150,
        default='Institutional QR Gate Scanner',
        help_text='Scanning station or device identifier'
    )
    verification_status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='Verified'
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-verified_at']

    def __str__(self):
        return f"Scan: {self.registration.pass_token} - {self.verification_status} at {self.verified_at}"
