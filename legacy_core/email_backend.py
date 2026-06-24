from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import urllib.request
import json

class ResendBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        num_sent = 0
        api_key = getattr(settings, 'RESEND_API_KEY', None)
        if not api_key:
            print("[ResendBackend] ERROR: RESEND_API_KEY not configured in settings.")
            return 0
            
        for message in email_messages:
            try:
                # Extract HTML version if present
                html_content = None
                if hasattr(message, 'alternatives'):
                    for alt in message.alternatives:
                        if alt[1] == 'text/html':
                            html_content = alt[0]
                            break
                
                # Build payload
                payload = {
                    "from": message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'onboarding@resend.dev'),
                    "to": message.to,
                    "subject": message.subject,
                }
                
                if html_content:
                    payload["html"] = html_content
                else:
                    payload["text"] = message.body

                # Send HTTP Request
                req = urllib.request.Request(
                    "https://api.resend.com/emails",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode("utf-8")
                    print(f"[ResendBackend] Email successfully sent to {message.to}")
                    num_sent += 1
            except Exception as e:
                print(f"[ResendBackend] ERROR sending to {message.to}: {e}")
                if not self.fail_silently:
                    raise
                    
        return num_sent
