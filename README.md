# NETRA: Network Enabled Tracking and Reconnaissance Analysis

NETRA is a professional, high-performance digital image forensics and reverse-image search tracking dashboard designed for cybersecurity analysts, investigators, and privacy officers. It tracks, hashes, and charts the digital footprint of leaked screenshots, private media, and image archives across the public web.

---

## 🚀 Key Features

*   **Judges' Evaluation landing Page**: An introductory gatekeeper screen highlighting the sandbox nature of the prototype. It offers a single-click download for a verified calibration test image (`images.jpeg`) and guides the user through the test procedure.
*   **Administrative Ingestion Portal**: A drag-and-drop secure upload zone to ingest evidence files, scrub binary headers, and compute perceptual hashes (pHash).
*   **Live Scanning Timeline Terminal**: A real-time tracking panel that cycles through pipeline checkpoints (EXIF cleaning, generating semantic AI description tokens, and crawling search providers).
*   **Synaptic Neural Graph (60 FPS)**: An interactive, physics-based neural web mapping visual occurrences. Node sizing is proportional to threat levels, and nodes can be dragged in any direction. Clicking any node immediately opens the matching source URL.
*   **Security Metrics & Threat Log**: Displays key dashboard metrics (Total Leaks, High Threats, Compromised Domains) alongside a searchable log grid of matched assets.
*   **AI Case Summary**: Translates matching links into a structured threat mitigation report using Groq's LLM API.
*   **Forensics PDF Exporter**: Compiles case metadata, timeline audits, telemetry logs, and threat summaries into a downloadable PDF report.

---

## 🛠 Technology Stack

### Frontend
*   **React + Vite**: High-performance, hot-reloading client bundle.
*   **Framer Motion**: Smooth micro-animations and page transitions.
*   **HTML5 Canvas**: Dynamic, 60fps physics rendering for the Synaptic Neural Graph.
*   **Lucide React**: High-quality UI icons.
*   **jsPDF**: Client-side document compiler.

### Backend
*   **FastAPI**: Asynchronous Python web framework.
*   **aiosqlite**: Asynchronous database interaction for local persistence.
*   **Playwright**: Automated headless browser engines to crawl Google Lens, TinEye, and Bing Visual Search.
*   **Groq API**: High-speed LLM processing for automated forensics summaries.
*   **SQLite**: File-based relational database.

---

## 🔍 API Cost Skip & Link Database Fallback

Visual search engine APIs (such as Google Vision, SerpApi Google Lens, or Bing Visual Search API) enforce prohibitive subscription fees, strict query limits, and request captcha checks that make live demo scripts fragile.

To bypass these limitations:
1.  NETRA implements **Playwright automation scrapers** inside Google Lens, Bing, and TinEye providers.
2.  If a crawling request experiences latency, is blocked by bot protections, or returns empty results, the system seamlessly falls back to a pre-seeded local database: [Links.txt](Links.txt).
3.  For demonstration purposes, [Links.txt](Links.txt) contains verified web matches referencing a test case (e.g. MS Dhoni's viral hookah smoking video fact-checks).
4.  The pipeline generates **over 150 unique, high-fidelity findings** mapped to real news outlets and forums (such as Deccan Herald, India.com, and OTTPlay) with zero external API fees.

---

## 💻 Quick Start Instructions

### 1. Backend Setup

Prerequisites: Python 3.8 or higher installed.

1.  Navigate into the `backend` folder:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```
3.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Install Playwright browser binaries (for live scraper testing):
    ```bash
    playwright install chromium
    ```
5.  Start the FastAPI server:
    ```bash
    # You can double-click start_Backend.bat on Windows, or run:
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```

The API docs will be available locally at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend Setup

Prerequisites: Node.js (v18+) and npm installed.

1.  Navigate into the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    # You can double-click Start_frontend.bat on Windows, or run:
    npm run dev
    ```

Open your browser to [http://localhost:5173](http://localhost:5173) to access the console.

---

## 🎯 Verification & Evaluation Walkthrough

Follow these steps to demonstrate the full capabilities to evaluators:

1.  Load the dashboard at `http://localhost:5173`. You will land on the **NETRA Demo Sandbox** page.
2.  Click **Download Test Image** to save `NETRA_calibration_image.jpeg` to your computer.
3.  Wait for the 5-second automatic countdown redirect to take you to the **Main Hero Page**.
4.  Click **INITIALIZE SYSTEM** to open the Control Panel.
5.  Log in under guest mode (defaults are configured to log in automatically).
6.  Click **START SCAN** to open the evidence ingestion area.
7.  Upload or drag-and-drop the downloaded `NETRA_calibration_image.jpeg` file, and click **Start Image Scan**.
8.  Observe the processing timeline as it scrubs metadata, generates semantic tags, and runs visual directory scans.
9.  Explore the compiled **Results Dashboard**:
    *   Hover over or drag terminals on the **Synaptic Neural Graph**.
    *   Click a neuron endpoint to open its corresponding online source page.
    *   Examine the **AI Analysis Summary** generated by Groq.
    *   Click **EXPORT PDF** to download a compiled forensic report.
