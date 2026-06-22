from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.views.static import serve
from legacy_core.views import (
    LoginView,
    LogoutView,
    MeView,
    HeartbeatView,
    DeceasedTriggerTest,
    RegisterView,
    BeneficiaryView,
    LegacyNoteView,
    ClaimView,
    VerifyEmailView,
    Enable2FAView,
    Confirm2FAView,
    Disable2FAView,
    Verify2FALoginView,
    AssetUploadView,
    AssetDownloadView,
    ResendVerificationView,
    ProfileView,
    ProfilePictureView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # --- Auth & Profile ---
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/me/', MeView.as_view(), name='me'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/profile/picture/', ProfilePictureView.as_view(), name='profile-picture'),

    # --- Security & Verification ---
    path('api/verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('api/resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('api/enable-2fa/', Enable2FAView.as_view(), name='enable-2fa'),
    path('api/confirm-2fa/', Confirm2FAView.as_view(), name='confirm-2fa'),
    path('api/disable-2fa/', Disable2FAView.as_view(), name='disable-2fa'),
    path('api/verify-2fa-login/', Verify2FALoginView.as_view(), name='verify-2fa-login'),
    
    # --- System Logic ---
    path('api/heartbeat/', HeartbeatView.as_view(), name='heartbeat'),
    path('api/test-trigger/', DeceasedTriggerTest.as_view(), name='test-trigger'),
    
    # --- Beneficiaries ---
    path('api/beneficiaries/', BeneficiaryView.as_view(), name='beneficiaries'),
    path('api/beneficiaries/<int:pk>/', BeneficiaryView.as_view(), name='beneficiary-detail'),
    
    # --- Legacy Vault (Notes & Files) ---
    path('api/notes/', LegacyNoteView.as_view(), name='notes'),
    path('api/notes/<int:pk>/', LegacyNoteView.as_view(), name='note-detail'),
    path('api/assets/', AssetUploadView.as_view(), name='assets'),
    path('api/assets/<int:pk>/', AssetUploadView.as_view(), name='asset-detail'),
    path('api/assets/<int:pk>/download/', AssetDownloadView.as_view(), name='asset-download'),

    # --- Claim Portal ---
    path('api/claim/', ClaimView.as_view(), name='claim'),
]

# Serve media files locally
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]