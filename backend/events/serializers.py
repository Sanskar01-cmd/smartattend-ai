"""
Events Serializers for SmartAttend AI
"""

from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """Full read serializer for events, including registration indicators"""
    registered_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    is_registered = serializers.SerializerMethodField()
    my_pass_token = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'category',
            'date',
            'time',
            'venue',
            'organizer',
            'speaker',
            'speaker_role',
            'capacity',
            'status',
            'description',
            'tags',
            'created_by',
            'created_at',
            'updated_at',
            'registered_count',
            'is_full',
            'is_registered',
            'my_pass_token',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_is_registered(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if not hasattr(request.user, 'student_profile'):
            return False
        return obj.registrations.filter(
            student=request.user.student_profile,
            status__in=['Confirmed', 'Attended']
        ).exists()

    def get_my_pass_token(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if not hasattr(request.user, 'student_profile'):
            return None
        reg = obj.registrations.filter(
            student=request.user.student_profile,
            status__in=['Confirmed', 'Attended']
        ).first()
        return reg.pass_token if reg else None


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for administrative event creation and updating"""
    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'category',
            'date',
            'time',
            'venue',
            'organizer',
            'speaker',
            'speaker_role',
            'capacity',
            'status',
            'description',
            'tags',
        ]

    def validate_capacity(self, value):
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1 attendee.")
        return value
