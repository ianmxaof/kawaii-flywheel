import React, { useState } from 'react';
import { Copy, Check, Download, Sparkles, RefreshCw, Youtube, Instagram, Linkedin, Facebook } from 'lucide-react';
import { modelRouter } from '../../utils/modelRouter';

/**
 * Platform Atomizer Panel - Converts one script into platform-specific variants
 */
export default function PlatformAtomizerPanel({ script, semanticAnalysis, onVariantsGenerated }) {
  const [variants, setVariants] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  /**
   * Generate platform variants
   */
  const generateVariants = async () => {
    if (!script) {
      setError('No script available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const scriptText = typeof script === 'string' ? script : script.text || '';
      
      // Extract key information from semantic analysis
      const hook = semanticAnalysis?.key_moments?.find(m => m.type === 'hook')?.content || 
                   scriptText.substring(0, 200);
      const keyMoments = semanticAnalysis?.key_moments?.slice(0, 5).map(m => m.content).join('; ') || 
                         'Key moments from script';
      const cta = scriptText.includes('Subscribe') || scriptText.includes('Like') 
                  ? scriptText.match(/(Subscribe|Like|Follow).*?/i)?.[0] || 'Subscribe for more!'
                  : 'Subscribe for more content!';

      // Create summary for token efficiency
      const summary = `Hook: ${hook}\nKey Moments: ${keyMoments}\nCTA: ${cta}\nScript Length: ${typeof script === 'object' ? script.length || 10 : 10} min`;

      const prompt = `Convert this YouTube script into platform-specific content variants.

SCRIPT SUMMARY:
${summary}

Generate variants for these platforms in this JSON format:
{
  "yt_long": {
    "title": "Full YouTube title (optimized for SEO)",
    "description": "Full description with timestamps and CTA"
  },
  "yt_short": {
    "script": "60-second script version",
    "length": 60,
    "hook": "First 3 seconds hook"
  },
  "tiktok": {
    "script": "TikTok script (chaotic, high energy)",
    "style": "chaotic",
    "length": 30,
    "hashtags": ["#automation", "#productivity"]
  },
  "reel": {
    "script": "Instagram Reel script (aesthetic, visual)",
    "style": "aesthetic",
    "length": 30,
    "hashtags": ["#automation", "#tips"]
  },
  "linkedin": {
    "post": "Professional LinkedIn post (text format)",
    "hashtags": ["#automation", "#productivity"]
  }
}

Return ONLY valid JSON, no extra text.`;

      const scriptHash = modelRouter._hashString(scriptText);
      const response = await modelRouter.chat({
        task: 'atomizer_variants',
        messages: [{ role: 'user', content: prompt }],
        scriptHash,
        useCache: true
      });

      // Parse JSON
      let parsed;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        setError('Failed to parse variants. Response: ' + response.substring(0, 200));
        return;
      }

      setVariants(parsed);
      
      // Update parent if callback provided
      if (onVariantsGenerated) {
        onVariantsGenerated(parsed);
      }

    } catch (err) {
      console.error('Atomizer error:', err);
      setError(err.message || 'Failed to generate variants');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy to clipboard
   */
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  /**
   * Export all variants as JSON
   */
  const exportVariants = () => {
    if (!variants) return;

    const blob = new Blob([JSON.stringify(variants, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_variants_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Export all variants as text bundle
   */
  const exportTextBundle = () => {
    if (!variants) return;

    let text = 'PLATFORM VARIANTS EXPORT\n';
    text += '='.repeat(50) + '\n\n';

    if (variants.yt_long) {
      text += 'YOUTUBE (LONG FORM)\n';
      text += '-'.repeat(50) + '\n';
      text += `Title: ${variants.yt_long.title || 'N/A'}\n\n`;
      text += `Description:\n${variants.yt_long.description || 'N/A'}\n\n`;
    }

    if (variants.yt_short) {
      text += 'YOUTUBE SHORTS\n';
      text += '-'.repeat(50) + '\n';
      text += `Script:\n${variants.yt_short.script || 'N/A'}\n\n`;
    }

    if (variants.tiktok) {
      text += 'TIKTOK\n';
      text += '-'.repeat(50) + '\n';
      text += `Script:\n${variants.tiktok.script || 'N/A'}\n`;
      text += `Hashtags: ${variants.tiktok.hashtags?.join(' ') || 'N/A'}\n\n`;
    }

    if (variants.reel) {
      text += 'INSTAGRAM REEL\n';
      text += '-'.repeat(50) + '\n';
      text += `Script:\n${variants.reel.script || 'N/A'}\n`;
      text += `Hashtags: ${variants.reel.hashtags?.join(' ') || 'N/A'}\n\n`;
    }

    if (variants.linkedin) {
      text += 'LINKEDIN POST\n';
      text += '-'.repeat(50) + '\n';
      text += `${variants.linkedin.post || 'N/A'}\n`;
      text += `Hashtags: ${variants.linkedin.hashtags?.join(' ') || 'N/A'}\n\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform_variants_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const platformConfigs = [
    {
      key: 'yt_long',
      name: 'YouTube (Long Form)',
      icon: Youtube,
      color: 'red'
    },
    {
      key: 'yt_short',
      name: 'YouTube Shorts',
      icon: Youtube,
      color: 'red'
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: Instagram,
      color: 'pink'
    },
    {
      key: 'reel',
      name: 'Instagram Reel',
      icon: Instagram,
      color: 'purple'
    },
    {
      key: 'linkedin',
      name: 'LinkedIn Post',
      icon: Linkedin,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2">
          <Sparkles size={24} />
          Multi-Platform Atomizer
        </h3>
        {variants && (
          <div className="flex gap-2">
            <button
              onClick={exportVariants}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              onClick={exportTextBundle}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2"
            >
              <Download size={16} />
              Export Text
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!variants && !isGenerating && (
        <div className="bg-cyan-950/30 rounded-xl p-6 border border-cyan-500 text-center">
          <p className="text-cyan-300 mb-4">Convert your script into platform-specific variants</p>
          <button
            onClick={generateVariants}
            disabled={!script}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
          >
            <Sparkles size={20} />
            Generate Variants
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-16">
          <RefreshCw size={48} className="animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-cyan-300">Generating platform variants...</p>
        </div>
      )}

      {variants && (
        <div className="space-y-4">
          {platformConfigs.map((config, idx) => {
            const variant = variants[config.key];
            if (!variant) return null;

            const Icon = config.icon;
            const content = variant.script || variant.post || variant.title || variant.description || 'N/A';
            const fullContent = typeof variant === 'object' 
              ? JSON.stringify(variant, null, 2)
              : content;

            return (
              <div
                key={config.key}
                className="bg-cyan-950/30 rounded-xl p-4 border border-cyan-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-cyan-200 flex items-center gap-2">
                    <Icon size={20} />
                    {config.name}
                  </h4>
                  <button
                    onClick={() => copyToClipboard(fullContent, idx)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {variant.title && (
                  <div className="mb-2">
                    <div className="text-xs text-cyan-400 mb-1">Title:</div>
                    <div className="text-cyan-200 text-sm font-semibold">{variant.title}</div>
                  </div>
                )}

                {variant.description && (
                  <div className="mb-2">
                    <div className="text-xs text-cyan-400 mb-1">Description:</div>
                    <div className="text-cyan-200 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {variant.description}
                    </div>
                  </div>
                )}

                {(variant.script || variant.post) && (
                  <div className="mb-2">
                    <div className="text-xs text-cyan-400 mb-1">Content:</div>
                    <div className="text-cyan-200 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {variant.script || variant.post}
                    </div>
                  </div>
                )}

                {variant.hashtags && variant.hashtags.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-cyan-400 mb-1">Hashtags:</div>
                    <div className="text-cyan-300 text-sm">
                      {variant.hashtags.join(' ')}
                    </div>
                  </div>
                )}

                {variant.length && (
                  <div className="mt-2 text-xs text-cyan-400">
                    Length: {variant.length} seconds
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

