from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # This tells the dashboard which columns to show in the list
    list_display = ['email', 'username', 'last_heartbeat', 'is_deceased', 'is_staff']
    
    # This adds your custom fields to the "Edit User" page
    fieldsets = UserAdmin.fieldsets + (
        ("Legacy Security", {'fields': ('crypto_salt', 'last_heartbeat', 'is_deceased')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)