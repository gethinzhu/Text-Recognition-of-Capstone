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

---

## Problem Statement

Many historical newspapers exist only as **scanned image archives**, which makes them difficult to analyze computationally.

For this project, the dataset consists of **two years of weekly publications of the newspaper Der Stürmer**, where each issue typically contains **8–10 pages**.

These documents are available primarily as **TIFF image scans**, which require OCR processing to convert them into machine-readable text.

Challenges include:

* Low resolution historical scans
* Multi-column newspaper layout
* Text continuity across columns
* Historical fonts such as **Fraktur** and **Sütterlin**
* OCR recognition errors caused by noise and degraded print quality

Existing transcription tools such as **Transkribus** produced unsatisfactory results, motivating the need for a **custom AI-based pipeline** capable of handling noisy historical data and complex newspaper layouts.

---

# Dataset Description

The dataset used in this project consists of historical newspaper scans from **Der Stürmer**, a German newspaper published during the early 20th century.

For the purpose of this capstone project, the dataset includes **two years of weekly publications**.

### Dataset Characteristics

| Attribute             | Description |
| --------------------- | ----------- |
| Publication frequency | Weekly      |
| Time span             | 2 years     |
| Estimated issues      | ~104        |
| Pages per issue       | 8–10 pages  |
| Estimated total pages | ~800–1000   |
| Image format          | TIFF        |
| Language              | German      |
| Primary font          | Fraktur     |

Each newspaper issue typically contains:

* Headlines
* Multi-column articles
* Editorial sections
* Advertisements
* Occasional images

For research purposes, the **first 3–4 pages are considered the most important**, as they usually contain the main political and editorial content.

Advertisement pages may be **excluded from model training** as they contribute less to the research objectives.

---

## Data Challenges

Working with historical newspaper archives introduces several technical challenges.

### Historical Typography

The newspapers primarily use **Fraktur**, a Gothic-style typeface that differs significantly from modern Latin fonts. Additionally, some sections may contain **Sütterlin**, a handwriting-style script used in early 20th century Germany.

These fonts are difficult for modern OCR systems to interpret accurately.

### Noisy Historical Scans

The scanned images are nearly **100 years old**, which results in:

* faded ink
* inconsistent printing quality
* low resolution
* visual noise

These factors significantly impact text recognition performance.

### Complex Newspaper Layout

Each page typically contains **three columns of text**, where articles may continue across columns.

The system must correctly detect:

* column boundaries
* article sections
* reading order

Accurate layout recognition is essential for reconstructing the text correctly.

---
