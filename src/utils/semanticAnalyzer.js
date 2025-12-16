import { modelRouter } from './modelRouter';

/**
 * Semantic Analyzer for YouTube Scripts
 * Analyzes dialogue content using ModelRouter to detect emotional beats, key moments, and pacing
 */
export class SemanticAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey || import.meta.env.VITE_CLAUDE_API_KEY;
    this.modelRouter = modelRouter;
  }

  /**
   * Main analysis function
   * Analyzes script semantically and returns comprehensive analysis
   */
  async analyzeScriptSemantics(scriptText, durationMinutes) {
    try {
      const scriptHash = this.modelRouter._hashString(scriptText + durationMinutes);
      
      const analysisText = await this.modelRouter.chat({
        task: 'semantic_analysis',
        messages: [{
          role: 'user',
          content: `Analyze this ${durationMinutes}-minute YouTube script for video editing purposes.

SCRIPT:
${scriptText}

Provide detailed semantic analysis in this EXACT JSON format:

{
  "emotional_arc": {
    "intro": { "emotion": "curious/excited", "energy": 0-10, "timestamp": "0:00-0:15" },
    "rising_action": { "emotion": "engaged", "energy": 0-10, "timestamp": "0:15-2:00" },
    "climax": { "emotion": "revelation/shock", "energy": 0-10, "timestamp": "2:00-3:00" },
    "resolution": { "emotion": "satisfied", "energy": 0-10, "timestamp": "3:00-end" }
  },
  "key_moments": [
    { "timestamp": "0:03", "type": "hook", "content": "main hook line", "importance": 10 },
    { "timestamp": "1:30", "type": "revelation", "content": "key insight", "importance": 8 },
    { "timestamp": "5:00", "type": "example", "content": "practical demo", "importance": 7 }
  ],
  "pacing_analysis": {
    "overall_pace": "fast/medium/slow",
    "speed_changes": [
      { "timestamp": "0:00-2:00", "pace": "fast", "reason": "hook and engagement" },
      { "timestamp": "2:00-5:00", "pace": "medium", "reason": "explanation phase" }
    ]
  },
  "visual_suggestions": [
    { "timestamp": "0:05", "suggestion": "screen recording of tool", "duration": 30 },
    { "timestamp": "2:00", "suggestion": "closeup on character shocked face", "duration": 3 }
  ],
  "ad_break_analysis": [
    { "timestamp": "2:00", "quality": "excellent", "reason": "natural pause after revelation" },
    { "timestamp": "5:00", "quality": "good", "reason": "between sections" }
  ],
  "pattern_interrupts": [
    { "timestamp": "0:15", "type": "visual", "suggestion": "zoom in on key text" },
    { "timestamp": "2:00", "type": "transition", "suggestion": "glitch effect" },
    { "timestamp": "4:30", "type": "sound", "suggestion": "whoosh sound effect" }
  ],
  "voiceover_guide": {
    "emphasis_points": [
      { "timestamp": "0:03", "text": "key phrase", "reason": "hook moment" }
    ],
    "pause_points": [
      { "timestamp": "1:30", "duration": 0.5, "reason": "let revelation sink in" }
    ],
    "energy_levels": [
      { "timestamp": "0:00-0:15", "level": "high", "reason": "grab attention" },
      { "timestamp": "2:00-3:00", "level": "peak", "reason": "climax moment" }
    ]
  }
}

Return ONLY valid JSON, no extra text.`
        }],
        scriptHash,
        useCache: true
      });

      // Parse JSON response
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.normalizeAnalysis(parsed, durationMinutes);
        }
      } catch (error) {
        console.error('Failed to parse semantic analysis:', error);
      }

      // Fallback to basic analysis
      return this.generateFallbackAnalysis(scriptText, durationMinutes);
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      // Return fallback analysis
      return this.generateFallbackAnalysis(scriptText, durationMinutes);
    }
  }

  /**
   * Normalize and validate analysis data
   */
  normalizeAnalysis(analysis, durationMinutes) {
    // Ensure all required fields exist
    const normalized = {
      emotional_arc: analysis.emotional_arc || this.generateDefaultEmotionalArc(durationMinutes),
      key_moments: analysis.key_moments || [],
      pacing_analysis: analysis.pacing_analysis || { overall_pace: 'medium', speed_changes: [] },
      visual_suggestions: analysis.visual_suggestions || [],
      ad_break_analysis: analysis.ad_break_analysis || [],
      pattern_interrupts: analysis.pattern_interrupts || [],
      voiceover_guide: analysis.voiceover_guide || {
        emphasis_points: [],
        pause_points: [],
        energy_levels: []
      }
    };

    return normalized;
  }

  /**
   * Generate fallback analysis if Claude API fails
   */
  generateFallbackAnalysis(scriptText, durationMinutes) {
    const midpoint = Math.floor(durationMinutes / 2);
    
    return {
      emotional_arc: {
        intro: { emotion: 'curious', energy: 8, timestamp: '0:00-0:15' },
        rising_action: { emotion: 'engaged', energy: 7, timestamp: '0:15-2:00' },
        climax: { emotion: 'revelation', energy: 9, timestamp: `${midpoint}:00-${midpoint + 1}:00` },
        resolution: { emotion: 'satisfied', energy: 6, timestamp: `${durationMinutes - 1}:00-end` }
      },
      key_moments: [
        { timestamp: '0:03', type: 'hook', content: scriptText.substring(0, 50), importance: 10 },
        { timestamp: `${midpoint}:00`, type: 'climax', content: 'Key insight', importance: 9 }
      ],
      pacing_analysis: {
        overall_pace: 'medium',
        speed_changes: []
      },
      visual_suggestions: [],
      ad_break_analysis: [],
      pattern_interrupts: [],
      voiceover_guide: {
        emphasis_points: [
          { timestamp: '0:03', text: scriptText.substring(0, 30), reason: 'Hook moment' }
        ],
        pause_points: [],
        energy_levels: [
          { timestamp: '0:00-0:15', level: 'high', reason: 'Grab attention' }
        ]
      }
    };
  }

  /**
   * Generate default emotional arc structure
   */
  generateDefaultEmotionalArc(durationMinutes) {
    return {
      intro: { emotion: 'curious', energy: 8, timestamp: '0:00-0:15' },
      rising_action: { emotion: 'engaged', energy: 7, timestamp: '0:15-2:00' },
      climax: { emotion: 'revelation', energy: 9, timestamp: `${Math.floor(durationMinutes/2)}:00` },
      resolution: { emotion: 'satisfied', energy: 6, timestamp: `${durationMinutes-1}:00-end` }
    };
  }

  /**
   * Calculate semantic quality score (0-100)
   */
  calculateSemanticScore(analysis) {
    let score = 50; // Base score

    // Emotional arc completeness
    if (analysis.emotional_arc && Object.keys(analysis.emotional_arc).length >= 4) {
      score += 15;
    }

    // Key moments identified
    if (analysis.key_moments && analysis.key_moments.length >= 3) {
      score += 10;
    }

    // Pattern interrupts (critical for retention)
    if (analysis.pattern_interrupts && analysis.pattern_interrupts.length >= 2) {
      score += 15;
    }

    // Voiceover guide completeness
    if (analysis.voiceover_guide) {
      if (analysis.voiceover_guide.emphasis_points?.length > 0) score += 5;
      if (analysis.voiceover_guide.pause_points?.length > 0) score += 5;
    }

    return Math.min(100, score);
  }
}

export default SemanticAnalyzer;
