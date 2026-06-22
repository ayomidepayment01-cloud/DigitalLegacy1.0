from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from legacy_core.models import CustomUser
import datetime

class Command(BaseCommand):
    help = 'Checks for inactive users and triggers legacy release based on their custom thresholds'

    def handle(self, *args, **options):
        now = timezone.now()
        self.stdout.write(f"💀 Reaper Scan Started: {now.strftime('%Y-%m-%d %H:%M:%S')}")

        # Fetch all users who are currently 'Active'
        active_users = CustomUser.objects.filter(is_deceased=False)

        for user in active_users:
            days_inactive = (now - user.last_heartbeat).days
            
            # --- PHASE 1: THE WARNING (7 Days before threshold) ---
            warning_limit = user.threshold_days - 7
            if days_inactive >= warning_limit and days_inactive < user.threshold_days:
                if user.email:
                    self.stdout.write(self.style.WARNING(f"Sending 7-day warning to {user.username}..."))
                    try:
                        send_mail(
                            subject='Action Required: Digital Legacy Heartbeat',
                            message=f'Hi {user.username},\n\nYou are approaching your inactivity limit ({days_inactive}/{user.threshold_days} days). '
                                    f'Please log in to your dashboard to reset your pulse, or your vault will be released to your beneficiaries.',
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Warning Mail Error for {user.username}: {str(e)}"))

            # --- PHASE 2: THE RELEASE (Threshold Reached) ---
            elif days_inactive >= user.threshold_days:
                self.stdout.write(self.style.SUCCESS(f"!!! TRIGGERING RELEASE: {user.username} is inactive !!!"))
                
                beneficiaries = user.beneficiaries.all()

                if not beneficiaries.exists():
                    self.stdout.write(self.style.ERROR(f"Skipping {user.username}: No beneficiaries found."))
                    continue

                for beneficiary in beneficiaries:
                    # NEEDFUL CORRECTION 1: Security Filter
                    # We must filter by 'user=user' so this beneficiary doesn't accidentally 
                    # receive notes from OTHER people they might be trustees for.
                    assigned_notes = beneficiary.assigned_notes.filter(user=user)
                    
                    if assigned_notes.exists():
                        # NEEDFUL CORRECTION 2: Use the new per-message hints
                        # Since we added hints to individual notes, we should include them here.
                        notes_list = "\n".join([
                            f"- {n.title} (Category: {n.get_category_display()})\n  [Hint: {n.decryption_hint or 'No hint'}]" 
                            for n in assigned_notes
                        ])
                    else:
                        notes_list = "No specific notes assigned."

                    try:
                        self.stdout.write(f"📫 Dispatching Legacy to: {beneficiary.email}")
                        send_mail(
                            subject=f'Digital Legacy Release: {user.username}',
                            message=f'Dear {beneficiary.name},\n\n'
                                    f'This is an automated release from the Digital Legacy of {user.username}.\n\n'
                                    f'YOUR ASSIGNED ASSETS AND HINTS:\n{notes_list}\n\n'
                                    f'Claim and decrypt your inheritance here:\nhttp://localhost:3000/claim?email={beneficiary.email}\n\n'
                                    f'— Secure Digital Legacy System (LASU CS 2026)',
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[beneficiary.email],
                            fail_silently=False,
                        )
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Release Mail Error for {beneficiary.email}: {str(e)}"))

                # Mark the user as deceased and save to prevent duplicate emails
                user.is_deceased = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"✅ Final release completed for {user.username}"))

        self.stdout.write(self.style.SUCCESS("✅ Reaper scan complete."))