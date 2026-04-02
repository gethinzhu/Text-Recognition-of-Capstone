from django.contrib import admin
from .models import OCRImage


@admin.register(OCRImage)
class OCRImageAdmin(admin.ModelAdmin):
    list_display = ("id", "original_filename", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("original_filename",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
