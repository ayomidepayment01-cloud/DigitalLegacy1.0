from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import datetime

class CustomUser(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    crypto_salt = models.CharField(max_length=255, blank=True, null=True)
    last_heartbeat = models.DateTimeField(default=timezone.now)
    is_deceased = models.BooleanField(default=False)
    threshold_days = models.IntegerField(default=180)

    # --- SECURITY FIELDS ---
    is_verified = models.BooleanField(default=False)
    email_verification_code = models.CharField(max_length=6, blank=True, null=True)
    otp_base32 = models.CharField(max_length=255, blank=True, null=True) 
    two_factor_enabled = models.BooleanField(default=False)

    # --- PROFILE FIELDS ---
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    full_legal_name = models.CharField(max_length=255, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    state_province = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_updated_at = models.DateTimeField(auto_now=True)

    def days_since_heartbeat(self):
        delta = timezone.now() - self.last_heartbeat
        return delta.days

    def days_remaining(self):
        return max(0, self.threshold_days - self.days_since_heartbeat())

    def check_inactivity(self):
        threshold = timezone.now() - datetime.timedelta(days=self.threshold_days)
        if self.last_heartbeat < threshold:
            self.is_deceased = True
            self.save()
        return self.is_deceased

    def __str__(self):
        return self.username


class Beneficiary(models.Model):
    RELATIONSHIP_CHOICES = [
        ('spouse', 'Spouse / Partner'),
        ('parent', 'Parent'),
        ('child', 'Child'),
        ('sibling', 'Sibling'),
        ('friend', 'Friend'),
        ('business', 'Business Partner'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='beneficiaries'
    )
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    relationship = models.CharField(
        max_length=20, choices=RELATIONSHIP_CHOICES, default='other'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Beneficiary of {self.user.username})"


class LegacyNote(models.Model):
    CATEGORY_CHOICES = [
        ('social', 'Social Media'),
        ('finance', 'Finance / Banking'),
        ('crypto', 'Crypto / NFTs'),
        ('email', 'Email Accounts'),
        ('devices', 'Devices / Passwords'),
        ('message', 'Personal Message'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='notes'
    )
    beneficiaries = models.ManyToManyField(
        Beneficiary, 
        blank=True, 
        related_name='assigned_notes'
    )
    title = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default='other'
    )
    encrypted_content = models.TextField()
    decryption_hint = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (Owned by {self.user.username})"

# --- NEW: FILE & IMAGE ASSETS ---
class LegacyAsset(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='assets'
    )
    beneficiaries = models.ManyToManyField(
        Beneficiary, 
        blank=True, 
        related_name='assigned_assets'
    )
    title = models.CharField(max_length=200)
    
    # This stores files in a folder structured by year and month (kept for backward compatibility)
    file = models.FileField(upload_to='vault/%Y/%m/', blank=True, null=True)

    # Encrypted blob stored in the DB (optional). For production consider using object storage like S3.
    encrypted_file = models.BinaryField(blank=True, null=True)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    file_size_kb = models.IntegerField(blank=True, null=True)
    file_type = models.CharField(max_length=50, blank=True, null=True) # e.g., 'application/pdf', 'image/png'
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (Asset of {self.user.username})"


# Temporary storage for registrations awaiting email verification
class PendingRegistration(models.Model):
    username = models.CharField(max_length=150)
    email = models.EmailField()
    password_hash = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    crypto_salt = models.CharField(max_length=255, blank=True, null=True)
    email_verification_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Pending: {self.username} <{self.email}>"