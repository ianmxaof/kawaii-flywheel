"""
Unified Backend Server
Combines voiceover, Perchance, and semantic handlers into single Flask app
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

# Add modules to path
sys.path.append(os.path.dirname(__file__))

try:
    from modules.voiceover_handler import VoiceoverHandler
    from modules.perchance_handler import PerchanceHandler
    from modules.semantic_handler import SemanticHandler
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure modules directory exists with handler files")
    sys.exit(1)

# Import virality engine modules
try:
    from core.idea_core import IdeaCore
    from core.trend_context import TrendContext
    from core.decision_object import DecisionObject
    from core.cognitive_budget import CognitiveLoadBudget
    from trends.trend_prior_engine import TrendPriorEngine
    virality_engine_available = True
except ImportError as e:
    print(f"⚠️  Warning: Virality engine modules not available: {e}")
    virality_engine_available = False

app = Flask(__name__)
CORS(app)  # Allow React app to connect

# Initialize handlers
try:
    voiceover = VoiceoverHandler()
    perchance = PerchanceHandler()
    semantic = SemanticHandler()
    print("✅ All handlers initialized")
except Exception as e:
    print(f"⚠️  Warning: Handler initialization error: {e}")
    voiceover = None
    perchance = None
    semantic = None

# Initialize virality engine
trend_engine = None
coach_engine = None
if virality_engine_available:
    try:
        trend_engine = TrendPriorEngine()
        from coach.coach_engine import CoachEngine
        coach_engine = CoachEngine()
        print("✅ Trend engine and coach engine initialized")
    except Exception as e:
        print(f"⚠️  Warning: Virality engine initialization error: {e}")
        trend_engine = None
        coach_engine = None

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "voiceover_configured": voiceover is not None and voiceover.generator is not None,
        "perchance_configured": perchance is not None and perchance.playwright_available,
        "semantic_configured": semantic is not None
    })

# ==================== VOICEOVER ENDPOINTS ====================

@app.route('/api/voiceover/voices', methods=['GET'])
def get_voices():
    """Get all available voices"""
    anime_only = request.args.get('anime_only', 'false').lower() == 'true'
    return voiceover.list_voices(anime_only=anime_only)

@app.route('/api/voiceover/anime-voices', methods=['GET'])
def get_anime_voices():
    """Get anime-style voices"""
    return voiceover.list_voices(anime_only=True)

@app.route('/api/voiceover/generate', methods=['POST'])
def generate_voiceover():
    """Generate voiceover from script"""
    return voiceover.generate(request.json)

@app.route('/api/voiceover/download/<filename>', methods=['GET'])
def download_voiceover(filename):
    """Download generated audio"""
    file_path = Path("outputs") / filename
    
    if file_path.exists() and file_path.is_file():
        return send_file(str(file_path), as_attachment=True, download_name=filename)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/api/voiceover/estimate-cost', methods=['POST'])
def estimate_voiceover_cost():
    """Estimate generation cost"""
    return voiceover.estimate_cost(request.json)

# ==================== PERCHANCE ENDPOINTS ====================

@app.route('/api/perchance/generate', methods=['POST'])
def generate_images():
    """Generate images via Perchance"""
    return perchance.generate(request.json)

@app.route('/api/perchance/gallery', methods=['GET'])
def get_gallery():
    """Get all images in gallery"""
    return perchance.get_gallery()

@app.route('/api/perchance/download/<image_id>', methods=['GET'])
def download_image(image_id):
    """Download specific image"""
    filepath = Path(f"temp_generated/{image_id}.png")
    
    if filepath.exists():
        return send_file(str(filepath), mimetype='image/png')
    else:
        return jsonify({"error": "Image not found"}), 404

@app.route('/api/perchance/clear', methods=['POST'])
def clear_gallery():
    """Clear gallery"""
    return perchance.clear_gallery()

# ==================== SEMANTIC ENDPOINTS ====================

@app.route('/api/semantic/analyze', methods=['POST'])
def analyze_script():
    """Semantic analysis (note: runs in frontend)"""
    return semantic.analyze(request.json)

# ==================== VIRALITY ENGINE ENDPOINTS ====================

@app.route('/api/idea/normalize', methods=['POST'])
def normalize_idea():
    """Normalize raw idea input into IdeaCore"""
    if not virality_engine_available:
        return jsonify({"error": "Virality engine not available"}), 503
    
    try:
        data = request.json
        raw_input = data.get('raw_input', '')
        
        if not raw_input:
            return jsonify({"error": "raw_input is required"}), 400
        
        # For MVP, use basic extraction (no model router in backend)
        # Frontend can call this and enhance with model router
        idea_core = IdeaCore._basic_extraction(raw_input, None)
        
        return jsonify(idea_core.to_dict())
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@app.route('/api/trends/compute', methods=['GET'])
def compute_trends():
    """Compute trend context for a core claim"""
    if not virality_engine_available or trend_engine is None:
        return jsonify({"error": "Trend engine not available"}), 503
    
    try:
        core_claim = request.args.get('core_claim', '')
        
        if not core_claim:
            return jsonify({"error": "core_claim parameter is required"}), 400
        
        # Compute trend prior
        trend_context = trend_engine.compute_trend_prior(core_claim)
        
        return jsonify(trend_context.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/decision/create', methods=['POST'])
def create_decision():
    """Create a decision object from idea core and trend context"""
    if not virality_engine_available:
        return jsonify({"error": "Virality engine not available"}), 503
    
    try:
        data = request.json
        idea_core_dict = data.get('idea_core', {})
        trend_context_dict = data.get('trend_context', {})
        
        if not idea_core_dict:
            return jsonify({"error": "idea_core is required"}), 400
        
        # Create IdeaCore and TrendContext from dicts
        idea_core = IdeaCore.from_dict(idea_core_dict)
        trend_context = TrendContext.from_dict(trend_context_dict) if trend_context_dict else None
        
        # Calculate cognitive budget
        budgeter = CognitiveLoadBudget()
        if trend_context:
            cognitive_budget = budgeter.calculate(trend_context, idea_core)
        else:
            cognitive_budget = 3  # Default
        
        # Create decision object
        decision = DecisionObject(
            idea_core_id=f"idea_{hash(str(idea_core_dict))}",
            trend_context_id=f"trend_{hash(str(trend_context_dict))}" if trend_context_dict else "none",
            cognitive_budget=cognitive_budget
        )
        
        return jsonify(decision.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== COACH MODE ENDPOINTS ====================

@app.route('/api/coach/add-episode', methods=['POST'])
def add_episode():
    """Add a new episode with predicted or actual metrics"""
    if not virality_engine_available or coach_engine is None:
        return jsonify({"error": "Coach engine not available"}), 503
    
    try:
        episode_data = request.json
        if not episode_data:
            return jsonify({"error": "Episode data is required"}), 400
        
        episode_id = coach_engine.add_episode(episode_data)
        return jsonify({"status": "success", "episode_id": episode_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/coach/analyze/<int:episode_num>', methods=['GET'])
def analyze_episode(episode_num):
    """Analyze a specific episode"""
    if not virality_engine_available or coach_engine is None:
        return jsonify({"error": "Coach engine not available"}), 503
    
    try:
        analysis = coach_engine.analyze_episode(episode_num)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/coach/learning-arc', methods=['GET'])
def get_learning_arc():
    """Get complete learning trajectory"""
    if not virality_engine_available or coach_engine is None:
        return jsonify({"error": "Coach engine not available"}), 503
    
    try:
        learning_arc = coach_engine.get_learning_arc()
        return jsonify(learning_arc)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/coach/predict-next', methods=['POST'])
def predict_next():
    """Predict metrics for next episode"""
    if not virality_engine_available or coach_engine is None:
        return jsonify({"error": "Coach engine not available"}), 503
    
    try:
        data = request.json
        idea_core_dict = data.get('idea_core', {})
        trend_context_dict = data.get('trend_context', {})
        decision_object = data.get('decision_object')
        
        if not idea_core_dict or not trend_context_dict:
            return jsonify({"error": "idea_core and trend_context are required"}), 400
        
        idea_core = IdeaCore.from_dict(idea_core_dict)
        trend_context = TrendContext.from_dict(trend_context_dict)
        
        predicted_metrics = coach_engine.predict_metrics(
            idea_core,
            trend_context,
            decision_object
        )
        
        return jsonify(predicted_metrics)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/coach/update-metrics/<int:episode_num>', methods=['POST'])
def update_episode_metrics(episode_num):
    """Update episode with actual metrics (for Episode 10)"""
    if not virality_engine_available or coach_engine is None:
        return jsonify({"error": "Coach engine not available"}), 503
    
    try:
        actual_metrics = request.json
        if not actual_metrics:
            return jsonify({"error": "Actual metrics are required"}), 400
        
        coach_engine.tracker.update_episode_metrics(episode_num, actual_metrics)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

@app.route('/api/voices', methods=['GET'])
def legacy_get_voices():
    """Legacy endpoint - redirects to voiceover/voices"""
    return get_voices()

@app.route('/api/anime-voices', methods=['GET'])
def legacy_get_anime_voices():
    """Legacy endpoint - redirects to voiceover/anime-voices"""
    return get_anime_voices()

@app.route('/api/generate', methods=['POST'])
def legacy_generate():
    """Legacy endpoint - redirects to voiceover/generate"""
    return generate_voiceover()

@app.route('/api/download/<filename>', methods=['GET'])
def legacy_download(filename):
    """Legacy endpoint - redirects to voiceover/download"""
    return download_voiceover(filename)

@app.route('/api/estimate-cost', methods=['POST'])
def legacy_estimate_cost():
    """Legacy endpoint - redirects to voiceover/estimate-cost"""
    return estimate_voiceover_cost()

# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Unified Backend Server starting on http://localhost:{port}")
    print(f"   CORS enabled for React frontend")
    print(f"   Endpoints:")
    print(f"   - Voiceover: /api/voiceover/*")
    print(f"   - Perchance: /api/perchance/*")
    print(f"   - Semantic: /api/semantic/*")
    
    if not voiceover or not voiceover.generator:
        print("   ⚠️  ELEVENLABS_API_KEY not set - voiceover features disabled")
    
    if not perchance or not perchance.playwright_available:
        print("   ⚠️  Playwright not installed - Perchance features disabled")
        print("      Install with: pip install playwright && playwright install chromium")
    
    app.run(debug=True, port=port, host='0.0.0.0')
