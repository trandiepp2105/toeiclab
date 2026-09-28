"""Validated request payloads for authentication and profile endpoints."""
from rest_framework import serializers
from users.password_policy import POLICY_MESSAGE, validate_password_policy

class RegisterOtpRequestSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password=serializers.CharField(min_length=8,max_length=128,write_only=True,error_messages={'min_length':POLICY_MESSAGE,'max_length':'Mật khẩu không được dài quá 128 ký tự.'})
    display_name=serializers.CharField(max_length=120,required=False,allow_blank=True)
    def validate_email(self,value):return value.strip().lower()
    def validate_password(self,value):return validate_password_policy(value)

class RegisterOtpVerifySerializer(serializers.Serializer):
    """Validate the OTP submitted to finish a pending registration."""

    email = serializers.EmailField()
    otp = serializers.RegexField(r'^\d{6}$')

    def validate_email(self, value):
        """Normalize the lookup key used by the pending registration."""
        return value.strip().lower()

class LoginSerializer(serializers.Serializer):
    email=serializers.EmailField()
    password=serializers.CharField(write_only=True)
    def validate_email(self,value):return value.strip().lower()

class GoogleCredentialSerializer(serializers.Serializer):
    credential=serializers.CharField(min_length=20,write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    current_password=serializers.CharField(write_only=True)
    new_password=serializers.CharField(min_length=8,max_length=128,write_only=True,error_messages={'min_length':POLICY_MESSAGE,'max_length':'Mật khẩu không được dài quá 128 ký tự.'})
    def validate_new_password(self,value):return validate_password_policy(value)

class PasswordResetRequestSerializer(serializers.Serializer):
    """Validate an email address requesting a password reset OTP."""
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()

class PasswordResetVerifySerializer(serializers.Serializer):
    """Validate the email and six-digit OTP submitted for password reset."""
    email = serializers.EmailField()
    otp = serializers.RegexField(r'^\d{6}$')

    def validate_email(self, value):
        return value.strip().lower()

class PasswordResetCompleteSerializer(serializers.Serializer):
    """Validate a short-lived reset token and the requested new password."""
    reset_token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, max_length=128, write_only=True, error_messages={'min_length': POLICY_MESSAGE, 'max_length': 'Mật khẩu không được dài quá 128 ký tự.'})
    def validate_new_password(self,value):return validate_password_policy(value)

class ProfileSerializer(serializers.Serializer):
    id=serializers.CharField(read_only=True)
    email=serializers.EmailField(read_only=True)
    display_name=serializers.CharField(max_length=120)
    is_staff=serializers.BooleanField(read_only=True)
