# AI-Based Text Recognition for Noisy Historical Newspapers - Group 8 - CITS5206 Information Technology Capstone Project 2026

## Overview

This project develops an **AI-based end-to-end pipeline for recognizing historical German newspapers written in Fraktur font**. The system converts scanned newspaper images into **searchable digital text**, enabling researchers to analyze historical media content more efficiently.

This project is developed as a **Capstone Project by Master's students from the The University of Western Australia (UWA)** in collaboration with a **PhD researcher from the School of Humanities at UWA**.

The research focuses on historical newspapers from the 1930s, specifically **Der Stürmer**, which were printed using the **Fraktur typeface**.

Historical newspapers printed in **Fraktur** present significant challenges for modern OCR systems due to:

* degraded scan quality from aging documents
* complex multi-column newspaper layouts
* historical typography variations
* noisy or low-resolution scanned images

This project aims to **train and adapt machine learning models to improve OCR accuracy** for historical documents and enable the creation of **searchable digital archives for research purposes**.

---

## Key Features

* OCR for **Fraktur historical fonts**
* Processing of **noisy historical scans**
* **Newspaper layout recognition**
* Automated **text extraction**
* Generation of **searchable documents**
* AI-assisted **text correction**

## Backend (Django) – Docker Setup

### Environment Variables (.env)

* Create a `.env` file inside:

    * `Backend/OCR_Backend/`

### Running the Backend with Docker

#### Step 1: Navigate to backend folder

``` 
cd Backend/OCR_Backend 
```

#### Step 2: Build and start container

```
docker-compose up --build
```

#### Step 3: To see if the server is running successfully, visit:

```
http://localhost:8000
```

#### Step 4: To Stop container

```
docker-compose down
```
or

```
Ctrl + C
```

### Running Django Commands inside Docker

 * To execute Command inside Docker Container

```
 docker exec -it ocr-django-backend bash
```

