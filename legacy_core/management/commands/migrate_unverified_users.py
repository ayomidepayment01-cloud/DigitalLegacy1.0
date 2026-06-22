from django.core.management.base import BaseCommand
from django.utils import timezone
from legacy_core.models import CustomUser, PendingRegistration

class Command(BaseCommand):
    help = 'Migrate existing unverified CustomUser records into PendingRegistration'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=3650, help='Only migrate users created within this many days (default: 3650)')

    def handle(self, *args, **options):
        days = options['days']
        cutoff = timezone.now() - timezone.timedelta(days=days)
        qs = CustomUser.objects.filter(is_verified=False, date_joined__gte=cutoff)
        migrated = 0
        for u in qs:
            # Skip if pending already exists
            if PendingRegistration.objects.filter(email=u.email).exists() or PendingRegistration.objects.filter(username=u.username).exists():
                self.stdout.write(self.style.WARNING(f"Skipping {u.username} - pending already exists"))
                continue

            PendingRegistration.objects.create(
                username=u.username,
                email=u.email,
                password_hash=u.password,
                phone_number=getattr(u, 'phone_number', ''),
                crypto_salt=getattr(u, 'crypto_salt', ''),
                email_verification_code=(u.email_verification_code if getattr(u, 'email_verification_code', None) else ''),
                expires_at=timezone.now() + timezone.timedelta(hours=24)
            )
            u.delete()
            migrated += 1
            self.stdout.write(self.style.SUCCESS(f"Migrated {u.username} to PendingRegistration"))

        self.stdout.write(self.style.SUCCESS(f"Migration complete. {migrated} users migrated."))
