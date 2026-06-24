from django.core.management.base import BaseCommand
from legacy_core.models import CustomUser

class Command(BaseCommand):
    def handle(self, *args, **options):
        user = CustomUser.objects.get(username='ayomide')
        user.is_staff = True
        user.is_superuser = True
        user.save()
        self.stdout.write("ayomide is now admin!")