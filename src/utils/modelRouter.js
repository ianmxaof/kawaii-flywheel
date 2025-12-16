/**
 * ModelRouter - Unified abstraction for LLM calls with provider fallbacks
 * Routes requests to Claude, OpenAI, or Ollama based on config and task type
 * Enforces per-task token budgets and provides graceful degradation
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate'; // Default Ollama URL

/**
 * Task-specific configurations
 */
const TASK_CONFIGS = {
  semantic_analysis: {
    primaryProvider: 'claude',
    maxTokens: 1500,
    temperature: 0.7,
    fallbackMaxTokens: 1000,
    simplifiedPrompt: true
  },
  coach_mode: {
    primaryProvider: 'claude',
    maxTokens: 1000,
    temperature: 0.8,
    fallbackMaxTokens: 800,
    simplifiedPrompt: true
  },
  showrunner_planning: {
    primaryProvider: 'claude',
    maxTokens: 1200,
    temperature: 0.8,
    fallbackMaxTokens: 800,
    simplifiedPrompt: true
  },
  series_architect: {
    primaryProvider: 'claude',
    maxTokens: 1200,
    temperature: 0.8,
    fallbackMaxTokens: 800,
    simplifiedPrompt: true
  },
  atomizer_variants: {
    primaryProvider: 'claude',
    maxTokens: 800,
    temperature: 0.7,
    fallbackMaxTokens: 600,
    simplifiedPrompt: true
  },
  broll_match: {
    primaryProvider: 'openai',
    maxTokens: 256,
    temperature: 0.5,
    fallbackMaxTokens: 128,
    simplifiedPrompt: true
  },
  small_explanation: {
    primaryProvider: 'openai',
    maxTokens: 256,
    temperature: 0.7,
    fallbackMaxTokens: 128,
    simplifiedPrompt: true
  },
  idea_normalization: {
    primaryProvider: 'claude',
    maxTokens: 1500,
    temperature: 0.7,
    fallbackMaxTokens: 1000,
    simplifiedPrompt: true
  },
  thumbnail_claims: {
    primaryProvider: 'claude',
    maxTokens: 800,
    temperature: 0.8,
    fallbackMaxTokens: 600,
    simplifiedPrompt: true
  },
  narration: {
    primaryProvider: 'claude',
    maxTokens: 2000,
    temperature: 0.8,
    fallbackMaxTokens: 1500,
    simplifiedPrompt: true
  }
};

export class ModelRouter {
  constructor() {
    this.primaryProvider = import.meta.env.VITE_PRIMARY_MODEL_PROVIDER || 'claude';
    this.claudeModel = import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    this.openaiModel = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    this.ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1';
    this.ollamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
    
    this.claudeApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Cache for results
    this.cache = new Map();
  }

  /**
   * Generate cache key from task and inputs
   */
  _getCacheKey(task, scriptHash, persona, options = {}) {
    const optionsStr = JSON.stringify(options);
    return `${task}_${scriptHash}_${persona || 'default'}_${optionsStr}`;
  }

