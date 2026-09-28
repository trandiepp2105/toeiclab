"""Shared password requirements enforced by every password-setting API."""
import re

from rest_framework import serializers


POLICY_MESSAGE = (
    'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số '
    'và ít nhất một ký tự đặc biệt.'
)


def validate_password_policy(value):
    """Reject passwords that do not satisfy the application's complexity policy."""
    if (
        len(value) < 8
        or not re.search(r'[a-z]', value)
        or not re.search(r'[A-Z]', value)
        or not re.search(r'[0-9]', value)
        or not re.search(r'[^A-Za-z0-9\s]', value)
    ):
        raise serializers.ValidationError(POLICY_MESSAGE)
    return value
