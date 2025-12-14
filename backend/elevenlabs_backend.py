"""
ElevenLabs Voiceover Automation Backend
Generates high-quality voiceovers from scripts with anime-style voice options
"""

import os
import requests
import json
from pathlib import Path
from typing import List, Dict, Optional
import time

class ElevenLabsVoiceoverGenerator:
    """
    ElevenLabs API integration for batch voiceover generation
    
    Setup:
    1. Sign up at elevenlabs.io
    2. Get API key from profile
    3. Set environment variable: ELEVENLABS_API_KEY
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('ELEVENLABS_API_KEY')
        if not self.api_key:
            raise ValueError("ElevenLabs API key required. Set ELEVENLABS_API_KEY environment variable.")
        
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def list_voices(self) -> List[Dict]:
        """Get all available voices"""
        response = requests.get(
            f"{self.base_url}/voices",
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()['voices']
        else:
            raise Exception(f"Failed to fetch voices: {response.text}")
    
    def get_anime_voices(self) -> List[Dict]:
        """Get voices suitable for anime-style content"""
        all_voices = self.list_voices()
        
        # Filter for high-pitched, youthful voices
        anime_keywords = ['young', 'high', 'light', 'bright', 'energetic', 'cute', 'kawaii']
        
        anime_voices = []
        for voice in all_voices:
            description = voice.get('labels', {}).get('description', '').lower()
            name = voice.get('name', '').lower()
            
            # Check description and name for anime characteristics
            if any(keyword in description or keyword in name for keyword in anime_keywords):
                anime_voices.append(voice)
            
            # Also include voices with high similarity_boost settings (often anime-style)
            # or if no filter matches, include first few voices as fallback
            if len(anime_voices) == 0 and len(all_voices) > 0:
                # Return all voices if no matches, let user choose
                pass
        
        # If no specific anime voices found, return all voices
        return anime_voices if len(anime_voices) > 0 else all_voices[:10]
    
    def generate_voiceover(
        self,
        text: str,
        voice_id: str,
        output_path: str,
        model_id: str = "eleven_multilingual_v2",
        stability: float = 0.75,
        similarity_boost: float = 0.75,
        style: float = 0.5,
        use_speaker_boost: bool = True
    ) -> str:
        """
        Generate voiceover from text
        
        Args:
            text: Script text to convert
            voice_id: ElevenLabs voice ID
            output_path: Where to save MP3
            model_id: Model to use (v2 supports more languages)
            stability: 0-1, lower = more expressive
            similarity_boost: 0-1, higher = closer to original voice
            style: 0-1, how much to exaggerate speaking style
            use_speaker_boost: Enhance clarity
            
        Returns:
            Path to generated audio file
        """
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style,
                "use_speaker_boost": use_speaker_boost
            }
        }
        
        response = requests.post(
            url,
            json=payload,
            headers=self.headers
        )
        
        if response.status_code == 200:
            # Save audio file
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Voiceover saved: {output_path}")
            return str(output_path)
        else:
            raise Exception(f"Voiceover generation failed: {response.text}")
    
    def generate_multi_language_voiceovers(
        self,
        scripts: Dict[str, str],
        voice_configs: Dict[str, str],
        output_dir: str = "voiceovers"
    ) -> Dict[str, str]:
        """
        Generate voiceovers for multiple language scripts
        
        Args:
            scripts: Dict of {language_code: script_text}
            voice_configs: Dict of {language_code: voice_id}
            output_dir: Directory to save all audio files
            
        Returns:
            Dict of {language_code: audio_file_path}
        """
        results = {}
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for lang, script_text in scripts.items():
            voice_id = voice_configs.get(lang)
            if not voice_id:
                print(f"⚠️  No voice configured for {lang}, skipping...")
                continue
            
            print(f"🎤 Generating {lang} voiceover...")
            
            try:
                audio_path = self.generate_voiceover(
                    text=script_text,
                    voice_id=voice_id,
                    output_path=str(output_path / f"voiceover_{lang}.mp3")
                )
                results[lang] = audio_path
                
                # Rate limiting: 3 requests per second max
                time.sleep(0.4)
                
            except Exception as e:
                print(f"❌ Failed to generate {lang}: {e}")
                results[lang] = None
        
        return results
    
    def batch_generate_from_scripts(
        self,
        script_files: List[str],
        voice_id: str,
        output_dir: str = "batch_voiceovers"
    ) -> List[str]:
        """
        Generate voiceovers for multiple script files
        
        Args:
            script_files: List of paths to script TXT files
            voice_id: Voice to use for all
            output_dir: Where to save audio files
            
        Returns:
            List of generated audio file paths
        """
        results = []
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for i, script_file in enumerate(script_files, 1):
            print(f"🎤 Processing script {i}/{len(script_files)}: {script_file}")
            
            # Read script
            with open(script_file, 'r', encoding='utf-8') as f:
                script_text = f.read()
            
            # Generate filename
            script_name = Path(script_file).stem
            output_file = output_path / f"{script_name}_voiceover.mp3"
            
            try:
                audio_path = self.generate_voiceover(
                    text=script_text,
                    voice_id=voice_id,
                    output_path=str(output_file)
                )
                results.append(audio_path)
                
                # Rate limiting
                time.sleep(0.4)
                
            except Exception as e:
                print(f"❌ Failed: {e}")
                results.append(None)
        
        return results
    
    def get_voice_by_name(self, name: str) -> Optional[Dict]:
        """Find voice by name (case-insensitive)"""
        voices = self.list_voices()
        for voice in voices:
            if voice['name'].lower() == name.lower():
                return voice
        return None
    
    def get_character_count(self, text: str) -> int:
        """
        Calculate character count for pricing
        
        ElevenLabs pricing (as of 2025):
        - Free tier: 10,000 characters/month
        - Starter: $5/month for 30,000 characters
        - Creator: $22/month for 100,000 characters
        """
        return len(text)
    
    def estimate_cost(self, text: str, tier: str = 'starter') -> float:
        """Estimate cost for generating voiceover"""
        char_count = self.get_character_count(text)
        
        pricing = {
            'free': (10000, 0),
            'starter': (30000, 5),
            'creator': (100000, 22),
            'pro': (500000, 99)
        }
        
        if tier not in pricing:
            tier = 'starter'
        
        chars_allowed, monthly_cost = pricing[tier]
        
        if chars_allowed == 0:
            return 0.0
        
        chars_per_dollar = chars_allowed / monthly_cost if monthly_cost > 0 else float('inf')
        cost = char_count / chars_per_dollar if chars_per_dollar > 0 else 0
        
        return round(cost, 2)


class VoiceoverWorkflow:
    """
    Complete workflow for video production voiceovers
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.generator = ElevenLabsVoiceoverGenerator(api_key)
        self.project_dir = Path("voiceover_projects")
        self.project_dir.mkdir(exist_ok=True)
    
    def create_project(self, project_name: str):
        """Create a new voiceover project"""
        project_path = self.project_dir / project_name
        project_path.mkdir(exist_ok=True)
        
        # Create subdirectories
        (project_path / "scripts").mkdir(exist_ok=True)
        (project_path / "audio").mkdir(exist_ok=True)
        (project_path / "config").mkdir(exist_ok=True)
        
        return project_path
    
    def setup_multi_language_project(
        self,
        project_name: str,
        scripts: Dict[str, str],
        voice_preferences: Optional[Dict[str, str]] = None
    ):
        """
        Set up complete multi-language voiceover project
        
        Args:
            project_name: Name of the project
            scripts: Dict of {lang_code: script_text}
            voice_preferences: Dict of {lang_code: voice_id} (optional)
        """
        project_path = self.create_project(project_name)
        
        # Save scripts
        for lang, script in scripts.items():
            script_file = project_path / "scripts" / f"script_{lang}.txt"
            with open(script_file, 'w', encoding='utf-8') as f:
                f.write(script)
            print(f"✅ Saved {lang} script: {script_file}")
        
        # Save config
        config = {
            "project_name": project_name,
            "languages": list(scripts.keys()),
            "voice_preferences": voice_preferences or {},
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        config_file = project_path / "config" / "project_config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Project created: {project_path}")
        return project_path
    
    def generate_project_voiceovers(self, project_name: str):
        """Generate all voiceovers for a project"""
        project_path = self.project_dir / project_name
        
        if not project_path.exists():
            raise ValueError(f"Project not found: {project_name}")
        
        # Load config
        config_file = project_path / "config" / "project_config.json"
        with open(config_file) as f:
            config = json.load(f)
        
        # Load scripts
        scripts = {}
        scripts_dir = project_path / "scripts"
        for lang in config['languages']:
            script_file = scripts_dir / f"script_{lang}.txt"
            with open(script_file, 'r', encoding='utf-8') as f:
                scripts[lang] = f.read()
        
        # Generate voiceovers
        audio_dir = project_path / "audio"
        results = self.generator.generate_multi_language_voiceovers(
            scripts=scripts,
            voice_configs=config['voice_preferences'],
            output_dir=str(audio_dir)
        )
        
        print(f"\n✅ Project complete! Audio files in: {audio_dir}")
        return results