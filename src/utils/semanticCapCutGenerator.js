import { CapCutTemplateGenerator } from './capCutTemplateGenerator';
import { APIConnector } from './apiConnector';

/**
 * Semantic CapCut Template Generator
 * Uses existing semantic analysis to create intelligent editing templates
 * Falls back to basic generator if semantic data unavailable
 */
export class SemanticCapCutGenerator {
  constructor() {
    this.basicGenerator = new CapCutTemplateGenerator();
    this.apiConnector = new APIConnector();
    this.fps = 60;
    this.resolution = { width: 1920, height: 1080 };
  }

  /**
   * Generate semantic template using existing analysis data
   */
  async generateSemanticTemplate(scriptData, voiceoverDuration, semanticAnalysis) {
    // If no semantic analysis, fall back to basic generator
    if (!semanticAnalysis) {
      console.warn('No semantic analysis available, using basic template generator');
      return this.basicGenerator.generateTemplate(scriptData, scriptData.videoIdea || 'Untitled');
    }

    const durationFrames = (voiceoverDuration || scriptData.targetMinutes * 60) * this.fps;
    
    // Use semantic data to create intelligent timeline
    const timeline = this.createIntelligentTimeline(semanticAnalysis, durationFrames);
    const musicPacing = this.generateMusicPacing(semanticAnalysis);
    const transitions = this.suggestTransitions(semanticAnalysis);
    const brollSuggestions = this.generateBrollSuggestions(semanticAnalysis);
    const viralMarkers = this.placeViralMarkers(semanticAnalysis, durationFrames / this.fps / 60);

    return {
      project_info: {
        name: `semantic_template_${Date.now()}`,
        duration_seconds: durationFrames / this.fps,
        fps: this.fps,
        resolution: this.resolution
      },
      semantic_analysis: semanticAnalysis,
      timeline,
      music_pacing: musicPacing,
      transitions,
      broll_suggestions: brollSuggestions,
      viral_markers: viralMarkers,
      editing_instructions: this.generateEditingInstructions(semanticAnalysis),
      // Include basic CapCut structure for compatibility
      ...this.basicGenerator.generateTemplate(scriptData, scriptData.videoIdea || 'Untitled')
    };
  }

  /**
   * Create intelligent timeline with semantic markers
   */
  createIntelligentTimeline(analysis, totalDurationFrames) {
    const timeline = {
      tracks: [],
      markers: [],
      notes: []
    };

    // Video tracks
    timeline.tracks.push(
      {
        id: 'track_background',
        type: 'video',
        layer: 1,
        name: 'Background Layer',
        segments: [{
          start: 0,
          duration: totalDurationFrames,
          content: 'gradient_background.mp4',
          note: 'Use animated gradient or abstract background'
        }]
      },
      {
        id: 'track_main_content',
        type: 'video',
        layer: 2,
        name: 'Main Content (Screen/B-roll)',
        segments: this.generateContentSegments(analysis, totalDurationFrames)
      },
      {
        id: 'track_character',
        type: 'video',
        layer: 3,
        name: 'Anime Character Overlay',
        segments: this.generateCharacterSegments(analysis, totalDurationFrames)
      },
      {
        id: 'track_overlays',
        type: 'video',
        layer: 4,
        name: 'Text Overlays & Graphics',
        segments: this.generateOverlaySegments(analysis, totalDurationFrames)
      }
    );

    // Audio tracks
    timeline.tracks.push(
      {
        id: 'track_voiceover',
        type: 'audio',
        layer: 1,
        name: 'Voiceover (Main)',
        segments: [{
          start: 0,
          duration: totalDurationFrames,
          content: 'voiceover.mp3',
          volume: 1.0
        }]
      },
      {
        id: 'track_music',
        type: 'audio',
        layer: 2,
        name: 'Background Music',
        segments: this.generateMusicSegments(analysis, totalDurationFrames)
      },
      {
        id: 'track_sfx',
        type: 'audio',
        layer: 3,
        name: 'Sound Effects',
        segments: this.generateSFXSegments(analysis, totalDurationFrames)
      }
    );

    // Timeline markers for editing reference
    if (analysis.key_moments) {
      analysis.key_moments.forEach(moment => {
        timeline.markers.push({
          time: this.timestampToFrames(moment.timestamp),
          label: moment.type.toUpperCase(),
          color: this.getMarkerColor(moment.type),
          note: moment.content,
          importance: moment.importance
        });
      });
    }

    // Pattern interrupt markers
    if (analysis.pattern_interrupts) {
      analysis.pattern_interrupts.forEach(interrupt => {
        timeline.markers.push({
          time: this.timestampToFrames(interrupt.timestamp),
          label: `⚡ ${interrupt.type}`,
          color: '#FF00FF',
          note: interrupt.suggestion
        });
      });
    }

    return timeline;
  }

