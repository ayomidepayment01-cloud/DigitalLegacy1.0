import random
import pyotp
import json
import datetime
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny 
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.db import transaction
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Beneficiary, LegacyNote, LegacyAsset, PendingRegistration
from .serializers import UserSerializer, BeneficiarySerializer, LegacyNoteSerializer, LegacyAssetSerializer, ProfileSerializer

# --- IDENTITY GATEWAY (Login) ---
class LoginView(views.APIView):
    permission_classes = [AllowAny]
    authentication_classes = [] 
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Authenticate checks credentials and if the user is_active
        user = authenticate(username=username, password=password)
        
        if user:
            # Check verification, but allow Superusers to bypass for testing/admin access
            if not user.is_verified and not user.is_superuser:
                return Response({
                    "error": "Email not verified", 
                    "needs_verification": True,
                    "email": user.email
                }, status=status.HTTP_403_FORBIDDEN)
            
            if user.two_factor_enabled:
                return Response({
                    "message": "2FA Required",
                    "require_2fa": True,
                    "username": user.username
                }, status=status.HTTP_200_OK)

            login(request, user)
            return Response({
                "message": "Login successful", 
                "username": user.username
            }, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# --- USER REGISTRATION (Atomic & Network-Resilient) ---
class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')

        # 1. Immediate check for duplicates against existing users
        if CustomUser.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=400)
        if CustomUser.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=400)

        # Also prevent duplicate pending registrations by email or username
        if PendingRegistration.objects.filter(email=email).exists() or PendingRegistration.objects.filter(username=username).exists():
            # Inform the client that a pending registration exists so it can route to verification
            return Response({"error": "Pending registration exists.", "email": email}, status=409)

        try:
            with transaction.atomic():
                otp_code = str(random.randint(100000, 999999))

                # Hash the password before storing in the pending table
                raw_password = data.get('password')
                password_hash = make_password(raw_password)

                pending = PendingRegistration.objects.create(
                    username=username,
                    email=email,
                    password_hash=password_hash,
                    phone_number=data.get('phone_number', ''),
                    crypto_salt=data.get('crypto_salt', 'default_salt'),
                    email_verification_code=otp_code,
                    expires_at=timezone.now() + datetime.timedelta(hours=24)
                )

                # Send verification email to the pending address
                # Render both text and HTML versions from templates to improve deliverability
                ctx = {
                    'username': pending.username,
                    'code': otp_code,
                    'expiry_hours': 24,
                    'verify_url': f"{request.scheme}://{request.get_host()}/verify"
                }
                html_message = render_to_string('emails/verification.html', ctx)
                text_message = render_to_string('emails/verification.txt', ctx)

                try:
                    msg = EmailMultiAlternatives(
                        subject="Verify Your Digital Legacy Account",
                        body=text_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[pending.email],
                        headers={
                            'Reply-To': settings.DEFAULT_FROM_EMAIL,
                            'X-Mailer': 'Digital Legacy',
                            'X-Priority': '3'
                        }
                    )
                    msg.attach_alternative(html_message, "text/html")
                    msg.send(fail_silently=False)
                    print(f"[EMAIL SENT] Verification email sent to {pending.email}")
                except Exception as email_error:
                    # Log the email error but do not roll back the pending registration.
                    # This ensures users can still verify via the resend endpoint once email settings are fixed.
                    print(f"[EMAIL ERROR] Failed to send email to {pending.email}: {str(email_error)}")

            return Response({
                "message": "Registration pending. Check your email for the activation code.", 
                "email": pending.email,
                "otp_code": otp_code if settings.DEBUG else None
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_msg = str(e)
            print(f"Registration Failed: {error_msg}")
            if "10060" in error_msg or "timeout" in error_msg.lower():
                 return Response({
                     "error": "Email service timed out. Pending registration not created. Please try again."
                 }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)

# --- VERIFICATION & 2FA ---
class VerifyEmailView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        try:
            pending = PendingRegistration.objects.get(email=email, email_verification_code=code)

            if pending.is_expired():
                pending.delete()
                return Response({"error": "Verification code expired."}, status=400)

            # Ensure there's no user collision
            if CustomUser.objects.filter(username=pending.username).exists() or CustomUser.objects.filter(email=pending.email).exists():
                pending.delete()
                return Response({"error": "A user with this username/email already exists."}, status=400)

            # Create the real user using the stored password hash
            with transaction.atomic():
                user = CustomUser.objects.create(
                    username=pending.username,
                    email=pending.email,
                    password=pending.password_hash,
                    phone_number=pending.phone_number,
                    crypto_salt=pending.crypto_salt,
                    is_verified=True
                )
                pending.delete()
            return Response({"message": "Account activated successfully!"})
        except PendingRegistration.DoesNotExist:
            return Response({"error": "Invalid or expired code."}, status=400)


class ResendVerificationView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        try:
            pending = PendingRegistration.objects.get(email=email)
            if pending.is_expired():
                pending.delete()
                return Response({"error": "Verification code expired."}, status=400)

            # Generate new code and update
            new_code = str(random.randint(100000, 999999))
            pending.email_verification_code = new_code
            pending.expires_at = timezone.now() + datetime.timedelta(hours=24)
            pending.save()

            # Send email
            try:
                ctx = {
                    'username': pending.username,
                    'code': new_code,
                    'expiry_hours': 24,
                    'verify_url': f"{request.scheme}://{request.get_host()}/verify"
                }
                html_message = render_to_string('emails/verification.html', ctx)
                text_message = render_to_string('emails/verification.txt', ctx)
                msg = EmailMultiAlternatives(
                    subject=f"Your new Digital Legacy verification code — {new_code}",
                    body=text_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[pending.email],
                    headers={'Reply-To': settings.DEFAULT_FROM_EMAIL}
                )
                msg.attach_alternative(html_message, "text/html")
                msg.send(fail_silently=False)
            except Exception as e:
                print(f"[EMAIL ERROR] resend failed for {pending.email}: {e}")
                return Response({"error": "Failed to send verification email."}, status=500)

            return Response({"message": "Verification code resent.", "email": pending.email})
        except PendingRegistration.DoesNotExist:
            return Response({"error": "No pending registration found for that email."}, status=404)

class Enable2FAView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        user = request.user
        secret = pyotp.random_base32()
        user.otp_base32 = secret
        user.save()
        uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="Digital Legacy")
        return Response({"secret": secret, "uri": uri})

class Confirm2FAView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        user = request.user
        code = request.data.get('code')
        totp = pyotp.totp.TOTP(user.otp_base32)
        if totp.verify(code):
            user.two_factor_enabled = True
            user.save()
            return Response({"message": "2FA protection enabled."})
        return Response({"error": "Invalid code."}, status=400)

class Disable2FAView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        user = request.user
        user.two_factor_enabled = False
        user.otp_base32 = None
        user.save()
        return Response({"message": "2FA protection disabled."})

class Verify2FALoginView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        code = request.data.get('code')
        try:
            user = CustomUser.objects.get(username=username)
            totp = pyotp.totp.TOTP(user.otp_base32)
            if totp.verify(code):
                login(request, user)
                return Response({"message": "2FA Verified.", "username": user.username})
            return Response({"error": "Invalid code"}, status=400)
        except CustomUser.DoesNotExist: return Response({"error": "User not found"}, status=404)

# --- SYSTEM MONITORING & HEARTBEAT ---
class DeceasedTriggerTest(views.APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        user = request.user
        user.is_deceased = True
        user.save()
        beneficiaries = user.beneficiaries.all()
        for b in beneficiaries:
            notes = b.assigned_notes.filter(user=user)
            if notes.exists():
                note_titles = "\n".join([f"- {n.title} ({n.get_category_display()})" for n in notes])
                send_mail(
                    subject=f"Digital Legacy Access Granted: {user.username}",
                    message=f"Hello {b.name},\n\nDigital Legacy Access Granted. System has detected inactivity.\n\nASSETS:\n{note_titles}\n\nVisit: http://localhost:3000/claim?email={b.email}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[b.email],
                    fail_silently=True, 
                )
        return Response({"status": "Inactivity Triggered", "emails_sent": beneficiaries.count()})

class HeartbeatView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        user = request.user
        user.last_heartbeat = timezone.now()
        user.is_deceased = False
        user.save()
        return Response({"message": "Heartbeat updated"})

# --- MANAGEMENT VIEWS ---
class BeneficiaryView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        if not request.user.is_authenticated: return Response([], status=200) 
        return Response(BeneficiarySerializer(Beneficiary.objects.filter(user=request.user), many=True, context={'request': request}).data)
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        serializer = BeneficiarySerializer(data=request.data)
        if serializer.is_valid():
            beneficiary = serializer.save(user=request.user)
            return Response(BeneficiarySerializer(beneficiary, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)
    def delete(self, request, pk=None):
        Beneficiary.objects.filter(pk=pk, user=request.user).delete()
        return Response({"message": "Deleted"}, status=204)

class LegacyNoteView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        if not request.user.is_authenticated: return Response([], status=200)
        return Response(LegacyNoteSerializer(LegacyNote.objects.filter(user=request.user), many=True, context={'request': request}).data)
    def post(self, request):
        if not request.user.is_authenticated: return Response({"error": "Unauthorized"}, status=401)
        b_ids = request.data.get('beneficiary_ids', [])
        serializer = LegacyNoteSerializer(data=request.data)
        if serializer.is_valid():
            note = serializer.save(user=request.user)
            note.beneficiaries.set(b_ids)
            return Response(LegacyNoteSerializer(note, context={'request': request}).data, status=201)
        return Response(serializer.errors, status=400)
    def patch(self, request, pk=None):
        try:
            note = LegacyNote.objects.get(pk=pk, user=request.user)
            serializer = LegacyNoteSerializer(note, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                updated = serializer.save()
                if 'beneficiary_ids' in request.data: updated.beneficiaries.set(request.data['beneficiary_ids'])
                return Response(LegacyNoteSerializer(updated, context={'request': request}).data)
            return Response(serializer.errors, status=400)
        except LegacyNote.DoesNotExist: return Response(status=404)
    def delete(self, request, pk=None):
        LegacyNote.objects.filter(pk=pk, user=request.user).delete()
        return Response(status=204)

# --- THE CLAIM VIEW ---
class ClaimView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        email = request.query_params.get('email', '').strip()
        all_b = Beneficiary.objects.filter(email__iexact=email)
        if not all_b.exists(): return Response({"error": "Email not found"}, status=404)
        released_b = all_b.filter(user__is_deceased=True)
        if not released_b.exists(): return Response({"error": "Vault locked"}, status=403)
        notes = LegacyNote.objects.filter(beneficiaries__in=released_b).distinct()
        assets = LegacyAsset.objects.filter(beneficiaries__in=released_b).distinct()
        return Response({
            "notes": LegacyNoteSerializer(notes, many=True, context={'request': request}).data,
            "assets": LegacyAssetSerializer(assets, many=True, context={'request': request}).data
        })

# --- AUTH UTILITIES ---
class LogoutView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        logout(request)
        return Response({"message": "Logged out"})

class MeView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        print(f"[ME] GET request - Authenticated: {request.user.is_authenticated}, User: {request.user}, Session: {request.session.session_key}")
        if not request.user.is_authenticated: 
            print(f"[ME] User not authenticated. Cookies: {request.COOKIES}")
            return Response({"error": "Not logged in"}, status=401)
        return Response(UserSerializer(request.user, context={'request': request}).data)
    def patch(self, request):
        if not request.user.is_authenticated: return Response({"error": "Not logged in"}, status=401)
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(serializer.instance, context={'request': request}).data)
        return Response(serializer.errors, status=400)

# --- PROFILE MANAGEMENT ---
class ProfileView(views.APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get current user's profile"""
        print(f"[PROFILE] GET request - Authenticated: {request.user.is_authenticated}, User: {request.user}, Session: {request.session.session_key}")
        if not request.user.is_authenticated:
            print(f"[PROFILE] User not authenticated. Cookies: {request.COOKIES}")
            return Response({"error": "Not logged in"}, status=401)
        return Response(ProfileSerializer(request.user, context={'request': request}).data)
    
    def patch(self, request):
        """Update user profile (text fields)"""
        if not request.user.is_authenticated:
            return Response({"error": "Not logged in"}, status=401)
        
        serializer = ProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(ProfileSerializer(request.user, context={'request': request}).data)
        return Response(serializer.errors, status=400)

class ProfilePictureView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Upload profile picture"""
        import os
        from django.core.files.storage import default_storage
        from django.conf import settings
        
        print(f"[UPLOAD] User authenticated: {request.user.is_authenticated}, User: {request.user}")
        if not request.user.is_authenticated:
            return Response({"error": "Not logged in"}, status=401)
        
        picture = request.FILES.get('profile_picture')
        if not picture:
            return Response({"error": "No image provided"}, status=400)
        
        try:
            print(f"[UPLOAD] Received file: {picture.name}, Size: {picture.size} bytes")
            
            # Ensure the media/profiles directory exists
            profiles_dir = os.path.join(settings.MEDIA_ROOT, 'profiles')
            os.makedirs(profiles_dir, exist_ok=True)
            print(f"[UPLOAD] Profiles directory: {profiles_dir} (exists: {os.path.exists(profiles_dir)})")
            
            # Delete old picture if exists
            if request.user.profile_picture:
                print(f"[UPLOAD] Deleting old picture: {request.user.profile_picture}")
                request.user.profile_picture.delete()
            
            # Save the file using Django's FileField (which handles upload_to='profiles/')
            print(f"[UPLOAD] Saving profile picture for user {request.user.username}: {picture.name}")
            request.user.profile_picture = picture
            request.user.save()
            
            # Verify file was actually saved to disk
            if request.user.profile_picture:
                file_path = request.user.profile_picture.path
                print(f"[UPLOAD] Attempting to verify at: {file_path}")
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    print(f"[UPLOAD] ✅ SUCCESS! File verified on disk: {file_size} bytes")
                    print(f"[UPLOAD] File will be served at: http://localhost:8000/media/profiles/{os.path.basename(file_path)}")
                else:
                    print(f"[UPLOAD] ❌ FAIL! File NOT found on disk")
                    print(f"[UPLOAD] Expected at: {file_path}")
                    print(f"[UPLOAD] Profile picture field stores: {request.user.profile_picture}")
                    print(f"[UPLOAD] Checking if directory exists: {os.path.exists(profiles_dir)}")
                    print(f"[UPLOAD] Directory contents: {os.listdir(profiles_dir) if os.path.exists(profiles_dir) else 'DIRECTORY MISSING'}")
            
            return Response(ProfileSerializer(request.user, context={'request': request}).data)
        except Exception as e:
            print(f"[UPLOAD ERROR] {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=400)
    
    def delete(self, request):
        """Delete profile picture"""
        if not request.user.is_authenticated:
            return Response({"error": "Not logged in"}, status=401)
        
        request.user.profile_picture.delete()
        request.user.save()
        return Response(ProfileSerializer(request.user, context={'request': request}).data)

# --- FILE ASSET UPLOADS ---
class AssetUploadView(views.APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response([], status=200)
        assets = LegacyAsset.objects.filter(user=request.user)
        return Response(LegacyAssetSerializer(assets, many=True, context={'request': request}).data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=401)
        
        file = request.FILES.get('file')
        title = request.data.get('title', 'New Asset')
        b_ids = request.data.get('beneficiary_ids', [])

        if not file:
            return Response({"error": "No file detected"}, status=400)

        try:
            # Read bytes and encrypt before saving
            raw = file.read()
            from .crypto import encrypt_bytes
            encrypted = encrypt_bytes(raw)

            asset = LegacyAsset.objects.create(
                user=request.user,
                title=title,
                encrypted_file=encrypted,
                original_filename=getattr(file, 'name', None),
                file_size_kb=(getattr(file, 'size', None) or len(raw)) // 1024,
                file_type=getattr(file, 'content_type', None)
            )
            
            if b_ids:
                if isinstance(b_ids, str):
                    b_ids = json.loads(b_ids)
                asset.beneficiaries.set(b_ids)

            return Response(LegacyAssetSerializer(asset, context={'request': request}).data, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    def delete(self, request, pk=None):
        LegacyAsset.objects.filter(pk=pk, user=request.user).delete()
        return Response(status=204)


# --- DOWNLOAD (Decrypt & Stream) ---
class AssetDownloadView(views.APIView):
    def get(self, request, pk=None):
        try:
            asset = LegacyAsset.objects.get(pk=pk)
        except LegacyAsset.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        # Only the owner may download via this authenticated endpoint
        if not request.user.is_authenticated or request.user != asset.user:
            return Response({"error": "Unauthorized"}, status=401)

        # If encrypted blob exists, decrypt and stream
        if getattr(asset, 'encrypted_file', None):
            try:
                from .crypto import decrypt_bytes
                content = decrypt_bytes(asset.encrypted_file)
                from django.http import HttpResponse
                response = HttpResponse(content, content_type=asset.file_type or 'application/octet-stream')
                filename = asset.original_filename or f"asset_{asset.id}"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            except Exception as e:
                return Response({"error": "Decryption failed: %s" % str(e)}, status=500)

        # Fallback: if file is stored in storage backend, redirect to its URL
        if getattr(asset, 'file', None) and asset.file:
            from django.shortcuts import redirect
            return redirect(asset.file.url)

        return Response({"error": "No file available"}, status=404)