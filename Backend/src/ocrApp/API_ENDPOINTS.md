# OCR Backend API Endpoints

Base URL: `http://localhost:8000/api/ocr/`

---

## 1. Upload Image & Run OCR

**`POST /api/ocr/upload/`**

Upload a newspaper image (.TIF, .JPG, .PNG, etc.). The backend converts it to JPG and calls Gemini 3.1 Pro for Fraktur text recognition.

### Request

- Content-Type: `multipart/form-data`
- Body:

| Field   | Type | Required | Description                      |
|---------|------|----------|----------------------------------|
| `image` | File | Yes      | Image file (JPEG, PNG, TIFF, BMP, GIF) |

### Response (Success — 200)

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "original_filename": "newspaper_page1.tif",
    "image": "/media/ocr_uploads/2026/03/29/newspaper_page1.tif",
    "recognised_text": "Der Stürmer\nNürnberger Wochenblatt zum Kampfe um die Wahrheit...",
    "status": "completed",
    "error_message": "",
    "created_at": "2026-03-29T14:30:00.000000Z",
    "updated_at": "2026-03-29T14:30:05.000000Z"
}
```

### Response (OCR Failed — 500)

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "original_filename": "newspaper_page1.tif",
    "image": "/media/ocr_uploads/2026/03/29/newspaper_page1.tif",
    "recognised_text": "",
    "status": "failed",
    "error_message": "Gemini API error: ...",
    "created_at": "2026-03-29T14:30:00.000000Z",
    "updated_at": "2026-03-29T14:30:05.000000Z"
}
```

### Response (Invalid File — 400)

```json
{
    "image": ["Unsupported file type 'text/plain'. Allowed types: JPEG, PNG, TIFF, BMP, GIF."]
}
```

---

## 2. Get OCR Result Detail

**`GET /api/ocr/result/<uuid:id>/`**

Retrieve the full OCR result for a specific record by its UUID.

### Response (200)

```json
{
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "original_filename": "newspaper_page1.tif",
    "image": "/media/ocr_uploads/2026/03/29/newspaper_page1.tif",
    "recognised_text": "Der Stürmer\nNürnberger Wochenblatt...",
    "status": "completed",
    "error_message": "",
    "created_at": "2026-03-29T14:30:00.000000Z",
    "updated_at": "2026-03-29T14:30:05.000000Z"
}
```

### Response (404)

```json
{
    "detail": "No OCRImage matches the given query."
}
```

---

## 3. Delete OCR Record

**`DELETE /api/ocr/result/<uuid:id>/`**

Delete a specific OCR record and its associated image.

### Response (204)

No content — record successfully deleted.

---

## 4. List OCR History

**`GET /api/ocr/history/`**

Retrieve all OCR records, ordered by newest first.

### Response (200)

```json
[
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "original_filename": "newspaper_page1.tif",
        "status": "completed",
        "created_at": "2026-03-29T14:30:00.000000Z"
    },
    {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "original_filename": "newspaper_page2.tif",
        "status": "failed",
        "created_at": "2026-03-29T13:00:00.000000Z"
    }
]
```

---

## Status Values

| Value        | Meaning                                 |
|--------------|-----------------------------------------|
| `pending`    | Image uploaded, OCR not yet started     |
| `processing` | OCR is running                          |
| `completed`  | OCR finished successfully               |
| `failed`     | OCR failed (see `error_message`)        |

---

## JSON Key Summary (Frontend ↔ Backend Contract)

### Upload Request Keys
| Key     | Type   | Direction      |
|---------|--------|----------------|
| `image` | File   | Frontend → Backend |

### Full Result Response Keys
| Key                | Type     | Direction       |
|--------------------|----------|-----------------|
| `id`               | UUID     | Backend → Frontend |
| `original_filename`| String   | Backend → Frontend |
| `image`            | URL      | Backend → Frontend |
| `recognised_text`  | String   | Backend → Frontend |
| `status`           | String   | Backend → Frontend |
| `error_message`    | String   | Backend → Frontend |
| `created_at`       | DateTime | Backend → Frontend |
| `updated_at`       | DateTime | Backend → Frontend |

### History List Response Keys (lightweight)
| Key                | Type     | Direction       |
|--------------------|----------|-----------------|
| `id`               | UUID     | Backend → Frontend |
| `original_filename`| String   | Backend → Frontend |
| `status`           | String   | Backend → Frontend |
| `created_at`       | DateTime | Backend → Frontend |
