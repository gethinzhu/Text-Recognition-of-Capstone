from django.contrib import admin
from .models import ContactMessage, OCRImage


@admin.register(OCRImage)
class OCRImageAdmin(admin.ModelAdmin):
    list_display = ("id", "original_filename", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("original_filename",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "subject", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("id", "created_at")
    ordering = ("-created_at",)
