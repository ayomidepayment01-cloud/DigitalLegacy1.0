from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from legacy_core.models import CustomUser
from django.core.mail import send_mail
import datetime

class Command(BaseCommand):
    help = 'Checks for inactive users and triggers legacy release'

    def handle(self, *args, **options):
        now = timezone.now()

        # WARNING PHASE — 90 days inactive
        warning_threshold = now - datetime.timedelta(days=90)
        users_to_warn = CustomUser.objects.filter(
            last_heartbeat__lt=warning_threshold,
            is_deceased=False
        )
        for user in users_to_warn:
            self.stdout.write(self.style.WARNING(f"Sending inactivity reminder to {user.email}..."))
            
            html_message = f"""
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width,initial-scale=1">
                    <style>
                      body {{ background: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; margin: 0; padding: 0; }}
                      .container {{ max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                      .header {{ background: #2c3e50; color: #ffffff; padding: 24px; text-align: center; }}
                      .brand {{ font-size: 18px; font-weight: 700; margin: 0; }}
                      .content {{ padding: 24px; color: #2c3e50; line-height: 1.6; }}
                      .notice {{ background: #fffbea; border-left: 3px solid #f39c12; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 13px; color: #7f8c8d; }}
                      .steps {{ background: #ecf0f1; padding: 12px 16px; border-radius: 6px; margin: 16px 0; }}
                      .steps ol {{ margin: 0; padding-left: 20px; }}
                      .steps li {{ margin: 6px 0; font-size: 13px; color: #2c3e50; }}
                      .footer {{ font-size: 11px; color: #95a5a6; padding: 16px 24px; text-align: center; background: #f8f9fa; }}
                      .divider {{ border: none; border-top: 1px solid #ecf0f1; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                      <div class="header">
                        <p class="brand">Digital Legacy</p>
                      </div>
                      <div class="content">
                        <p>Hello {user.username},</p>
                        <p>We have not received your heartbeat confirmation in 90 days. This is a courtesy reminder to help protect your vault.</p>
                        
                        <div class="notice">
                          <strong>Reminder:</strong> Please log in and confirm your heartbeat within 7 days to keep your vault secure. If no activity is detected after 97 days, your vault will be made available to your designated beneficiaries.
                        </div>
                        
                        <p style="font-weight: 600; color: #34495e;">How to confirm your heartbeat:</p>
                        <div class="steps">
                          <ol>
                            <li>Log in to Digital Legacy</li>
                            <li>Click "Send Heartbeat" in your dashboard</li>
                            <li>Your vault will remain secure</li>
                          </ol>
                        </div>
                        
                        <p style="font-size: 12px; color: #7f8c8d;">If you need assistance, please contact our support team.</p>
                        
                        <hr class="divider">
                      </div>
                      <div class="footer">Digital Legacy — Protecting your digital legacy securely</div>
                    </div>
                </body>
            </html>
            """
            
            send_mail(
                'Digital Legacy Heartbeat Reminder',
                f'Hello {user.username},\n\nWe have not received your heartbeat confirmation in 90 days. Please log in and confirm your heartbeat within 7 days to keep your vault secure.\n\nHow to confirm:\n1. Log in to Digital Legacy\n2. Click Send Heartbeat in your dashboard\n3. Your vault will remain secure\n\nIf no activity is detected after 97 days, your vault will be made available to your designated beneficiaries.\n\nDigital Legacy — Protecting your digital legacy securely',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=True,
            )

        # RELEASE PHASE — 97 days inactive
        death_threshold = now - datetime.timedelta(days=97)
        deceased_users = CustomUser.objects.filter(
            last_heartbeat__lt=death_threshold,
            is_deceased=False
        )
        for user in deceased_users:
            user_salt = user.crypto_salt if user.crypto_salt else "NO_SALT_FOUND"
            self.stdout.write(self.style.SUCCESS(f"Triggering release for {user.username}..."))

            beneficiaries = user.beneficiaries.all()
            for beneficiary in beneficiaries:
                # Get notes assigned to this beneficiary
                assigned_notes = beneficiary.assigned_notes.all()
                notes_text = "\n".join([
                    f"- {note.title} ({note.category})" 
                    for note in assigned_notes
                ]) or "No specific notes assigned."
                
                notes_html = "<br>".join([
                    f"<li>{note.title} ({note.category})</li>" 
                    for note in assigned_notes
                ])

                html_message = f"""
                <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width,initial-scale=1">
                        <style>
                          body {{ background: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; margin: 0; padding: 0; }}
                          .container {{ max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                          .header {{ background: #2c3e50; color: #ffffff; padding: 24px; text-align: center; }}
                          .brand {{ font-size: 18px; font-weight: 700; margin: 0; }}
                          .content {{ padding: 24px; color: #2c3e50; line-height: 1.6; }}
                          .section-title {{ font-size: 14px; font-weight: 700; margin: 16px 0 8px 0; color: #34495e; }}
                          .item-list {{ background: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 12px 0; }}
                          .item-list li {{ margin: 4px 0; font-size: 13px; color: #34495e; }}
                          .steps {{ background: #ecf0f1; padding: 12px 16px; border-left: 3px solid #3498db; margin: 16px 0; border-radius: 4px; }}
                          .steps ol {{ margin: 0; padding-left: 20px; }}
                          .steps li {{ margin: 6px 0; font-size: 13px; color: #2c3e50; }}
                          .security-warning {{ background: #fff3cd; border-left: 3px solid #f39c12; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 12px; color: #7f8c8d; }}
                          .footer {{ font-size: 11px; color: #95a5a6; padding: 16px 24px; text-align: center; background: #f8f9fa; }}
                          .divider {{ border: none; border-top: 1px solid #ecf0f1; margin: 20px 0; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                          <div class="header">
                            <p class="brand">Digital Legacy</p>
                          </div>
                          <div class="content">
                            <p>Dear {beneficiary.name},</p>
                            <p>The Digital Legacy vault of <strong>{user.username}</strong> is now available for your review.</p>
                            
                            <p class="section-title">Your Assigned Information</p>
                            <div class="item-list">
                              <ul style="margin: 0; padding-left: 20px;">
                                {notes_html if notes_html else '<li style="font-size: 13px; color: #34495e;">No specific items assigned</li>'}
                              </ul>
                            </div>
                            
                            <p class="section-title">How to Access Your Information</p>
                            <div class="steps">
                              <ol>
                                <li>Log in to Digital Legacy with your credentials</li>
                                <li>Navigate to the Claims section</li>
                                <li>Enter your email address to verify access</li>
                                <li>Review and decrypt your assigned information</li>
                              </ol>
                            </div>
                            
                            <div class="security-warning">
                              <strong>Privacy Notice:</strong> This message contains confidential information. Please keep your login credentials secure and store any decryption materials safely.
                            </div>
                            
                            <hr class="divider">
                          </div>
                          <div class="footer">Digital Legacy - Protecting your digital legacy securely</div>
                        </div>
                    </body>
                </html>
                """

                send_mail(
                    f'Digital Legacy Vault Available — {user.username}',
                    f'The Digital Legacy vault of {user.username} is now available for your review.\n\nYour Assigned Information:\n{notes_text}\n\nTo access your information:\n1. Log in to Digital Legacy with your credentials\n2. Navigate to the Claims section\n3. Enter your email address to verify access\n4. Review and decrypt your assigned information\n\nPlease keep your login credentials secure.\n\nDigital Legacy - Protecting your digital legacy securely',
                    settings.DEFAULT_FROM_EMAIL,
                    [beneficiary.email],
                    html_message=html_message,
                    fail_silently=True,
                )

            user.is_deceased = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Release complete for {user.username}"))