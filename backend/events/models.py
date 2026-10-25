"""
Events Models: College Events, Workshops, Seminars, and Hackathons
"""

from django.db import models
from django.conf import settings


class Event(models.Model):
    """
    Campus Event and Workshop Entity.
    Supports administrative scheduling, capacity controls, and status tracking.
    """
    CATEGORY_CHOICES = (
        ('Workshop', 'Workshop'),
        ('Hackathon', 'Hackathon'),
        ('Seminar', 'Seminar'),
        ('Symposium', 'Symposium'),
        ('Conference', 'Conference'),
    )

    STATUS_CHOICES = (
        ('Upcoming', 'Upcoming'),
        ('Ongoing', 'Ongoing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=200, verbose_name='Event Title')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Workshop')
    date = models.CharField(max_length=50, help_text='Display date, e.g. Oct 28, 2026')
    time = models.CharField(max_length=50, help_text='Timing, e.g. 10:00 AM - 04:30 PM')
    venue = models.CharField(max_length=150, verbose_name='Venue / Hall')
    organizer = models.CharField(max_length=150, default='Dept. of Computer Science')
    speaker = models.CharField(max_length=150, blank=True, default='')
    speaker_role = models.CharField(max_length=150, blank=True, default='')
    capacity = models.PositiveIntegerField(default=100, verbose_name='Total Capacity')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Upcoming')
    description = models.TextField(blank=True, default='')
    tags = models.CharField(max_length=250, blank=True, default='Technical,Hands-on')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Campus Event'
        verbose_name_plural = 'Campus Events'
        ordering = ['-created_at']

    @property
    def registered_count(self):
        return self.registrations.filter(status='Confirmed').count()

    @property
    def is_full(self):
        return self.registered_count >= self.capacity

    def __str__(self):
        return f"{self.title} ({self.category}) - {self.date}"
