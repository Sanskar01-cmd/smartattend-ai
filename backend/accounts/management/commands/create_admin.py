"""
Management command to create the initial SmartAttend AI Administrator account.
Usage:
    python manage.py create_admin --email admin@college.edu --username admin --password SecurePassword123
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an administrator account with staff and superuser privileges for SmartAttend AI'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Administrator email address')
        parser.add_argument('--username', type=str, help='Administrator username')
        parser.add_argument('--password', type=str, help='Administrator password')
        parser.add_argument('--name', type=str, default='System Administrator', help='Full name')

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('username')
        password = options.get('password')
        name = options.get('name') or 'System Administrator'

        if not email:
            email = input('Enter Administrator Email: ').strip()
        if not username:
            username = input('Enter Administrator Username: ').strip()
        if not password:
            import getpass
            password = getpass.getpass('Enter Administrator Password (min 8 chars): ')

        if not email or not username or not password:
            raise CommandError('Email, username, and password are all required.')

        if len(password) < 8:
            raise CommandError('Password must be at least 8 characters long.')

        if User.objects.filter(email__iexact=email).exists():
            raise CommandError(f"A user with email '{email}' already exists.")

        if User.objects.filter(username__iexact=username).exists():
            raise CommandError(f"A user with username '{username}' already exists.")

        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        admin_user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=User.ROLE_ADMIN,
            is_staff=True,
            is_superuser=True,
            is_verified=True,
        )
        admin_user.set_password(password)
        admin_user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created SmartAttend Administrator account!\n"
                f"  Username : {username}\n"
                f"  Email    : {email}\n"
                f"  Role     : Administrator (is_staff=True, is_superuser=True)"
            )
        )
