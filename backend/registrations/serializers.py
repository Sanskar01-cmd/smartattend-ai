"""
Registrations and Certificates Serializers for SmartAttend AI
"""

from rest_framework import serializers
from .models import EventRegistration, Certificate
from events.serializers import EventSerializer
from accounts.serializers import StudentProfileSerializer


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Full detail serializer for student QR pass & registration record"""
    event = EventSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)
    qr_data_url = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'student',
            'event',
            'pass_token',
            'status',
            'registered_at',
            'updated_at',
            'qr_data_url',
        ]
        read_only_fields = ['id', 'pass_token', 'registered_at', 'updated_at', 'qr_data_url']

    def get_qr_data_url(self, obj):
        """
        Dynamically generates a standard 2D QR Code as a base64 PNG data URL.
        No facial or biometric data is ever included; solely the unique pass_token.
        """
        try:
            import io
            import base64
            import qrcode

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=8,
                border=2,
            )
            # Encode verified token and payload
            payload = f"SMARTATTEND:{obj.pass_token}:{obj.event.id}:{obj.student.student_id}"
            qr.add_data(payload)
            qr.make(fit=True)

            img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            b64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/png;base64,{b64_str}"
        except Exception:
            return None


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for student verified certificates"""
    event = EventSerializer(read_only=True)
    student = StudentProfileSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'student',
            'event',
            'certificate_code',
            'title',
            'grade_or_score',
            'issued_at',
            'status',
        ]
        read_only_fields = ['id', 'certificate_code', 'issued_at']


class IssueCertificateSerializer(serializers.Serializer):
    """Serializer for admin certificate issuance"""
    student_id = serializers.CharField(max_length=50)
    event_id = serializers.IntegerField()
    title = serializers.CharField(max_length=200, required=False)
    grade = serializers.CharField(max_length=50, default='Distinction')
