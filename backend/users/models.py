"""Account identity and application-level role-based access control."""
import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Create email-addressed accounts with a least-privilege default role."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email là bắt buộc")
        user = self.model(email=self.normalize_email(email).lower(), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def _assign_role(self, user, role_code, role_name):
        role, _ = Role.objects.get_or_create(
            code=role_code,
            defaults={"name": role_name, "is_system": True},
        )
        UserRole.objects.get_or_create(user=user, role=role)

    def create_user(self, email, password=None, **extra_fields):
        """Create a standard learner and attach the least-privilege role."""
        extra_fields.setdefault("is_superuser", False)
        user = self._create_user(email, password, **extra_fields)
        self._assign_role(user, "learner", "Học viên")
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create a Django superuser and attach the application super-admin role."""
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser phải có is_superuser=True.")
        user = self._create_user(email, password, **extra_fields)
        self._assign_role(user, "super_admin", "Quản trị viên toàn quyền")
        return user


class Role(models.Model):
    """A named set of application permissions assignable to many users."""

    code = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    permissions = models.ManyToManyField(
        "AdminPermission",
        through="RolePermission",
        related_name="roles",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name", "id")

    def __str__(self):
        return self.name


class AdminPermission(models.Model):
    """A stable application capability granted to a role."""

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    module = models.CharField(max_length=40)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ("module", "code")

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Join a role to one application permission."""

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(
        AdminPermission,
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("role", "permission"), name="unique_role_permission"),
        ]


class UserRole(models.Model):
    """Join a user to a role and record who granted it."""

    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")
    assigned_by = models.ForeignKey(
        "User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="granted_user_roles",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "role"), name="unique_user_role"),
        ]
        indexes = [models.Index(fields=("role", "user"), name="users_role_user_idx")]


class User(AbstractUser):
    """Application account; admin access is derived from assigned roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    # Remove AbstractUser's persisted boolean. ``is_staff`` below remains a
    # compatibility property for Django admin and the existing admin client.
    is_staff = None
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=120, blank=True)
    email_verified = models.BooleanField(default=False)
    roles = models.ManyToManyField(
        Role,
        through=UserRole,
        through_fields=("user", "role"),
        related_name="users",
    )
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def is_staff(self):
        """Expose Django's staff contract from RBAC without a user-table column."""
        return self.is_superuser or self.has_admin_permission("admin.access")

    def get_admin_permission_codes(self):
        """Return distinct capability codes granted by all assigned roles."""
        return set(
            AdminPermission.objects.filter(roles__users=self).values_list("code", flat=True)
        )

    def has_admin_permission(self, permission_code):
        """Check an application capability, with Django superuser override."""
        if self.is_superuser:
            return True
        return AdminPermission.objects.filter(
            code=permission_code,
            roles__users=self,
        ).exists()


class AuthIdentity(models.Model):
    """A linked external identity provider for an application account."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="identities")
    provider = models.CharField(max_length=24)
    provider_subject = models.CharField(max_length=255)
    email_at_provider = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("provider", "provider_subject"),
                name="unique_auth_identity",
            ),
        ]


class OtpChallenge(models.Model):
    """Persist a short-lived, hashed email verification or reset challenge."""

    email = models.EmailField(db_index=True)
    purpose = models.CharField(max_length=24, default="register")
    display_name = models.CharField(max_length=120, blank=True)
    password_hash = models.CharField(max_length=256)
    code_hash = models.CharField(max_length=256)
    expires_at = models.DateTimeField()
    sent_at = models.DateTimeField(auto_now_add=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
