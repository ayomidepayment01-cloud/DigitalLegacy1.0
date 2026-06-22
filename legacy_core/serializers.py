from rest_framework import serializers
from .models import CustomUser, Beneficiary, LegacyNote, LegacyAsset

class LegacyAssetSerializer(serializers.ModelSerializer):
    """Serializer for file assets. Exposes a download URL which decrypts server-side if needed."""
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = LegacyAsset
        fields = [
            'id', 'title', 'original_filename', 'file_type', 'file_size_kb', 'file', 'file_url', 'beneficiaries', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_url', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') and self.context else None
        # If encrypted blob exists, route to download endpoint which will decrypt server-side
        if getattr(obj, 'encrypted_file', None):
            try:
                base = f"/api/assets/{obj.id}/download/"
                return request.build_absolute_uri(base) if request else base
            except Exception:
                return f"/api/assets/{obj.id}/download/"
        # Fallback to stored file URL
        if getattr(obj, 'file', None):
            try:
                return request.build_absolute_uri(obj.file.url) if request else obj.file.url
            except Exception:
                return obj.file.url
        return None

class LegacyNoteSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='user.username')
    is_unlinked = serializers.BooleanField(read_only=True)

    class Meta:
        model = LegacyNote
        fields = [
            'id', 'title', 'category', 'decryption_hint',
            'encrypted_content', 'beneficiaries', 'created_at', 
            'is_unlinked', 'owner_name'
        ]

class BeneficiarySerializer(serializers.ModelSerializer):
    # Removed nested relations to prevent circular loops and bloat
    # Dashboard just needs: id, name, email, phone, relationship, created_at

    class Meta:
        model = Beneficiary
        fields = [
            'id', 'name', 'email', 'phone',
            'relationship', 'created_at'
        ]

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates"""
    profile_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'profile_picture', 'profile_picture_url',
            'full_legal_name', 'date_of_birth', 'phone_number',
            'country', 'state_province', 'address', 'bio',
            'profile_updated_at', 'two_factor_enabled'
        ]
        read_only_fields = ['id', 'username', 'profile_updated_at', 'two_factor_enabled']
    
    def get_profile_picture_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') and self.context else None
        if obj.profile_picture:
            try:
                return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
            except Exception:
                return obj.profile_picture.url
        return None

class UserSerializer(serializers.ModelSerializer):
    beneficiaries = BeneficiarySerializer(many=True, read_only=True)
    notes = LegacyNoteSerializer(many=True, read_only=True)
    assets = LegacyAssetSerializer(many=True, read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    
    days_remaining = serializers.SerializerMethodField()
    days_since_heartbeat = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number',
            'profile_picture_url', 'full_legal_name',
            'last_heartbeat', 'is_deceased', 'threshold_days',
            'days_remaining', 'days_since_heartbeat',
            'beneficiaries', 'notes', 'assets', 'two_factor_enabled'
        ]

    def get_days_remaining(self, obj):
        return obj.days_remaining()

    def get_days_since_heartbeat(self, obj):
        return obj.days_since_heartbeat()
    
    def get_profile_picture_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') and self.context else None
        if obj.profile_picture:
            try:
                return request.build_absolute_uri(obj.profile_picture.url) if request else obj.profile_picture.url
            except Exception:
                return obj.profile_picture.url
        return None
