from pathlib import Path
import os
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# --- CORE SECURITY ---
SECRET_KEY = config('SECRET_KEY', default='django-insecure-vu=+@v&*g+7(x4e*c4$)ik7)6ki(gr9qdcb#n=0915q%r$rxo(')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# --- APPS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'corsheaders',
    'legacy_core',
]

# --- MIDDLEWARE ---
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Top priority
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'legacy_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'legacy_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- REGIONAL SETTINGS ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- PROJECT SPECIFIC CONFIG ---
AUTH_USER_MODEL = 'legacy_core.CustomUser'

# --- EMAIL CONFIGURATION (SendGrid) ---
EMAIL_BACKEND = 'sendgrid_backend.SendgridBackend'
SENDGRID_API_KEY = config('SENDGRID_API_KEY', default=None)

# Fallback to Gmail if SendGrid not configured
if not SENDGRID_API_KEY:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp.gmail.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_USE_SSL = False
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='helpdeskdigitallegacy@gmail.com')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='jidoopjmxfzjbmof')
    EMAIL_TIMEOUT = 60

if SENDGRID_API_KEY:
    # When using SendGrid we prefer a verified sender/domain
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Digital Legacy <noreply@digitallegacy.io>')
    SERVER_EMAIL = config('SERVER_EMAIL', default='Digital Legacy <noreply@digitallegacy.io>')
else:
    # For SMTP (Gmail) use the authenticated account as the from address to reduce rejections
    DEFAULT_FROM_EMAIL = f"{EMAIL_HOST_USER}"
    SERVER_EMAIL = f"{EMAIL_HOST_USER}"
# --- URL ROUTING & CORS ---
APPEND_SLASH = True
CORS_ALLOW_CREDENTIALS = True 
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-csrftoken',
]

cors_origins = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173').split(',')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# --- SESSION & COOKIE SAFETY ---
SESSION_COOKIE_SAMESITE = 'Lax'  # Standard setting for localhost development
CSRF_COOKIE_SAMESITE = 'Lax'    # Standard setting for localhost development
SESSION_COOKIE_HTTPONLY = True 
SESSION_COOKIE_SECURE = False  # Set to False in DEBUG for localhost (no HTTPS needed)
CSRF_COOKIE_SECURE = False     # Set to False in DEBUG for localhost (no HTTPS needed)
SESSION_COOKIE_AGE = 3600  # 1 hour

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
import os

# --- MEDIA FILE CONFIGURATION ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Debug: Print MEDIA_ROOT path on startup
print(f"\n🔍 MEDIA_ROOT configured to: {MEDIA_ROOT}")
print(f"🔍 MEDIA_URL configured to: {MEDIA_URL}")
print(f"🔍 Folder exists: {os.path.exists(MEDIA_ROOT)}\n")

# During local development, print emails to console to avoid external delivery issues
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'