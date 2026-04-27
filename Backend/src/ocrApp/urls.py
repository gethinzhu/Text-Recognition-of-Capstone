from django.urls import path

from . import views

app_name = "ocrApp"

urlpatterns = [
    # Upload image and run OCR
    path("upload/", views.ImageUploadAndRecogniseView.as_view(), name="upload"),

    # Process direct text input without image upload validation
    path("text/", views.TextRecogniseView.as_view(), name="text"),

    # Remaining OpenRouter credits
    path("credits/", views.CreditsView.as_view(), name="credits"),

    # Get or delete a single OCR result
    # path("result/<uuid:pk>/", views.OCRResultDetailView.as_view(), name="result-detail"),

    # # List all OCR history records
    # path("history/", views.OCRHistoryListView.as_view(), name="history-list"),
]
