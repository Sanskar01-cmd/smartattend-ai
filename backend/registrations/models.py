"""
Registrations and Certificates Models for SmartAttend AI
"""

import uuid
from django.db import models
from django.utils import timezone


def generate_pass_token():
    """Generates unique QR pass token with SmartAttend prefix"""
    return f"SA-PASS-{uuid.uuid4().hex[:12].upper()}"


def generate_cert_code():
    """Generates unique Certificate serial code"""
    return f"SA-CERT-2026-{uuid.uuid4().hex[:8].upper()}"


class EventRegistration(models.Model):
    """
    Student Registration Record for a Campus Event or Workshop.
    Links a StudentProfile to an Event and holds the unique QR pass token.
    """
    STATUS_CHOICES = (
        ('Confirmed', 'Confirmed'),
        ('Attended', 'Attended'),
        ('Cancelled', 'Cancelled'),
    )

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='registrations'
    )
    pass_token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        default=generate_pass_token,
        help_text='Cryptographic unique QR pass identifier'
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='Confirmed'
    )
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Event Registration'
        verbose_name_plural = 'Event Registrations'
        unique_together = ('student', 'event')
        ordering = ['-registered_at']

    def __str__(self):
        return f"{self.student.student_id} -> {self.event.title} [{self.status}]"


class Certificate(models.Model):
    """
    Student Verified Certificate of Completion / Participation.
    Issued upon verified attendance of workshop or hackathon.
    """
    STATUS_CHOICES = (
        ('Issued', 'Issued'),
        ('Pending', 'Pending'),
        ('Revoked', 'Revoked'),
    )

    id = models.BigAutoField(primary_key=True)
    student = models.ForeignKey(
        'accounts.StudentProfile',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    certificate_code = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        default=generate_cert_code
    )
    title = models.CharField(max_length=200)
    grade_or_score = models.CharField(max_length=50, blank=True, default='Distinction')
    issued_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Issued')

    class Meta:
        verbose_name = 'Student Certificate'
        verbose_name_plural = 'Student Certificates'
        unique_together = ('student', 'event')
        ordering = ['-issued_at']

    def __str__(self):
        return f"{self.certificate_code}: {self.title} ({self.student.student_id})"
