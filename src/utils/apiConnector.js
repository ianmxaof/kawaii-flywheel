const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Unified API connector for all external services
 */
export class APIConnector {
  constructor() {
    this.claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    this.backendUrl = import.meta.env.VITE_ELEVENLABS_BACKEND_URL || 'http://localhost:5000';
    this.maxRetries = 3;
    this.retryDelay = 2000;
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
   * Make Claude API request
   */
  async callClaudeAPI(messages, maxTokens = 4000, model = 'claude-sonnet-4-20250514') {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key is required. Set VITE_CLAUDE_API_KEY in .env');
    }

    return this.retryRequest(async () => {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      const data = await response.json();
      return data.content[0].text;
    });
  }

  // ==================== CLAUDE API METHODS ====================

  /**
   * Analyze optimal video length for a given idea
   */
  async analyzeOptimalLength(idea) {
    const response = await this.callClaudeAPI([
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
    ], 500);

    const lengthMatch = response.match(/\d+/);
    return lengthMatch ? parseInt(lengthMatch[0]) : 10;
  }

  /**
   * Generate script from idea
   */
  async generateScript(idea, length, style = 'tutorial') {
    const wordCount = length * 150;
    
    const response = await this.callClaudeAPI([
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
    ], 4000);

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
   */
  async predictVirality(script, idea) {
    const scriptHook = typeof script === 'string' ? script.substring(0, 500) : script.text?.substring(0, 500) || '';
    
    const response = await this.callClaudeAPI([
      {
        role: 'user',
        content: `Analyze this YouTube video for virality potential.

TITLE: "${idea}"

SCRIPT HOOK: ${scriptHook}

Rate 0-100 based on:
1. Hook strength (curiosity gap, emotional trigger)
2. Title clickability (but not clickbait)
3. Topic trend alignment (automation/AI is trending)
4. Script pacing (pattern interrupts, retention hooks)
5. Unique angle (contrarian take, fresh perspective)

Respond with:
SCORE: [number 0-100]
STRENGTHS: [2-3 bullet points]
IMPROVEMENTS: [2-3 specific fixes]
PREDICTED VIEWS (7 days): [estimate]`
      }
    ], 1000);

    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    return {
      viralityScore: score,
      analysis: response
    };
  }

  /**
   * Generate thumbnail concepts from script
   */
  async generateThumbnailConcepts(script) {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    const scriptHook = scriptText.substring(0, 600);

    const response = await this.callClaudeAPI([
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
    ], 1500);

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
        const response = await this.callClaudeAPI([
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
        ], 4000);

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
    const endpoint = animeOnly ? '/api/anime-voices' : '/api/voices';
    
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
  async generateVoiceover(script, voiceId, outputName = 'voiceover.mp3') {
    const scriptText = typeof script === 'string' ? script : script.text || '';
    
    return this.retryRequest(async () => {
      const response = await fetch(`${this.backendUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptText,
          voice_id: voiceId,
          output_name: outputName,
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
    const response = await fetch(`${this.backendUrl}/api/download/${filename}`);
    
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