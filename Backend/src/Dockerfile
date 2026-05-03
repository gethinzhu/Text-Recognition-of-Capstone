FROM --platform=linux/amd64 python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend/src

RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libmariadb-dev \
    netcat-openbsd \
    libxml2-dev \
    libxslt1-dev \
    libjpeg-dev \
    zlib1g-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY src/requirements.txt /app/backend/src/requirements.txt

RUN pip install --upgrade pip wheel
RUN pip install "setuptools<81"
RUN pip install --no-cache-dir -r /app/backend/src/requirements.txt

COPY src /app/backend/src
COPY ml_models /app/backend/ml_models

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]