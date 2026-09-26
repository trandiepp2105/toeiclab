"""Account and one-time-code persistence."""
import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    """Create users identified by a case-insensitive email address."""
    use_in_migrations = True
    def _create_user(self, email, password, **extra_fields):
        if not email: raise ValueError('Email là bắt buộc')
        user = self.model(email=self.normalize_email(email).lower(), **extra_fields)
        user.set_password(password); user.save(using=self._db); return user
    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False); extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True); extra_fields.setdefault('is_superuser', True); extra_fields.setdefault('is_active', True)
        return self._create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Application user with email as the login identifier."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=120, blank=True)
    email_verified = models.BooleanField(default=False)
    USERNAME_FIELD = 'email'; REQUIRED_FIELDS = []
    objects = UserManager()
    def __str__(self): return self.email

class AuthIdentity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='identities')
    provider = models.CharField(max_length=24)
    provider_subject = models.CharField(max_length=255)
    email_at_provider = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: constraints = [models.UniqueConstraint(fields=['provider','provider_subject'], name='unique_auth_identity')]

class OtpChallenge(models.Model):
    email = models.EmailField(db_index=True); purpose = models.CharField(max_length=24, default='register')
    display_name = models.CharField(max_length=120, blank=True)
    password_hash = models.CharField(max_length=256); code_hash = models.CharField(max_length=256)
    expires_at = models.DateTimeField(); sent_at = models.DateTimeField(auto_now_add=True)
    attempts = models.PositiveSmallIntegerField(default=0); verified_at = models.DateTimeField(null=True, blank=True)
