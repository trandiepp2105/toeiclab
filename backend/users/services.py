"""Authentication provider verification and account linking."""
import json
from urllib.parse import urlencode
from urllib.request import urlopen
from django.conf import settings
from django.db import transaction
from .models import User, AuthIdentity

def verify_google_credential(credential):
    """Ask Google's tokeninfo endpoint to validate an ID token and audience."""
    if not settings.GOOGLE_CLIENT_ID: raise ValueError('Đăng nhập Google chưa được cấu hình.')
    url='https://oauth2.googleapis.com/tokeninfo?'+urlencode({'id_token':credential})
    try:
        with urlopen(url,timeout=8) as response: claims=json.loads(response.read().decode('utf-8'))
    except Exception as exc: raise ValueError('Không xác minh được tài khoản Google.') from exc
    if claims.get('aud')!=settings.GOOGLE_CLIENT_ID or claims.get('email_verified') not in ('true',True) or not claims.get('sub') or not claims.get('email'):
        raise ValueError('Thông tin xác thực Google không hợp lệ.')
    return claims

@transaction.atomic
def get_or_create_google_user(claims):
    """Resolve a verified Google identity to a TOEIC Lab account."""
    identity=AuthIdentity.objects.select_related('user').filter(provider='google',provider_subject=claims['sub']).first()
    if identity:return identity.user
    email=claims['email'].strip().lower(); user=User.objects.filter(email__iexact=email).first()
    if user is None:
        user = User.objects.create_user(
            email=email,
            password=None,
            display_name=claims.get('name', '')[:120],
            email_verified=True,
        )
    elif not user.email_verified:
        user.email_verified = True
        user.save(update_fields=['email_verified'])
    AuthIdentity.objects.create(user=user,provider='google',provider_subject=claims['sub'],email_at_provider=email)
    return user
