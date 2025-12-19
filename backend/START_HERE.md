# Backend Server Startup Instructions

## Quick Start (Recommended)

**Close all other backend terminal instances first!**

### Option 1: PowerShell (Recommended)
```powershell
cd backend
.\start_backend.ps1
```

If you get an execution policy error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option 2: Batch File
```powershell
cd backend
.\start_server.bat
```

### Option 3: Manual
```powershell
cd backend
.venv\Scripts\activate
python unified_server.py
```

## What to Look For

When the server starts successfully, you should see:
```
🚀 Unified Backend Server starting on http://localhost:5000
   CORS enabled for React frontend
   Endpoints:
   - Voiceover: /api/voiceover/*
   - Perchance: /api/perchance/*
   - Semantic: /api/semantic/*
```

## Troubleshooting

1. **"Connection Refused"** - Server isn't running. Check the terminal for errors.
2. **Port 5000 in use** - Close other Python processes or change PORT in .env
3. **Import errors** - Make sure virtual environment is activated and dependencies are installed

## Verify Server is Running

Open in browser: http://localhost:5000/api/health

You should see a JSON response with server status.

