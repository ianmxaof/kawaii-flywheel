What this is
------------
A local-first production dashboard that automates generation and assembly of short-form anime-style content: script & voiceover generation, asset management, thumbnailing, and a unified production pipeline surfaced in a React dashboard backed by a Flask API. It's aimed at developers and creators who want an end-to-end toolchain for automating content creation.

Stack
-----
- Language(s): JavaScript (React, Vite) and Python (Flask)
- Framework / runtime: Vite + React 18 for the frontend; Flask for the backend
- Notable libraries:
  - Frontend: React, Vite, Tailwind CSS, html2canvas, jszip
  - Backend: Flask, flask-cors, python-dotenv, Playwright (for browser automation)
  - Integrations: ElevenLabs (voice synthesis), @anthropic-ai/sdk (in package.json)

How it's organized
------------------
Top-level layout (important entries only):
```
README.md                      # <- add this file (you are here)
index.html                     # Frontend HTML entry (Vite)
package.json                   # Frontend deps + scripts (vite dev/build)
vite.config.js, tailwind.config.js, postcss.config.js
src/                           # React source
  App.jsx
  main.jsx
  components/                  # UI: UnifiedProductionPipeline and subcomponents
backend/                       # Flask API + automation server
  unified_server.py            # Primary backend entry (used by START.bat)
  voiceover_server.py          # Voiceover API server (ElevenLabs)
  elevenlabs_backend.py        # ElevenLabs wrapper
  START.bat, START_HERE.md     # Windows convenience/start scripts
  requirements.txt
ENV_SETUP.md, IMPLEMENTATION_SUMMARY.md, TESTING_GUIDE.md, VIDEO_FACTORY_WORKFLOW.md, WARP.md
```

How it fits together
--------------------
- Frontend: Vite serves the React dashboard (src/main.jsx → src/App.jsx → UnifiedProductionPipeline). The UI components under src/components implement modules like the Video Factory, Voiceover, Optimizer, and PersistentAssetLibrary, which orchestrate content generation and editing.
- Backend: The Flask app(s) in backend/ expose REST endpoints for health checks, voice list, voiceover generation, file download, and cost estimation. elevenlabs_backend.py wraps ElevenLabs API calls. Some server flows use Playwright for trend scraping / automation.
- Runtime flow: The UI calls the backend (set VITE_ELEVENLABS_BACKEND_URL) for voice synthesis and assets; produced files are stored under backend/outputs/; the frontend assembles and packages assets for export.

How to run it
--------------
1) Clone
```bash
git clone https://github.com/ianmxaof/kawaii-flywheel.git
cd kawaii-flywheel
```

2) Backend (Windows - automated)
- From repo root, run:
  - backend\START.bat
  - This script will create a .venv, install dependencies (Flask, flask-cors, requests, python-dotenv, pytrends, playwright), install Playwright browsers, then run backend/unified_server.py.

2b) Backend (macOS / Linux - manual)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Playwright browsers:
python -m playwright install chromium
# Start the server (unified entrypoint)
python unified_server.py
# If you prefer the voice-only server:
# python voiceover_server.py
```
- Required env: copy `.env.example` → `.env` and set:
  - ELEVENLABS_API_KEY=sk_your_api_key_here
  - PORT=5000

3) Frontend (Vite)
```bash
# From repo root
npm install
# Ensure frontend env points to backend:
# Create a .env file with:
# VITE_ELEVENLABS_BACKEND_URL=http://localhost:5000
npm run dev
# Open the dev URL (usually http://localhost:5173)
```

4) Sanity checks
- Backend health: GET http://localhost:5000/api/health
- Frontend: open Vite dev server and verify the UI loads and connects to backend.

Troubleshooting (common)
- "ElevenLabs not configured": set ELEVENLABS_API_KEY in backend/.env and restart server.
- CORS: backend enables CORS for dev; restrict it for production.
- Playwright: run `python -m playwright install chromium` if browsers not found.
- Port conflicts: set PORT env var for backend or change frontend dev port in Vite config.
- Mismatch of server files: START.bat runs unified_server.py while README in backend references voiceover_server.py — run the server file that exists in your checkout.

Files & places to look
-----------------------
- Frontend entry & main UI: src/main.jsx, src/App.jsx, src/components/UnifiedProductionPipeline.jsx
- Backend server & API: backend/unified_server.py, backend/voiceover_server.py, backend/elevenlabs_backend.py
- Startup helper: backend/START.bat, backend/START_HERE.md
- Dev config: package.json, vite.config.js, tailwind.config.js

License, tests, CI
------------------
- Tests and CI: see TESTING_GUIDE.md for repository test guidance.
- No LICENSE file detected at repo root — add one if you plan to open-source.

Try asking
----------
- Which server should be documented as the canonical backend entrypoint (backend/unified_server.py or backend/voiceover_server.py)?
- Do you want a short API reference (endpoints + payloads) in README.md that repeats backend/README.md, or a single link to the backend folder?
- Should I create a simple GitHub Actions workflow to run the frontend build and backend lint/tests on push?

```

Notes
- The README above synthesizes the repository structure and run instructions found in the repo (frontend using Vite + React; backend using Flask and ElevenLabs). Add the file to the repository root as README.md.
