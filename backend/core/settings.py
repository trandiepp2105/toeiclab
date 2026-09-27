"""Environment-driven settings for the TOEIC Lab modular monolith."""
import os
import sys
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'local-development-only-change-me')
DEBUG = os.getenv('DJANGO_DEBUG', 'false').lower() == 'true'
ALLOWED_HOSTS = [h for h in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend').split(',') if h]

INSTALLED_APPS = [
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'drf_spectacular', 'corsheaders', 'users', 'content', 'vocabulary', 'learning',
    'assessments', 'knowledge',
]
# The project schema is owned by mysql/init/*.sql. Django must not look for
# deleted project migration files or attempt to mutate the runtime database.
MIGRATION_MODULES = {
    'users': None,
    'content': None,
    'vocabulary': None,
    'learning': None,
    'assessments': None,
    'knowledge': None,
}
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.RequestObservabilityMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware', 'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'core.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True,
              'OPTIONS': {'context_processors': ['django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'core.wsgi.application'

if os.getenv('MYSQL_HOST'):
    DATABASES = {'default': {'ENGINE': 'django.db.backends.mysql', 'NAME': os.getenv('MYSQL_DATABASE', 'toeiclab'),
        'USER': os.getenv('MYSQL_USER', 'toeiclab'), 'PASSWORD': os.getenv('MYSQL_PASSWORD', ''),
        'HOST': os.getenv('MYSQL_HOST', 'mysql'), 'PORT': os.getenv('MYSQL_PORT', '3306'),
        'OPTIONS': {'charset': 'utf8mb4', 'init_command': "SET sql_mode='STRICT_TRANS_TABLES'"}}}
else:
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': os.getenv('SQLITE_PATH', BASE_DIR / 'db.sqlite3')}}

# The production schema is owned by MySQL SQL initialization. Tests use an
# isolated SQLite database so Django's test runner can build unmigrated apps
# without changing or cloning the application MySQL volume.
if 'test' in sys.argv or os.getenv('DJANGO_TEST') == 'true':
    DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:'}}

AUTH_USER_MODEL = 'users.User'
AUTH_PASSWORD_VALIDATORS = [{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE = 'vi-vn'; TIME_ZONE = 'Asia/Ho_Chi_Minh'; USE_I18N = True; USE_TZ = True
STATIC_URL = '/django-static/'; STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'; MEDIA_ROOT = Path(os.getenv('MEDIA_ROOT', BASE_DIR / 'media'))
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
CORS_ALLOWED_ORIGINS = [v for v in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',') if v]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [v for v in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://localhost:8080').split(',') if v]
REST_FRAMEWORK = {'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication'],
                  'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
                  'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
                  'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination', 'PAGE_SIZE': 50,
                  'EXCEPTION_HANDLER': 'core.exceptions.api_exception_handler'}
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
SPECTACULAR_SETTINGS = {
    'TITLE': 'TOEIC Lab API',
    'DESCRIPTION': 'API học từ vựng, luyện Part và làm bài thi TOEIC.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': os.getenv('REDIS_URL', 'redis://redis:6379/1')}} if os.getenv('REDIS_URL') else {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', ''); EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', ''); EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').lower() == 'true'; DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'TOEIC Lab <no-reply@toeiclab.local>')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
API_SLOW_REQUEST_MS = int(os.getenv('API_SLOW_REQUEST_MS', '1000'))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'json': {'()': 'core.observability.JsonLogFormatter'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'stream': 'ext://sys.stdout', 'formatter': 'json'}},
    'root': {'handlers': ['console'], 'level': 'DEBUG' if DEBUG else 'INFO'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        # Unhandled exceptions are logged once by RequestObservabilityMiddleware;
        # suppress Django's duplicate request logger entry.
        'django.request': {'handlers': ['console'], 'level': 'CRITICAL', 'propagate': False},
        'django.db.backends': {'handlers': ['console'], 'level': 'ERROR', 'propagate': False},
        'toeiclab': {'handlers': ['console'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
    },
}
