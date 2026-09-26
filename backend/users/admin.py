from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User, AuthIdentity, OtpChallenge
@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering=('email',); list_display=('email','display_name','is_staff','is_active'); search_fields=('email','display_name')
    fieldsets=((None,{'fields':('email','password')}),('Profile',{'fields':('display_name',)}),('Permissions',{'fields':('is_active','is_staff','is_superuser','groups','user_permissions')}),('Dates',{'fields':('last_login','date_joined')}))
    add_fieldsets=((None,{'classes':('wide',),'fields':('email','password1','password2')}),)
admin.site.register([AuthIdentity,OtpChallenge])