  /**
   * Generate content segments based on semantic analysis
   */
  generateContentSegments(analysis, totalDurationFrames) {
    const segments = [];

    if (analysis.visual_suggestions) {
      analysis.visual_suggestions.forEach((suggestion, index) => {
        const startTime = this.timestampToFrames(suggestion.timestamp);
        const duration = (suggestion.duration || 30) * this.fps;
        
        segments.push({
          id: `content_${index}`,
          start: startTime,
          duration: duration,
          content_type: suggestion.suggestion,
          note: `Show: ${suggestion.suggestion}`,
          editing_tip: this.getEditingTip(suggestion.suggestion)
        });
      });
    }

    return segments;
  }

  /**
   * Generate character overlay segments with emotional states
   */
  generateCharacterSegments(analysis, totalDurationFrames) {
    const segments = [];
    const emotionalArc = analysis.emotional_arc;

    if (emotionalArc) {
      Object.entries(emotionalArc).forEach(([phase, data]) => {
        const [start, end] = data.timestamp.split('-');
        const startFrames = this.timestampToFrames(start);
        const endFrames = end === 'end' ? totalDurationFrames : this.timestampToFrames(end);
        
        segments.push({
          id: `character_${phase}`,
          start: startFrames,
          duration: endFrames - startFrames,
          character_state: data.emotion,
          energy_level: data.energy,
          note: `Character should look: ${data.emotion}`,
          character_asset: this.mapEmotionToAsset(data.emotion)
        });
      });
    }

    return segments;
  }

  /**
   * Generate text overlay segments
   */
  generateOverlaySegments(analysis, totalDurationFrames) {
    const segments = [];

    if (analysis.key_moments) {
      analysis.key_moments.forEach((moment, index) => {
        if (moment.importance >= 7) {
          segments.push({
            id: `overlay_${index}`,
            start: this.timestampToFrames(moment.timestamp),
            duration: 3 * this.fps,
            text: this.extractKeyPhrase(moment.content),
            style: 'bold_yellow_stroke',
            animation: 'zoom_in',
            note: 'Key moment - emphasize this text'
          });
        }
      });
    }

    return segments;
  }

  /**
   * Generate music pacing based on emotional arc
   */
  generateMusicPacing(analysis) {
    const pacing = [];
    const emotionalArc = analysis.emotional_arc;

    if (emotionalArc) {
      Object.entries(emotionalArc).forEach(([phase, data]) => {
        const [start, end] = data.timestamp.split('-');
        
        pacing.push({
          section: phase,
          timestamp: data.timestamp,
          music_type: this.mapEnergyToMusicType(data.energy),
          bpm: this.mapEnergyToBPM(data.energy),
          volume: this.calculateMusicVolume(data.energy),
          note: `${phase} music (energy: ${data.energy}/10)`
        });
      });
    }

    return pacing;
  }

  /**
   * Generate music segments
   */
  generateMusicSegments(analysis, totalDurationFrames) {
    const segments = [];
    const emotionalArc = analysis.emotional_arc;

    if (emotionalArc) {
      Object.entries(emotionalArc).forEach(([phase, data]) => {
        const [start, end] = data.timestamp.split('-');
        const startFrames = this.timestampToFrames(start);
        const endFrames = end === 'end' ? totalDurationFrames : this.timestampToFrames(end);

        segments.push({
          id: `music_${phase}`,
          start: startFrames,
          duration: endFrames - startFrames,
          energy: data.energy,
          volume: this.calculateMusicVolume(data.energy),
          fade_in: 1.0,
          fade_out: 1.0,
          note: `${phase} music (energy: ${data.energy}/10)`
        });
      });
    }

    return segments;
  }

  /**
   * Generate SFX segments from pattern interrupts
   */
  generateSFXSegments(analysis, totalDurationFrames) {
    const segments = [];

    if (analysis.pattern_interrupts) {
      analysis.pattern_interrupts.forEach((interrupt, index) => {
        if (interrupt.type === 'sound') {
          segments.push({
            id: `sfx_${index}`,
            start: this.timestampToFrames(interrupt.timestamp),
            duration: 1 * this.fps,
            sfx_type: this.mapSFXType(interrupt.suggestion),
            volume: 0.7,
            note: interrupt.suggestion
          });
        }
      });
    }

    return segments;
  }

