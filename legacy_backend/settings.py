from pathlib import Path
import os
import dj_database_url
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# --- CORE SECURITY ---
SECRET_KEY = config('SECRET_KEY', default='django-insecure-vu=+@v&*g+7(x4e*c4$)ik7)6ki(gr9qdcb#n=0915q%r$rxo(')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,digital-legacy-backend.onrender.com').split(',')

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
    'whitenoise.middleware.WhiteNoiseMiddleware',
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

db_config = dj_database_url.config(
    default=config('DATABASE_URL', default=f'sqlite:///{BASE_DIR}/db.sqlite3'),
    conn_max_age=600
)

# Enforce SSL for PostgreSQL in production (e.g., Render/Neon/Supabase)
if not DEBUG and db_config.get('ENGINE') == 'django.db.backends.postgresql':
    db_config['OPTIONS'] = {
        'sslmode': 'require',
    }

DATABASES = {
    'default': db_config
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
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- PROJECT SPECIFIC CONFIG ---
AUTH_USER_MODEL = 'legacy_core.CustomUser'

# --- EMAIL CONFIGURATION ---
import socket

# Force IPv4 to prevent "Network is unreachable" errors on cloud environments
socket.setdefaulttimeout(30)

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp-relay.brevo.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = 'no-reply@digitallegacy.com' # Use your verified domain/email
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# --- URL ROUTING & CORS ---
APPEND_SLASH = True
CORS_ALLOW_CREDENTIALS = True 
cors_origins = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173').split(',')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins] + [
    "https://digital-legacy-1-0.vercel.app",
    "https://digital-legacy1-0-tl8v.vercel.app"
]

# Synchronize CSRF trusted origins with CORS origins to prevent CSRF errors in production
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# --- SESSION & COOKIE SAFETY ---
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_SAMESITE = 'None'
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
else:
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

SESSION_COOKIE_HTTPONLY = True 
SESSION_COOKIE_AGE = 3600

# --- REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'legacy_core.authentication.CsrfExemptSessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}


# --- MEDIA FILE CONFIGURATION ---
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Debug: Print MEDIA_ROOT path on startup
print(f"\n MEDIA_ROOT configured to: {MEDIA_ROOT}")
print(f" MEDIA_URL configured to: {MEDIA_URL}")
print(f" Folder exists: {os.path.exists(MEDIA_ROOT)}\n")

# During local development, print emails to console to avoid external delivery issues
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'