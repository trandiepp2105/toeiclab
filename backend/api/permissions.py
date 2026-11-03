"""Role-based permission checks for the application administration API."""
from rest_framework.permissions import BasePermission


class HasAdminPermission(BasePermission):
    """Authorize an admin endpoint from its resource and HTTP operation.

    Read methods require ``<resource>.view`` and every write method requires
    ``<resource>.manage``. User role assignment and role CRUD are always
    governed by ``roles.manage`` regardless of the URL's parent resource.
    Django superusers retain an explicit global override.
    """

    message = "Tài khoản không có quyền thực hiện thao tác này."

    RESOURCE_BY_ROUTE_PREFIX = {
        "admin-user-role": "roles",
        "admin-role": "roles",
        "admin-users": "users",
        "admin-user-detail": "users",
        "admin-user-identity": "users",
        "admin-vocabulary": "vocabulary",
        "admin-grammar": "knowledge",
        "admin-part-tips": "knowledge",
        "admin-exams": "exams",
        "admin-exam": "exams",
        "admin-questions": "exams",
        "admin-question": "exams",
    }

    def has_permission(self, request, view):
        """Require an authenticated account with the mapped role capability."""
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True

        route_name = getattr(request.resolver_match, "url_name", "") or ""
        if route_name == "admin-overview":
            permission_code = "dashboard.view"
        elif route_name.startswith("admin-user-role") or route_name.startswith("admin-role"):
            permission_code = "roles.view" if request.method in {"GET", "HEAD", "OPTIONS"} else "roles.manage"
        else:
            resource = next(
                (
                    resource
                    for route_prefix, resource in self.RESOURCE_BY_ROUTE_PREFIX.items()
                    if route_name.startswith(route_prefix)
                ),
                None,
            )
            if resource is None:
                return False
            operation = "view" if request.method in {"GET", "HEAD", "OPTIONS"} else "manage"
            permission_code = f"{resource}.{operation}"

        if user.has_admin_permission(permission_code):
            return True
        # Management rights include read access to the same resource so an
        # administrator can inspect what they are allowed to change.
        if permission_code.endswith(".view"):
            return user.has_admin_permission(permission_code.removesuffix(".view") + ".manage")
        return False