  /**
   * Suggest transitions based on semantic structure
   */
  suggestTransitions(analysis) {
    const transitions = [];

    if (analysis.pattern_interrupts) {
      analysis.pattern_interrupts.forEach(interrupt => {
        if (interrupt.type === 'transition') {
          transitions.push({
            timestamp: interrupt.timestamp,
            type: this.mapTransitionType(interrupt.suggestion),
            duration: 0.5,
            note: interrupt.suggestion
          });
        }
      });
    }

    // Add transitions at key moments
    if (analysis.key_moments) {
      analysis.key_moments.forEach(moment => {
        if (moment.type === 'revelation' || moment.importance >= 9) {
          transitions.push({
            timestamp: moment.timestamp,
            type: 'glitch',
            duration: 0.3,
            note: 'Dramatic transition for key moment'
          });
        }
      });
    }

    return transitions;
  }

  /**
   * Generate B-roll suggestions
   */
  generateBrollSuggestions(analysis) {
    const suggestions = [];

    if (analysis.visual_suggestions) {
      analysis.visual_suggestions.forEach(suggestion => {
        suggestions.push({
          timestamp: suggestion.timestamp,
          duration: suggestion.duration,
          content: suggestion.suggestion,
          sources: this.suggestBrollSources(suggestion.suggestion),
          editing_note: 'Layer over main content at 70% opacity'
        });
      });
    }

    return suggestions;
  }

  /**
   * Place viral optimization markers
   */
  placeViralMarkers(analysis, durationMinutes) {
    const markers = [];

    // Hook checkpoint (3 seconds)
    markers.push({
      timestamp: '0:03',
      type: 'hook_check',
      importance: 'critical',
      instruction: 'Viewer must be hooked by here or they scroll'
    });

    // Pattern interrupts (every 1.5-2 min)
    const interruptInterval = 90; // seconds
    for (let i = interruptInterval; i < durationMinutes * 60; i += interruptInterval) {
      markers.push({
        timestamp: this.secondsToTimestamp(i),
        type: 'pattern_interrupt',
        importance: 'high',
        instruction: 'Add visual change, sound effect, or surprise fact'
      });
    }

    // Ad break optimization
    if (analysis.ad_break_analysis) {
      analysis.ad_break_analysis.forEach(adBreak => {
        markers.push({
          timestamp: adBreak.timestamp,
          type: 'ad_break_optimized',
          quality: adBreak.quality,
          instruction: `${adBreak.reason} - build tension before break`
        });
      });
    }

    return markers;
  }

  /**
   * Generate detailed editing instructions
   */
  generateEditingInstructions(analysis) {
    const instructions = [];

    instructions.push({
      phase: 'pre_editing',
      steps: [
        'Import voiceover audio first',
        'Create timeline markers at key moments',
        'Set up basic track structure (4 video, 3 audio layers)',
        'Place background layer (entire duration)'
      ]
    });

    instructions.push({
      phase: 'main_editing',
      steps: [
        'Sync character overlays to emotional beats',
        'Add screen recordings at specified timestamps',
        'Place text overlays at high-importance moments',
        'Add transitions at pattern interrupt markers',
        'Adjust pacing using speed ramping if needed'
      ]
    });

    instructions.push({
      phase: 'audio_mixing',
      steps: [
        'Start with voiceover at 100% volume',
        'Add background music at volumes specified in pacing guide',
        'Insert sound effects at pattern interrupt markers',
        'Duck music volume during important dialogue (sidechain)',
        'Add subtle ambient noise for depth'
      ]
    });

    instructions.push({
      phase: 'viral_optimization',
      steps: [
        'Verify hook grabs attention in first 3 seconds',
        'Ensure pattern interrupts every 1.5-2 minutes',
        'Check that key moments have visual emphasis',
        'Add subtle zoom/shake effects at climactic points',
        'End with strong CTA and subscribe animation'
      ]
    });

    instructions.push({
      phase: 'export',
      steps: [
        'Export at 1080p60fps minimum',
        'Bitrate: 8-12 Mbps',
        'Format: MP4 (H.264)',
        'Audio: 320kbps',
        'Check first 3 seconds render perfectly'
      ]
    });

    return instructions;
  }

