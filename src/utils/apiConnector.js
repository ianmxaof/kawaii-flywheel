import { modelRouter } from './modelRouter';

/**
 * Unified API connector for all external services
 */
export class APIConnector {
  constructor() {
    this.claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    this.backendUrl = import.meta.env.VITE_ELEVENLABS_BACKEND_URL || 'http://localhost:5000';
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.modelRouter = modelRouter;
  }

  /**
   * Retry wrapper for API calls
   */
  async retryRequest(fn, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  /**
   * Make Claude API request (deprecated - use ModelRouter instead)
   * Kept for backward compatibility
   */
  async callClaudeAPI(messages, maxTokens = 4000, model = 'claude-sonnet-4-20250514') {
    // Use ModelRouter with a generic task type
    return this.retryRequest(async () => {
      return await this.modelRouter.chat({
        task: 'small_explanation',
        messages,
        maxTokens,
        useCache: false
      });
    });
  }

  // ==================== CLAUDE API METHODS ====================

  /**
   * Analyze optimal video length for a given idea
   */
  async analyzeOptimalLength(idea) {
    const response = await this.modelRouter.chat({
      task: 'small_explanation',
      messages: [
        {
          role: 'user',
          content: `Analyze this video idea and determine optimal length for maximum engagement and monetization:

"${idea}"

Consider:
- Topic complexity (simple how-to vs deep dive)
- Information density needed
- Viewer attention span for this niche
- Monetization balance (longer = more ads, but retention drops)

Respond with ONLY a number between 8-15 representing optimal minutes.`
        }
      ],
      maxTokens: 500,
      useCache: false
    });

    const lengthMatch = response.match(/\d+/);
    return lengthMatch ? parseInt(lengthMatch[0]) : 10;
  }

  /**
   * Generate script from idea
   */
  async generateScript(idea, length, style = 'tutorial') {
    const wordCount = length * 150;
    const scriptHash = this.modelRouter._hashString(idea + length + style);
    
    const response = await this.modelRouter.chat({
      task: 'semantic_analysis', // Using semantic_analysis task for script generation
      messages: [
        {
          role: 'user',
          content: `Generate a ${length}-minute YouTube script optimized for monetization.

TOPIC: "${idea}"

STRUCTURE:
- [00:00-00:15] Hook (curiosity gap)
- [00:15-00:30] Promise + character intro
- [00:30-${Math.floor(length/2)}:00] Main content with timestamps
- [${Math.floor(length/2)}:00-${length-1}:00] Deep dive
- [${length-1}:00-${length}:00] CTA + outro

AD BREAKS at: 2:00, 5:00, 8:00 (natural cliffhangers)

Include: [TIMESTAMP] - [VISUAL] - [DIALOGUE]
Style: Anime automation channel, edgy but helpful
Character: Kawaii anime girl voice

Total words: ~${wordCount} (2.5 words/sec)`
        }
      ],
      maxTokens: 4000,
      scriptHash,
      persona: style,
      useCache: true
    });

    return {
      text: response,
      length: length,
      wordCount: wordCount,
      adBreaks: [2, 5, 8].filter(t => t < length - 1),
      style: style
    };
  }

  /**
   * Predict virality score for script and idea
   * Uses robust ViralityPredictor class
   */
  async predictVirality(script, idea) {
    const { ViralityPredictor } = await import('./viralityPredictor');
    const predictor = new ViralityPredictor();
    
    const scriptText = typeof script === 'string' ? script : script.text || '';
    const scriptLength = typeof script === 'string' 
      ? Math.ceil(scriptText.split(' ').length / 150) // Estimate from word count
      : script.length || 10;
    
    const result = await predictor.predictVirality({
      title: idea,
      scriptText,
      length: scriptLength,
      thumbnailConcept: null,
      targetAudience: 'productivity enthusiasts',
      contentType: 'tutorial'
    });

    return {
      viralityScore: result.score,
      breakdown: result.breakdown,
      fatalFlaws: result.fatalFlaws,
      improvements: result.improvements,
      viewPrediction: result.viewPrediction,
      confidence: result.confidence,
      monetizationPotential: result.monetizationPotential,
      analysis: this.formatAnalysisText(result)
    };
  }

  /**
   * Format analysis result as readable text
   */
  formatAnalysisText(result) {
    let text = `VIRALITY SCORE: ${result.score}/100\n\n`;
    
    text += `SCORE BREAKDOWN:\n`;
    Object.entries(result.breakdown).forEach(([key, value]) => {
      text += `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(value * 100)}%\n`;
    });
    
    if (result.fatalFlaws.length > 0) {
      text += `\nFATAL FLAWS:\n`;
      result.fatalFlaws.forEach(flaw => {
        text += `- [${flaw.severity.toUpperCase()}] ${flaw.message}\n`;
      });
    }
    
    if (result.improvements.length > 0) {
      text += `\nTOP IMPROVEMENTS:\n`;
      result.improvements.slice(0, 5).forEach(imp => {
        text += `- ${imp.suggestion}\n`;
      });
    }
    
    text += `\nVIEW PREDICTION:\n`;
    text += `Week 1: ${result.viewPrediction.week1.min.toLocaleString()} - ${result.viewPrediction.week1.max.toLocaleString()} views\n`;
    text += `Potential: ${result.viewPrediction.potential}\n`;
    
    return text;
  }

  /**
   * Generate thumbnail concepts from script
   */
  async generateThumbnailConcepts(script) {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    const scriptHook = scriptText.substring(0, 600);
    const scriptHash = this.modelRouter._hashString(scriptHook);

    const response = await this.modelRouter.chat({
      task: 'small_explanation',
      messages: [
        {
          role: 'user',
          content: `Based on this video script, generate 3 thumbnail concepts that maximize CTR.

SCRIPT HOOK: ${scriptHook}

For each concept, provide:
1. VISUAL COMPOSITION:
   - Main subject (anime character emotion/pose)
   - Background scene
   - Supporting elements (icons, logos)

2. TEXT OVERLAY:
   - Main text (3-5 words, ALL CAPS)
   - Color scheme
   - Placement

3. EMOTIONAL TRIGGER:
   - What feeling does it evoke?
   - Why would someone click?

Format as:
CONCEPT 1:
Character: [description for Perchance]
Background: [description for Perchance]
Text: [exact text]
Color: [hex codes]

CONCEPT 2: ...
CONCEPT 3: ...`
        }
      ],
      maxTokens: 1500,
      scriptHash,
      useCache: true
    });

    // Parse concepts
    const conceptMatches = response.match(/CONCEPT \d+:([\s\S]*?)(?=CONCEPT \d+:|$)/g) || [];
    
    return conceptMatches.map((concept, i) => ({
      id: i + 1,
      description: concept,
      generated: false
    }));
  }

  /**
   * Translate script to multiple languages
   */
  async translateScript(script, languages) {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    const translations = {};
    
    const langNames = {
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      ja: 'Japanese',
      ko: 'Korean'
    };

    for (const lang of languages) {
      if (lang === 'en') {
        translations[lang] = scriptText;
        continue;
      }

      try {
        const scriptHash = this.modelRouter._hashString(scriptText + lang);
        const response = await this.modelRouter.chat({
          task: 'semantic_analysis',
          messages: [
            {
              role: 'user',
              content: `Translate this YouTube script to ${langNames[lang]}.

IMPORTANT: 
- Maintain all [TIMESTAMP] markers exactly
- Keep [VISUAL CUES] in English
- Translate dialogue naturally (not word-for-word)
- Preserve tone (edgy, helpful, anime style)
- Keep same pacing (word count ±10%)

ORIGINAL SCRIPT:
${scriptText}

Provide full translated script with timestamps.`
            }
          ],
          maxTokens: 4000,
          scriptHash,
          persona: lang,
          useCache: true
        });

        translations[lang] = response;
      } catch (error) {
        console.error(`Translation to ${lang} failed:`, error);
        translations[lang] = null;
      }
    }

    return translations;
  }

  // ==================== ELEVENLABS API METHODS (via backend) ====================

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices(animeOnly = false) {
    const endpoint = animeOnly ? '/api/voiceover/anime-voices' : '/api/voiceover/voices';
    
    return this.retryRequest(async () => {
      const response = await fetch(`${this.backendUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.voices || [];
    });
  }

  /**
   * Generate voiceover from script
   */
  async generateVoiceover(script, voiceId, outputName = 'voiceover.mp3', settings = {}) {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    
    return this.retryRequest(async () => {
      const response = await fetch(`${this.backendUrl}/api/voiceover/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptText,
          voice_id: voiceId,
          output_name: outputName,
          settings: settings
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Voiceover generation failed: ${response.statusText}`);
      }

      return await response.json();
    });
  }

  /**
   * Estimate cost for voiceover generation
   */
  async estimateCost(script, tier = 'starter') {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    
    return this.retryRequest(async () => {
      const response = await fetch(`${this.backendUrl}/api/estimate-cost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptText,
          tier: tier,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cost estimation failed: ${response.statusText}`);
      }

      return await response.json();
    });
  }

  /**
   * Download generated voiceover file
   */
  async downloadVoiceover(filename) {
    const response = await fetch(`${this.backendUrl}/api/voiceover/download/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export default APIConnector;