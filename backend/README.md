# ElevenLabs Voiceover Backend

Flask server that provides REST API endpoints for generating voiceovers using ElevenLabs API.

## Setup

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your ElevenLabs API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
ELEVENLABS_API_KEY=sk_your_actual_api_key_here
PORT=5000
```

Get your API key from: https://elevenlabs.io/ (Profile → API Key)

### 3. Run the Server

```bash
python voiceover_server.py
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running and ElevenLabs is configured

### Voices
- `GET /api/voices` - Get all available voices
- `GET /api/anime-voices` - Get anime-style voices (filtered)

### Voiceover Generation
- `POST /api/generate` - Generate voiceover from script
  ```json
  {
    "script": "Text to convert to speech",
    "voice_id": "voice_id_here",
    "output_name": "voiceover.mp3"
  }
  ```

- `GET /api/download/<filename>` - Download generated audio file

### Cost Estimation
- `POST /api/estimate-cost` - Estimate cost for voiceover generation
  ```json
  {
    "script": "Text to estimate",
    "tier": "starter"  // free, starter, creator, pro
  }
  ```

## Usage from React Frontend

The React frontend should set `VITE_ELEVENLABS_BACKEND_URL=http://localhost:5000` in `.env` file.

## Troubleshooting

### "ElevenLabs not configured" error
- Make sure `ELEVENLABS_API_KEY` is set in `.env` file
- Restart the server after adding the key

### CORS errors
- The server has CORS enabled for all origins (development)
- For production, configure CORS to allow only your frontend domain

### Rate limiting
- ElevenLabs has rate limits based on your subscription tier
- Free tier: 10,000 characters/month
- The backend includes automatic rate limiting (0.4s delay between requests)

## Project Structure

```
backend/
├── elevenlabs_backend.py    # ElevenLabs API wrapper class
├── voiceover_server.py      # Flask server
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variable template
├── .env                    # Your actual environment variables (not in git)
├── outputs/                # Generated audio files (created automatically)
└── README.md              # This file
```