  /**
   * Hash a string (simple hash for caching)
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Main entry point for LLM calls
   * @param {Object} params
   * @param {string} params.task - Task type (semantic_analysis, coach_mode, etc.)
   * @param {Array} params.messages - Array of message objects {role, content}
   * @param {number} [params.maxTokens] - Override max tokens (optional)
   * @param {string} [params.scriptHash] - Hash of script for caching (optional)
   * @param {string} [params.persona] - Persona identifier for caching (optional)
   * @param {Object} [params.options] - Additional options for caching (optional)
   * @param {boolean} [params.useCache] - Whether to use cache (default: true)
   */
  async chat({ task, messages, maxTokens, scriptHash, persona, options = {}, useCache = true }) {
    const config = TASK_CONFIGS[task];
    if (!config) {
      throw new Error(`Unknown task type: ${task}`);
    }

    // Check cache if enabled
    if (useCache && scriptHash) {
      const cacheKey = this._getCacheKey(task, scriptHash, persona, options);
      if (this.cache.has(cacheKey)) {
        console.log(`[ModelRouter] Cache hit for ${task}`);
        return this.cache.get(cacheKey);
      }
    }

    const effectiveMaxTokens = maxTokens || config.maxTokens;
    const providers = this._getProviderOrder(task, config);

    let lastError = null;
    for (const provider of providers) {
      try {
        console.log(`[ModelRouter] Trying ${provider} for ${task}...`);
        const result = await this._callProvider(provider, {
          task,
          messages,
          maxTokens: effectiveMaxTokens,
          config,
          attempt: providers.indexOf(provider) + 1
        });

        // Cache result if enabled
        if (useCache && scriptHash) {
          const cacheKey = this._getCacheKey(task, scriptHash, persona, options);
          this.cache.set(cacheKey, result);
        }

        return result;
      } catch (error) {
        console.warn(`[ModelRouter] ${provider} failed:`, error.message);
        lastError = error;
        
        // If this was the last provider, throw
        if (provider === providers[providers.length - 1]) {
          throw new Error(`All providers failed. Last error: ${lastError.message}`);
        }
      }
    }

    throw lastError || new Error('No providers available');
  }

  /**
   * Determine provider order based on task config and availability
   */
  _getProviderOrder(task, config) {
    const order = [config.primaryProvider];
    
    // Add fallbacks
    if (config.primaryProvider === 'claude') {
      order.push('openai', 'ollama');
    } else if (config.primaryProvider === 'openai') {
      order.push('claude', 'ollama');
    } else {
      order.push('claude', 'openai');
    }

    // Filter based on API key availability
    return order.filter(provider => {
      if (provider === 'claude') return !!this.claudeApiKey;
      if (provider === 'openai') return !!this.openaiApiKey;
      if (provider === 'ollama') return true; // Ollama doesn't need API key
      return false;
    });
  }

  /**
   * Call a specific provider
   */
  async _callProvider(provider, { task, messages, maxTokens, config, attempt }) {
    // Use simplified prompt for fallback attempts
    const useSimplified = attempt > 1 && config.simplifiedPrompt;
    const effectiveMaxTokens = attempt > 1 ? config.fallbackMaxTokens : maxTokens;

    if (provider === 'claude') {
      return this._callClaude(messages, effectiveMaxTokens, useSimplified);
    } else if (provider === 'openai') {
      return this._callOpenAI(messages, effectiveMaxTokens, useSimplified);
    } else if (provider === 'ollama') {
      return this._callOllama(messages, effectiveMaxTokens, useSimplified);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Call Claude API
   */
  async _callClaude(messages, maxTokens, simplified = false) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    // Simplify messages if needed
    const processedMessages = simplified 
      ? this._simplifyMessages(messages)
      : messages;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.claudeModel,
        max_tokens: maxTokens,
        messages: processedMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call OpenAI API
   */
  async _callOpenAI(messages, maxTokens, simplified = false) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Simplify messages if needed
    const processedMessages = simplified 
      ? this._simplifyMessages(messages)
      : messages;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: this.openaiModel,
        max_tokens: maxTokens,
        messages: processedMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Ollama API (local)
   */
  async _callOllama(messages, maxTokens, simplified = false) {
    // Simplify messages if needed
    const processedMessages = simplified 
      ? this._simplifyMessages(messages)
      : messages;

    // Convert messages to prompt format for Ollama
    const prompt = this._messagesToPrompt(processedMessages);

    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Simplify messages for fallback providers
   */
  _simplifyMessages(messages) {
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        // Truncate long messages
        if (msg.content.length > 2000) {
          return {
            ...msg,
            content: msg.content.substring(0, 2000) + '... [truncated]'
          };
        }
      }
      return msg;
    });
  }

