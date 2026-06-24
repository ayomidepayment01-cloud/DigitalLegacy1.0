from django.core.management.base import BaseCommand
from legacy_core.models import CustomUser, PendingRegistration

class Command(BaseCommand):
    help = 'Creates or elevates user ayomide to superuser'

    def handle(self, *args, **options):
        # 1. Clean up pending registrations to avoid conflicts
        pending = PendingRegistration.objects.filter(username='ayomide').first()
        
        try:
            user = CustomUser.objects.get(username='ayomide')
            user.is_staff = True
            user.is_superuser = True
            user.is_verified = True
            user.save()
            self.stdout.write(self.style.SUCCESS("User 'ayomide' successfully elevated to Admin!"))
            if pending:
                pending.delete()
        except CustomUser.DoesNotExist:
            if pending:
                # Create user from pending registration
                user = CustomUser.objects.create(
                    username=pending.username,
                    email=pending.email,
                    password=pending.password_hash,
                    phone_number=pending.phone_number,
                    crypto_salt=pending.crypto_salt,
                    is_verified=True,
                    is_staff=True,
                    is_superuser=True
                )
                pending.delete()
                self.stdout.write(self.style.SUCCESS("User 'ayomide' created from pending registration and elevated to Admin! (Use the password you set during registration)"))
            else:
                # Create fresh user with a default password
                user = CustomUser.objects.create_superuser(
                    username='ayomide',
                    email='ayomidepayment01@gmail.com',
                    password='TempPassword123!'
                )
                user.is_verified = True
                user.save()
                self.stdout.write(self.style.SUCCESS("User 'ayomide' created with username 'ayomide' and default password 'TempPassword123!'. Please log in and change your password immediately."))
