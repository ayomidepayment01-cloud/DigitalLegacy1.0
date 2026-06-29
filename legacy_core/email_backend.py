from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
import urllib.request
import urllib.error
import json


class BrevoHTTPBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        num_sent = 0
        # We use EMAIL_HOST_PASSWORD as the Brevo API key
        api_key = getattr(settings, 'EMAIL_HOST_PASSWORD', None)
        if not api_key:
            print("[BrevoHTTPBackend] ERROR: EMAIL_HOST_PASSWORD (API Key) not configured in settings.")
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
                
                # Build payload for Brevo API
                payload = {
                    "sender": {
                        "email": message.from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@digitallegacy.com')
                    },
                    "to": [{"email": to_email} for to_email in message.to],
                    "subject": message.subject,
                }
                
                if html_content:
                    payload["htmlContent"] = html_content
                if message.body:
                    payload["textContent"] = message.body

                # Send HTTP Request to Brevo v3 API
                req = urllib.request.Request(
                    "https://api.brevo.com/v3/smtp/email",
                    data=json.dumps(payload).encode("utf-8"),
                    headers={
                        "api-key": api_key,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    },
                    method="POST"
                )
                
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_body = response.read().decode("utf-8")
                    print(f"[BrevoHTTPBackend] Email successfully sent to {message.to}")
                    num_sent += 1
            except urllib.error.HTTPError as http_err:
                err_body = http_err.read().decode("utf-8")
                print(f"[BrevoHTTPBackend] HTTP Error {http_err.code} sending to {message.to}: {err_body}")
                if not self.fail_silently:
                    raise
            except Exception as e:
                print(f"[BrevoHTTPBackend] ERROR sending to {message.to}: {e}")
                if not self.fail_silently:
                    raise

        return num_sent
