"""
Flask server for ElevenLabs voiceover generation
Provides REST API endpoints for the React frontend
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Fix Windows console encoding for emoji characters
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

# Add the current directory to path for imports
sys.path.append(os.path.dirname(__file__))

try:
    from elevenlabs_backend import ElevenLabsVoiceoverGenerator
except ImportError:
    print("Error: elevenlabs_backend.py not found. Make sure it's in the same directory.")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Allow React app to connect

# Initialize generator
try:
    generator = ElevenLabsVoiceoverGenerator()
    print("✅ ElevenLabs generator initialized")
except Exception as e:
    print(f"⚠️  Warning: Failed to initialize ElevenLabs generator: {e}")
    print("   Voiceover features will be disabled. Set ELEVENLABS_API_KEY environment variable.")
    generator = None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "elevenlabs_configured": generator is not None
    })

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get all available voices"""
    if not generator:
        return jsonify({"error": "ElevenLabs not configured. Set ELEVENLABS_API_KEY."}), 500
    
    try:
        voices = generator.list_voices()
        return jsonify({"voices": voices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/anime-voices', methods=['GET'])
def get_anime_voices():
    """Get anime-style voices"""
    if not generator:
        return jsonify({"error": "ElevenLabs not configured. Set ELEVENLABS_API_KEY."}), 500
    
    try:
        voices = generator.get_anime_voices()
        return jsonify({"voices": voices})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate', methods=['POST'])
def generate_voiceover():
    """Generate voiceover from script"""
    if not generator:
        return jsonify({"error": "ElevenLabs not configured. Set ELEVENLABS_API_KEY."}), 500
    
    data = request.json
    
    script = data.get('script')
    voice_id = data.get('voice_id')
    output_name = data.get('output_name', 'voiceover.mp3')
    
    if not script or not voice_id:
        return jsonify({"error": "Missing script or voice_id"}), 400
    
    try:
        # Create outputs directory
        output_dir = Path("outputs")
        output_dir.mkdir(exist_ok=True)
        
        output_path = output_dir / output_name
        
        audio_path = generator.generate_voiceover(
            text=script,
            voice_id=voice_id,
            output_path=str(output_path)
        )
        
        return jsonify({
            "success": True,
            "audio_path": audio_path,
            "filename": output_name,
            "download_url": f"/api/download/{output_name}"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download generated audio"""
    file_path = Path("outputs") / filename
    
    if file_path.exists() and file_path.is_file():
        return send_file(str(file_path), as_attachment=True, download_name=filename)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/api/estimate-cost', methods=['POST'])
def estimate_cost():
    """Estimate generation cost"""
    if not generator:
        return jsonify({"error": "ElevenLabs not configured"}), 500
    
    data = request.json
    script = data.get('script', '')
    tier = data.get('tier', 'starter')
    
    try:
        char_count = generator.get_character_count(script)
        cost = generator.estimate_cost(script, tier)
        
        return jsonify({
            "character_count": char_count,
            "estimated_cost": cost,
            "tier": tier
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 ElevenLabs Backend starting on http://localhost:{port}")
    print(f"   CORS enabled for React frontend")
    
    if not generator:
        print("   ⚠️  ELEVENLABS_API_KEY not set - voiceover features disabled")
    
    app.run(debug=True, port=port, host='0.0.0.0')