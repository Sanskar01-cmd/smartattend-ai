"""
Accounts Serializers: Registration, Authentication, Profile & Secure Updates
"""

import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import StudentProfile

User = get_user_model()

STUDENT_ID_REGEX = re.compile(r'^[A-Za-z0-9\-_/.]+$')


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the Custom User model.
    """
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_verified',
            'is_staff',
            'is_superuser',
        ]
        read_only_fields = ['id', 'username', 'role', 'is_verified', 'is_staff', 'is_superuser']


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Full serializer for Student Digital Profile.
    """
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'user',
            'student_id',
            'full_name',
            'email',
            'department',
            'course',
            'academic_year',
            'phone_number',
            'profile_photo',
            'photo_base64',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class StudentRegisterSerializer(serializers.Serializer):
    """
    Validated serializer for student sign up.
    """
    full_name = serializers.CharField(max_length=150, required=True)
    student_id = serializers.CharField(max_length=50, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True, min_length=8)
    department = serializers.CharField(max_length=100, required=True)
    course = serializers.CharField(max_length=100, required=True)
    academic_year = serializers.CharField(max_length=50, required=True)
    phone_number = serializers.CharField(max_length=25, required=False, allow_blank=True, default='')

    def validate_full_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Full name cannot be blank.")
        return trimmed

    def validate_student_id(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Student ID is required.")
        if not STUDENT_ID_REGEX.match(trimmed):
            raise serializers.ValidationError(
                "Student ID can only contain alphanumeric characters, hyphens, underscores, slashes, and dots."
            )
        if StudentProfile.objects.filter(student_id__iexact=trimmed).exists():
            raise serializers.ValidationError(f"Student ID '{trimmed}' is already registered in the system.")
        return trimmed

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return normalized

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        # Run Django's configured password validators
        try:
            validate_password(data['password'])
        except DjangoValidationError as err:
            raise serializers.ValidationError({"password": list(err.messages)})

        return data

    def create(self, validated_data):
        full_name = validated_data['full_name']
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        email = validated_data['email']
        student_id = validated_data['student_id']

        # Construct a unique username from student_id or email
        username = student_id.replace('/', '-').replace(' ', '_').lower()
        if User.objects.filter(username=username).exists():
            username = email.split('@')[0] + '_' + student_id[:4].lower()

        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=User.ROLE_STUDENT,
            is_verified=False,
        )
        # Hash password securely using Django's PBKDF2/Argon2
        user.set_password(validated_data['password'])
        user.save()

        profile = StudentProfile.objects.create(
            user=user,
            student_id=student_id,
            department=validated_data['department'].strip(),
            course=validated_data['course'].strip(),
            academic_year=validated_data['academic_year'].strip(),
            phone_number=validated_data.get('phone_number', '').strip(),
        )

        return profile


class StudentProfileUpdateSerializer(serializers.Serializer):
    """
    Serializer for safe digital profile updating.
    Allows permitted fields only; enforces unique Student ID validation.
    """
    full_name = serializers.CharField(max_length=150, required=False)
    student_id = serializers.CharField(max_length=50, required=False)
    phone_number = serializers.CharField(max_length=25, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False)
    course = serializers.CharField(max_length=100, required=False)
    academic_year = serializers.CharField(max_length=50, required=False)
    photo_base64 = serializers.CharField(required=False, allow_blank=True)
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    def validate_student_id(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("Student ID cannot be empty.")
        if not STUDENT_ID_REGEX.match(trimmed):
            raise serializers.ValidationError(
                "Student ID can only contain alphanumeric characters, hyphens, underscores, slashes, and dots."
            )

        # Ensure unique student_id across all other profiles
        instance = getattr(self, 'instance', None)
        qs = StudentProfile.objects.filter(student_id__iexact=trimmed)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(f"Student ID '{trimmed}' is already in use by another student.")

        return trimmed

    def update(self, instance, validated_data):
        user = instance.user

        # Update full name on user if provided
        if 'full_name' in validated_data:
            full_name = validated_data['full_name'].strip()
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save(update_fields=['first_name', 'last_name'])

        # Update profile fields
        if 'student_id' in validated_data:
            instance.student_id = validated_data['student_id']
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number'].strip()
        if 'department' in validated_data:
            instance.department = validated_data['department'].strip()
        if 'course' in validated_data:
            instance.course = validated_data['course'].strip()
        if 'academic_year' in validated_data:
            instance.academic_year = validated_data['academic_year'].strip()
        if 'photo_base64' in validated_data:
            instance.photo_base64 = validated_data['photo_base64']
        if 'profile_photo' in validated_data:
            instance.profile_photo = validated_data['profile_photo']

        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login supporting Email or Student ID or Username,
    with portal_type verification ('student' or 'admin').
    """
    identifier = serializers.CharField(required=True, help_text="Email address, Student ID, or Username")
    password = serializers.CharField(required=True, write_only=True)
    portal_type = serializers.CharField(required=False, default='student', help_text="'student' or 'admin'")


class AdminCreateSerializer(serializers.Serializer):
    """
    Serializer used exclusively by authenticated Admins to provision additional Administrator accounts.
    """
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    name = serializers.CharField(max_length=150, required=False, default='Administrator')

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized

    def validate_username(self, value):
        trimmed = value.strip()
        if User.objects.filter(username__iexact=trimmed).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return trimmed

    def create(self, validated_data):
        name = validated_data.get('name', 'Administrator').strip()
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        admin_user = User(
            username=validated_data['username'].strip(),
            email=validated_data['email'].strip().lower(),
            first_name=first_name,
            last_name=last_name,
            role=User.ROLE_ADMIN,
            is_staff=True,
            is_superuser=True,
            is_verified=True,
        )
        admin_user.set_password(validated_data['password'])
        admin_user.save()
        return admin_user
