from django.core.management.base import BaseCommand
from legacy_core.models import CustomUser

class Command(BaseCommand):
    help = 'Elevates user ayomide to superuser'

    def handle(self, *args, **options):
        try:
            user = CustomUser.objects.get(username='ayomide')
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS("ayomide is now admin!"))
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.WARNING("User 'ayomide' does not exist in the database. Please register first on the website, then run this command again."))