"""
Attendance Serializers for SmartAttend AI
"""

from rest_framework import serializers
from .models import AttendanceRecord
from registrations.serializers import EventRegistrationSerializer


class AttendanceRecordSerializer(serializers.ModelSerializer):
    """Serializer for verified attendance logs"""
    registration = EventRegistrationSerializer(read_only=True)
    scanned_by_username = serializers.CharField(source='scanned_by.username', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'registration',
            'verified_at',
            'scanned_by',
            'scanned_by_username',
            'device_info',
            'verification_status',
            'notes',
        ]
        read_only_fields = ['id', 'verified_at', 'scanned_by', 'scanned_by_username']


class QRScanRequestSerializer(serializers.Serializer):
    """Payload validator for QR scanner check-in requests"""
    pass_token = serializers.CharField(max_length=100)
    device_info = serializers.CharField(max_length=150, default='Admin Gate Scanner', required=False)
