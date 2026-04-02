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

---

## Frontend (React + TypeScript + Vite) – Local Setup

### Tech Stack

- React 18
- TypeScript
- Vite
- CSS Variables for theming

### Getting Started

**Step 1 — Navigate to the ocr-frontend folder:**
```bash
cd OCR-FRONTEND
```

**Step 2 — Install dependencies:**
```bash
npm install
```
 This will install all required packages listed in `package.json` into a local `node_modules` folder.


**Step 3 — Start the development server:**
```bash
npm run dev
```

 
You should see output similar to:
```
  VITE v5.x.x  ready in 300ms
 
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```
 

**Step 4 — Open in browser:**
```
http://localhost:5173
```

---
 
### Available Scripts
 
| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the local development server with hot reload |
| `npm run build` | Builds the app for production into the `dist/` folder |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint to check for code issues |
 
---
 
### Project Structure

```
OCR-FRONTEND/
├── public/                 # Static assets served directly
├── src/
│   ├── App.tsx             # Main app component, routing, Nav & Footer
│   ├── App.css             # Component-level styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles & font imports
├── index.html              # HTML entry point
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # TypeScript app-specific config
├── tsconfig.node.json      # TypeScript Node-specific config
├── vite.config.ts          # Vite configuration
└── package.json            # Project dependencies and scripts
```

### Pages
 
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with project overview |
| Translator | `/translator` | Fraktur text input & translation output |
| How It Works | `/how` | Step-by-step process guide |
| About | `/about` | Project and team background |
| Contact | `/contact` | Contact form |
 
---
 
### Troubleshooting
 
**Port already in use:**
If `localhost:5173` is already taken, Vite will automatically try the next available port (e.g. `5174`). You can also specify a port manually:
```bash
npm run dev -- --port 3000
```
 
**`node_modules` missing or broken:**
Delete the folder and reinstall:
```bash
rm -rf node_modules
npm install
```
 
**TypeScript errors on startup:**
Make sure you're using Node.js v18 or above:
```bash
node -v
```
 
**Dependencies out of date:**
```bash
npm update
```