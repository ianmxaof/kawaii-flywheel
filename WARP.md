# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview
This repo is a Vite + React frontend that automates a “content factory” workflow (idea → script → quality/virality check → thumbnail concepts + thumbnail canvas → CapCut template → export). Optional Python/Flask backend support adds ElevenLabs voiceover generation.

Key docs to reference first:
- `ENV_SETUP.md` (required env vars)
- `TESTING_GUIDE.md` (manual end-to-end testing checklist)
- `VIDEO_FACTORY_WORKFLOW.md` (workflow + architecture diagrams)
- `IMPLEMENTATION_SUMMARY.md` (feature inventory + integration points)
- `backend/README.md` (backend setup + API endpoints)

## Common commands (Windows / PowerShell)
### Frontend (Vite)
From repo root:
- Install deps:
  - `npm install`
- Run dev server:
  - `npm run dev`
- Production build:
  - `npm run build`
- Preview production build:
  - `npm run preview`

Notes:
- There are no dedicated lint/typecheck scripts configured in `package.json`.
- There is no automated unit test runner configured; use `TESTING_GUIDE.md` for manual test flows.

### Backend (optional: ElevenLabs voiceover)
From repo root:
- Create venv + install deps (first time):
  - `cd backend`
  - `python -m venv venv`
  - `./venv/Scripts/Activate.ps1`
  - `pip install -r requirements.txt`
- Run server:
  - `python voiceover_server.py`

Manual backend smoke test:
- `GET http://localhost:5000/api/health`

## Environment variables
Frontend (repo root `.env`, see `ENV_SETUP.md`):
- `VITE_CLAUDE_API_KEY` (required; used by `src/utils/apiConnector.js` to call Claude directly from the browser)
- `VITE_ELEVENLABS_BACKEND_URL` (optional; defaults to `http://localhost:5000`)
- `VITE_YOUTUBE_CLIENT_ID` (optional; YouTube upload flow)

Backend (`backend/.env`, see `ENV_SETUP.md` and `backend/README.md`):
- `ELEVENLABS_API_KEY` (required for voiceover features)
- `PORT` (optional; defaults to 5000)

Implementation detail to be aware of:
- `src/utils/apiConnector.js` sets the `anthropic-dangerous-direct-browser-access` header to enable browser-to-Claude calls.

## High-level architecture (where to look)
### Frontend entry + top-level UI
- `src/main.jsx` boots React.
- `src/App.jsx` currently renders `src/components/UnifiedProductionPipeline.jsx`.

There are two “top-level” UIs in the repo:
- `UnifiedProductionPipeline` (currently mounted): a stage-based wizard UI that manages the end-to-end workflow.
- `src/components/ContentHub.jsx`: a tabbed “hub” UI that includes the older Video Factory system plus the newer “Integrated Factory” tab. If you need that UI, swap `App.jsx` to render `ContentHub`.

### External API boundary
- `src/utils/apiConnector.js`: single integration point for external calls.
  - Claude: direct HTTPS calls from the frontend.
  - ElevenLabs: calls the local backend (`/api/*`) for voices + generation + downloads.

### Content generation pipeline
- Script + virality + thumbnail concepts + translation are orchestrated from the UI components via `APIConnector`.
- CapCut template generation is local-only:
  - `src/utils/capCutTemplateGenerator.js` (used by both `UnifiedProductionPipeline` and `src/components/IntegratedContentFactory.jsx`).

### Persistence model (local-first)
- Projects: `src/hooks/useProjects.js` (stored in `localStorage` under `contentFactory_projects`).
- Idea bank (pipeline UI): stored in `localStorage` under `ideaBank`.
- Images/assets: `src/utils/indexedDB.js` uses IndexedDB DB `ContentFactoryDB` store `images`.

### Thumbnail “workshop”
- Canvas state: `src/hooks/useCanvas.js` (layer stack + selection; used across workshop components).
- UI components live under `src/components/Workshop/` and are embedded into both `ContentHub` and `UnifiedProductionPipeline`.

## Backend architecture (voiceover)
- `backend/voiceover_server.py`: Flask REST API + CORS.
  - `/api/voices`, `/api/anime-voices`, `/api/generate`, `/api/download/<filename>`, `/api/estimate-cost`
- `backend/elevenlabs_backend.py`: `ElevenLabsVoiceoverGenerator` (raw ElevenLabs API wrapper + filtering + basic batching/rate limiting).
- Generated audio files are written under `backend/outputs/`.
