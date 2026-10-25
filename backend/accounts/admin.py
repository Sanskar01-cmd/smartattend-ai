from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_verified', 'is_staff', 'is_active']
    list_filter = ['role', 'is_verified', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('SmartAttend Role & Verification', {
            'fields': ('role', 'is_verified', 'verification_token')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('SmartAttend Role', {
            'fields': ('email', 'role', 'is_verified')
        }),
    )

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'full_name', 'department', 'course', 'academic_year', 'created_at']
    search_fields = ['student_id', 'user__first_name', 'user__last_name', 'user__email', 'department']
    list_filter = ['department', 'course', 'academic_year']
    readonly_fields = ['created_at', 'updated_at']
