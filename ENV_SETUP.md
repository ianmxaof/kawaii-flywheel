# Environment Variables Setup

This document describes the required environment variables for the Content Factory application.

## Frontend Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Claude API Key (required for script generation, virality prediction, etc.)
VITE_CLAUDE_API_KEY=your_claude_api_key_here

# ElevenLabs Backend URL (optional, defaults to http://localhost:5000)
VITE_ELEVENLABS_BACKEND_URL=http://localhost:5000

# YouTube API Configuration (optional, for YouTube uploads)
VITE_YOUTUBE_CLIENT_ID=your_youtube_client_id_here
```

### How to Get API Keys

#### Claude API Key
1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key and add it to `.env` as `VITE_CLAUDE_API_KEY`

#### ElevenLabs API Key (Backend)
1. Sign up at https://elevenlabs.io/
2. Go to Profile → API Keys
3. Create a new API key
4. Add it to `backend/.env` as `ELEVENLABS_API_KEY` (see backend setup)

#### YouTube Client ID
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials (Desktop app type)
5. Copy the Client ID

## Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ElevenLabs API Key (required for voiceover generation)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Server Port (optional, defaults to 5000)
PORT=5000
```

See `backend/README.md` for detailed backend setup instructions.

## Environment File Structure

```
kawaii-content-flywheel/
├── .env                    # Frontend environment variables
├── backend/
│   └── .env                # Backend environment variables
└── ENV_SETUP.md           # This file
```

## Security Notes

- Never commit `.env` files to version control (they're in .gitignore)
- Keep your API keys secret
- Use different keys for development and production
- Rotate keys if they're ever exposed