  /**
   * Convert messages array to prompt string for Ollama
   */
  _messagesToPrompt(messages) {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'User';
      const content = typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content);
      return `${role}: ${content}`;
    }).join('\n\n') + '\n\nAssistant:';
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Get consensus from multiple models
   * Calls multiple models in parallel and returns weighted consensus
   * 
   * @param {Object} params
   * @param {string} params.task - Task type
   * @param {Array} params.messages - Array of message objects
   * @param {number} [params.numModels=2] - Number of models to use (2 for MVP: Claude + GPT-4)
   * @param {number} [params.maxTokens] - Override max tokens
   * @param {string} [params.scriptHash] - Hash for caching
   * @param {Object} [params.options] - Additional options
   * @returns {Promise<Object>} Consensus result with confidence score
   */
  async getConsensus({ task, messages, numModels = 2, maxTokens, scriptHash, options = {} }) {
    const config = TASK_CONFIGS[task];
    if (!config) {
      throw new Error(`Unknown task type: ${task}`);
    }

    // Model weights per task type
    const weights = {
      'idea_normalization': { claude: 0.6, gpt4: 0.4 },
      'thumbnail_claims': { claude: 0.5, gpt4: 0.5 },
      'narration': { claude: 0.6, gpt4: 0.4 },
      'coach_mode': { claude: 0.6, gpt4: 0.4 }
    };

    const taskWeights = weights[task] || { claude: 0.6, gpt4: 0.4 };

    // Determine which models to use
    const availableModels = [];
    if (this.claudeApiKey && taskWeights.claude > 0) {
      availableModels.push({ name: 'claude', weight: taskWeights.claude });
    }
    if (this.openaiApiKey && taskWeights.gpt4 > 0) {
      availableModels.push({ name: 'gpt4', weight: taskWeights.gpt4 });
    }

    // Limit to numModels
    const modelsToUse = availableModels.slice(0, numModels);

    if (modelsToUse.length === 0) {
      throw new Error('No models available for consensus');
    }

    // Call all models in parallel
    const promises = modelsToUse.map(async (model) => {
      try {
        const result = await this._callProvider(model.name, {
          task,
          messages,
          maxTokens: maxTokens || config.maxTokens,
          config,
          attempt: 1
        });
        return { model: model.name, result, weight: model.weight, success: true };
      } catch (error) {
        console.warn(`[ModelRouter] Consensus: ${model.name} failed:`, error.message);
        return { model: model.name, result: null, weight: model.weight, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);

    // Filter successful results
    const successfulResults = results.filter(r => r.success && r.result);

    if (successfulResults.length === 0) {
      throw new Error('All models failed in consensus call');
    }

    // Calculate weighted consensus
    // For text responses, we'll use the highest weighted model's response
    // In a more sophisticated implementation, we could parse and merge responses
    let consensusResult = null;
    let totalWeight = 0;
    let maxWeight = 0;
    let bestModel = null;

    for (const result of successfulResults) {
      totalWeight += result.weight;
      if (result.weight > maxWeight) {
        maxWeight = result.weight;
        bestModel = result.model;
        consensusResult = result.result;
      }
    }

    // Calculate confidence based on agreement
    // For MVP, confidence is based on number of successful models
    let confidence = 0.5; // Base confidence
    if (successfulResults.length === 2) {
      // Both models agreed (both succeeded)
      confidence = 0.85;
    } else if (successfulResults.length === 1) {
      // Only one model succeeded
      confidence = 0.65;
    }

    // Detect outliers (high-confidence minority opinions)
    // For MVP, we'll just note if there's disagreement
    const hasDisagreement = successfulResults.length < modelsToUse.length;

    return {
      result: consensusResult,
      confidence,
      modelsUsed: successfulResults.map(r => r.model),
      bestModel,
      totalWeight,
      hasDisagreement,
      allResults: successfulResults.map(r => ({
        model: r.model,
        weight: r.weight,
        success: r.success
      }))
    };
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();
export default modelRouter;

