# Generated for Contact page message storage.

import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ocrApp", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContactMessage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("email", models.EmailField(max_length=254)),
                ("subject", models.CharField(blank=True, default="", max_length=200)),
                ("message", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Contact Message",
                "verbose_name_plural": "Contact Messages",
                "ordering": ["-created_at"],
            },
        ),
    ]
