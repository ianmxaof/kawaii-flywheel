"""
Voiceover Handler Module
Handles ElevenLabs voiceover generation
"""

import sys
import os
from pathlib import Path
from flask import jsonify

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from elevenlabs_backend import ElevenLabsVoiceoverGenerator
except ImportError:
    print("Error: elevenlabs_backend.py not found.")
    ElevenLabsVoiceoverGenerator = None


class VoiceoverHandler:
    """Handler for ElevenLabs voiceover operations"""
    
    def __init__(self):
        try:
            self.generator = ElevenLabsVoiceoverGenerator() if ElevenLabsVoiceoverGenerator else None
            if self.generator:
                print("✅ ElevenLabs generator initialized")
        except Exception as e:
            print(f"⚠️  Warning: Failed to initialize ElevenLabs generator: {e}")
            print("   Voiceover features will be disabled. Set ELEVENLABS_API_KEY environment variable.")
            self.generator = None
    
    def list_voices(self, anime_only=False):
        """Get available voices"""
        if not self.generator:
            return jsonify({"error": "ElevenLabs not configured. Set ELEVENLABS_API_KEY."}), 500
        
        try:
            if anime_only:
                voices = self.generator.get_anime_voices()
            else:
                voices = self.generator.list_voices()
            return jsonify({"voices": voices})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def generate(self, data):
        """Generate voiceover from script"""
        if not self.generator:
            return jsonify({"error": "ElevenLabs not configured. Set ELEVENLABS_API_KEY."}), 500
        
        script = data.get('script')
        voice_id = data.get('voice_id')
        output_name = data.get('output_name', 'voiceover.mp3')
        settings = data.get('settings', {})
        
        if not script or not voice_id:
            return jsonify({"error": "Missing script or voice_id"}), 400
        
        try:
            # Create outputs directory
            output_dir = Path("outputs")
            output_dir.mkdir(exist_ok=True)
            
            output_path = output_dir / output_name
            
            # Extract settings with defaults
            stability = settings.get('stability', 0.75)
            similarity_boost = settings.get('similarity_boost', 0.75)
            style = settings.get('style', 0.5)
            use_speaker_boost = settings.get('use_speaker_boost', True)
            
            audio_path = self.generator.generate_voiceover(
                text=script,
                voice_id=voice_id,
                output_path=str(output_path),
                stability=stability,
                similarity_boost=similarity_boost,
                style=style,
                use_speaker_boost=use_speaker_boost
            )
            
            return jsonify({
                "success": True,
                "audio_path": audio_path,
                "filename": output_name,
                "download_url": f"/api/voiceover/download/{output_name}"
            })
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    def estimate_cost(self, data):
        """Estimate generation cost"""
        if not self.generator:
            return jsonify({"error": "ElevenLabs not configured"}), 500
        
        script = data.get('script', '')
        tier = data.get('tier', 'starter')
        
        try:
            char_count = self.generator.get_character_count(script)
            cost = self.generator.estimate_cost(script, tier)
            
            return jsonify({
                "character_count": char_count,
                "estimated_cost": cost,
                "tier": tier
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