  /**
   * Export template as JSON
   */
  exportTemplate(template, filename) {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '_semantic_capcut_template.json';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Export editing guide as text
   */
  exportEditingGuide(template, filename) {
    let text = `SEMANTIC EDITING GUIDE\n`;
    text += `Generated: ${new Date().toISOString()}\n\n`;
    
    text += `PROJECT INFO:\n`;
    text += `- Duration: ${template.project_info.duration_seconds}s\n`;
    text += `- FPS: ${template.project_info.fps}\n`;
    text += `- Resolution: ${template.project_info.resolution.width}x${template.project_info.resolution.height}\n\n`;

    if (template.editing_instructions) {
      template.editing_instructions.forEach(phase => {
        text += `${phase.phase.toUpperCase()}:\n`;
        phase.steps.forEach((step, idx) => {
          text += `  ${idx + 1}. ${step}\n`;
        });
        text += `\n`;
      });
    }

    if (template.viral_markers) {
      text += `VIRAL OPTIMIZATION MARKERS:\n`;
      template.viral_markers.forEach(marker => {
        text += `- [${marker.timestamp}] ${marker.type}: ${marker.instruction}\n`;
      });
      text += `\n`;
    }

    if (template.broll_suggestions) {
      text += `B-ROLL SUGGESTIONS:\n`;
      template.broll_suggestions.forEach(suggestion => {
        text += `- [${suggestion.timestamp}] ${suggestion.content} (${suggestion.duration}s)\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '_editing_guide.txt';
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Utility functions
  timestampToFrames(timestamp) {
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      const seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      return seconds * this.fps;
    }
    return 0;
  }

  secondsToTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getMarkerColor(type) {
    const colors = {
      'hook': '#FF0000',
      'revelation': '#FFD700',
      'example': '#00FF00',
      'transition': '#FF00FF',
      'ad_break': '#00FFFF'
    };
    return colors[type] || '#FFFFFF';
  }

  mapEmotionToAsset(emotion) {
    const mapping = {
      'curious': 'character_curious.png',
      'excited': 'character_excited.png',
      'shocked': 'character_shocked.png',
      'satisfied': 'character_happy.png',
      'engaged': 'character_determined.png'
    };
    return mapping[emotion] || 'character_neutral.png';
  }

  extractKeyPhrase(content) {
    const words = content.split(' ');
    return words.slice(0, Math.min(5, words.length)).join(' ').toUpperCase();
  }

  mapTransitionType(suggestion) {
    if (suggestion.toLowerCase().includes('glitch')) return 'glitch';
    if (suggestion.toLowerCase().includes('zoom')) return 'zoom';
    if (suggestion.toLowerCase().includes('fade')) return 'fade';
    return 'cut';
  }

  suggestBrollSources(contentType) {
    const sources = {
      'screen recording': ['Record actual tool usage', 'Use previous recordings'],
      'closeup': ['Film character PNG with phone', 'Use existing character assets'],
      'example': ['Stock footage from Pexels', 'Previous project footage'],
      'tool': ['Official tool screenshots', 'Demo videos']
    };
    
    for (const [key, value] of Object.entries(sources)) {
      if (contentType.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return ['Stock footage', 'Screen recordings', 'Generated images'];
  }

  getEditingTip(contentType) {
    const tips = {
      'screen recording': 'Add subtle zoom to important UI elements',
      'tool': 'Highlight cursor movements with glow effect',
      'character': 'Match character emotion to dialogue tone',
      'text': 'Animate with typewriter or zoom effect'
    };
    
    for (const [key, value] of Object.entries(tips)) {
      if (contentType.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return 'Cut on action for smooth flow';
  }

  mapEnergyToMusicType(energy) {
    if (energy >= 8) return 'energetic_electronic';
    if (energy >= 6) return 'ambient_building';
    if (energy >= 4) return 'epic_dramatic';
    return 'uplifting_conclusion';
  }

  mapEnergyToBPM(energy) {
    if (energy >= 8) return '140-160';
    if (energy >= 6) return '130-150';
    if (energy >= 4) return '110-130';
    return '100-120';
  }

  calculateMusicVolume(energy) {
    return Math.min(0.4, 0.2 + (energy / 100));
  }

  mapSFXType(suggestion) {
    if (suggestion.toLowerCase().includes('whoosh')) return 'whoosh.mp3';
    if (suggestion.toLowerCase().includes('glitch')) return 'glitch.mp3';
    if (suggestion.toLowerCase().includes('squeal')) return 'anime_squeal.mp3';
    return 'generic_sfx.mp3';
  }
}

export default SemanticCapCutGenerator;
