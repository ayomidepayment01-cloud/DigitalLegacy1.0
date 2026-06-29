from django.core.mail import EmailMultiAlternatives
from django.conf import settings

def send_verification_email(to_email, html_content, text_content=None, subject="Verify Your Digital Legacy Account"):
    try:
        # Default fallback to the settings configuration
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@digitallegacy.com')
        
        if not text_content:
            text_content = "Please enable HTML to view this email."

        # Construct the email using Django's built in tools
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email]
        )
        msg.attach_alternative(html_content, "text/html")
        
        # This will use the Brevo SMTP backend defined in settings.py
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"SMTP error: {e}")
        return False
