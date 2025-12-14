const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export class ScriptGenerator {
  constructor() {
    // API key handled by environment variable
  }

  /**
   * Generate a monetizable YouTube script
   * @param {string} videoIdea - The video topic/idea
   * @param {number} targetMinutes - Target length (8-15 minutes)
   * @param {string} style - Content style ('tutorial', 'rant', 'case_study')
   * @param {string} apiKey - Claude API key
   * @returns {Promise<Object>} Generated script with metadata
   */
  async generateMonetizableScript(videoIdea, targetMinutes = 10, style = 'tutorial', apiKey) {
    if (!apiKey) {
      throw new Error('Claude API key is required. Set VITE_CLAUDE_API_KEY in .env');
    }

    const wordCount = targetMinutes * 150; // 2.5 words/second speaking rate
    const prompt = this.buildScriptPrompt(videoIdea, targetMinutes, wordCount, style);
    
    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      const data = await response.json();
      const scriptText = data.content[0].text;
      
      return this.parseScript(scriptText, targetMinutes, videoIdea);
      
    } catch (error) {
      console.error('Script generation failed:', error);
      throw new Error('Failed to generate script: ' + error.message);
    }
  }

  /**
   * Build the prompt for script generation
   */
  buildScriptPrompt(videoIdea, targetMinutes, wordCount, style) {
    const styleGuidelines = {
      tutorial: {
        tone: 'Educational but energetic, step-by-step',
        structure: 'Problem → Solution → Demo → Results',
        hooks: ['Nobody shows you this...', 'The real way to...', 'This changed everything...']
      },
      rant: {
        tone: 'Edgy, cynical, contrarian',
        structure: 'Frustration → Revelation → Better Way → Call to Arms',
        hooks: ['Everyone is doing this WRONG...', 'Companies don\'t want you to know...', 'This is insane...']
      },
      case_study: {
        tone: 'Story-driven, results-focused',
        structure: 'Challenge → Journey → Breakthrough → Lessons',
        hooks: ['I tried something impossible...', 'Here\'s what happened when...', 'This shouldn\'t have worked...']
      }
    };

    const guide = styleGuidelines[style] || styleGuidelines.tutorial;
    
    // Calculate ad break timings
    const adBreaks = [];
    for (let i = 2; i <= targetMinutes - 2; i += 3) {
      adBreaks.push(i);
    }

    return `Generate a ${targetMinutes}-minute YouTube script optimized for monetization.

TOPIC: "${videoIdea}"

REQUIREMENTS:
- Total length: ${targetMinutes} minutes (approximately ${wordCount} words)
- Speaking rate: 2.5 words per second
- Style: ${guide.tone}
- Structure: ${guide.structure}

SCRIPT STRUCTURE:

[00:00-00:15] HOOK (Critical for retention)
- Use one of these patterns: ${guide.hooks.join(' / ')}
- Create immediate curiosity gap
- Promise specific value
- No fluff, get straight to tension

[00:15-00:30] INTRO & PROMISE
- Character introduction (anime style, kawaii energy)
- State what viewer will learn/achieve
- Establish credibility (personal experience)
- Include anime sound effect: *squeal* or *gasp*

[00:30-${adBreaks[0]}:00] SECTION 1: Foundation
- Set up the problem/context
- Why current solutions fail
- Build tension toward first breakthrough
- End on cliffhanger: "But here's where it gets INSANE..."

[${adBreaks[0]}:00] AD BREAK POINT #1
- Natural pause in narrative
- Cliffhanger ending
- Resume with: "Before I show you the solution..."

[${adBreaks[0]}:15-${adBreaks[1] || Math.floor(targetMinutes/2)}:00] SECTION 2: Main Content
- Step-by-step breakdown OR story progression
- Include 3-5 key points with timestamps
- Visual cues: [SCREEN RECORDING], [ZOOM ON CHARACTER], etc.
- Pattern interrupt at midpoint (surprise fact/visual)

${adBreaks[1] ? `[${adBreaks[1]}:00] AD BREAK POINT #2
- Another cliffhanger
- "Now here's the part nobody talks about..."
` : ''}

[${Math.floor(targetMinutes * 0.7)}:00-${targetMinutes - 1}:00] SECTION 3: Deep Dive
- Advanced tips OR unexpected results
- Address common objections
- Edgy take: why this isn't mainstream
- Build to final revelation

[${targetMinutes - 1}:00-${targetMinutes}:00] CONCLUSION
- Quick recap (3 main points max)
- Strong CTA: subscribe, try this, comment
- Character sign-off with anime energy
- Final *kawaii squeal*

CRITICAL RULES:
1. Every minute should have a timestamp: [MM:SS]
2. Include visual direction: [ACTION/VISUAL CUE]
3. Mark ad break points clearly
4. Build tension before each ad break
5. No generic filler - every sentence earns its place
6. Include anime character reactions: *squeal*, *gasp*, *determined*
7. Mention specific tools/numbers for credibility

AD OPTIMIZATION:
- Ad breaks at: ${adBreaks.map(t => `${t}:00`).join(', ')}
- Each break should feel like a natural pause
- Resume after break with "Before we continue..." or similar

CHARACTER STYLE:
- Name: Cursor-chan (or similar anime-style name)
- Personality: Helpful but edgy, anti-corporate
- Voice: High energy, occasional squeals
- Attitude: "I'm showing you the forbidden stuff"

FORMAT:
[TIMESTAMP] - [VISUAL CUE] - [DIALOGUE]

Example:
[00:00] - Explosion effect with title card
"Nobody talks about this automation hack..."

[00:03] - Close-up on shocked anime face
"And companies are TERRIFIED of you knowing this."

Now generate the complete ${targetMinutes}-minute script:`;
  }

  /**
   * Parse the generated script into structured format
   */
  parseScript(scriptText, targetMinutes, videoIdea) {
    // Extract timestamps and sections
    const lines = scriptText.split('\n').filter(line => line.trim());
    
    const sections = [];
    const adBreaks = [];
    let currentSection = null;
    
    lines.forEach(line => {
      const timestampMatch = line.match(/\[(\d{1,2}):(\d{2})\]/);
      
      if (timestampMatch) {
        const minutes = parseInt(timestampMatch[1]);
        const seconds = parseInt(timestampMatch[2]);
        const totalSeconds = minutes * 60 + seconds;
        
        if (line.toLowerCase().includes('ad break')) {
          adBreaks.push({
            timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            totalSeconds
          });
        } else {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            totalSeconds,
            content: line
          };
        }
      } else if (currentSection) {
        currentSection.content += '\n' + line;
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      videoIdea,
      targetMinutes,
      estimatedWordCount: targetMinutes * 150,
      script: scriptText,
      sections,
      adBreaks,
      metadata: {
        hookStrength: this.analyzeHook(sections[0]?.content || ''),
        retentionScore: this.calculateRetentionScore(sections),
        adRevenueMultiplier: adBreaks.length >= 2 ? '4-6x' : '2-3x'
      }
    };
  }

  /**
   * Analyze hook strength
   */
  analyzeHook(hookText) {
    const strongPatterns = [
      'nobody',
      'secret',
      'hidden',
      'banned',
      'forbidden',
      'insane',
      'impossible',
      'wrong',
      'terrified'
    ];
    
    const lowerHook = hookText.toLowerCase();
    const matchCount = strongPatterns.filter(p => lowerHook.includes(p)).length;
    
    if (matchCount >= 2) return 'High';
    if (matchCount === 1) return 'Medium';
    return 'Low';
  }

  /**
   * Calculate retention score based on pacing
   */
  calculateRetentionScore(sections) {
    // Check for pattern interrupts, cliffhangers, etc.
    const hasGoodPacing = sections.length >= 5;
    const hasVariety = sections.some(s => 
      s.content.toLowerCase().includes('screen') || 
      s.content.toLowerCase().includes('visual')
    );
    
    if (hasGoodPacing && hasVariety) return 'High';
    if (hasGoodPacing || hasVariety) return 'Medium';
    return 'Low';
  }

  /**
   * Generate script variations for A/B testing
   */
  async generateVariations(baseScript, count = 3) {
    const variations = [];
    
    const hooks = [
      'Nobody talks about this...',
      'This changed everything...',
      'Companies don\'t want you to know...',
      'I discovered something impossible...',
      'Everyone is doing this WRONG...'
    ];
    
    for (let i = 0; i < count; i++) {
      const modifiedScript = baseScript.script.replace(
        /\[00:00\].*?\n.*?\n/,
        `[00:00] - Title card with explosion\n"${hooks[i % hooks.length]}"\n`
      );
      
      variations.push({
        version: i + 1,
        hook: hooks[i % hooks.length],
        script: modifiedScript
      });
    }
    
    return variations;
  }
}

export default ScriptGenerator;

