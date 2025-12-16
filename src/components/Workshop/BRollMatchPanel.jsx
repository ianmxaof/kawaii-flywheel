import React, { useState, useEffect } from 'react';
import { Film, Search, CheckCircle, XCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useAssetLibrary } from '../../hooks/useAssetLibrary';
import { modelRouter } from '../../utils/modelRouter';

/**
 * B-Roll Match Panel - Suggests B-roll and asset matches for script segments
 */
export default function BRollMatchPanel({ semanticAnalysis, onAssetSelected }) {
  const [brollMap, setBrollMap] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState(null);
  const { assets, loadAssets } = useAssetLibrary();

  useEffect(() => {
    loadAssets();
  }, []);

  /**
   * Generate B-roll matches from semantic analysis
   */
  const generateMatches = async () => {
    if (!semanticAnalysis || !semanticAnalysis.visual_suggestions) {
      setError('No visual suggestions available. Run semantic analysis first.');
      return;
    }

    setIsMatching(true);
    setError(null);

    try {
      const visualSuggestions = semanticAnalysis.visual_suggestions || [];
      const matches = [];

      for (const suggestion of visualSuggestions) {
        // First pass: heuristic keyword matching
        const keywordMatches = findKeywordMatches(suggestion.suggestion, assets);

        // If multiple matches or ambiguous, use LLM for ranking
        let finalMatches = keywordMatches;
        if (keywordMatches.length > 3 || keywordMatches.length === 0) {
          try {
            finalMatches = await rankMatchesWithLLM(suggestion.suggestion, keywordMatches.length > 0 ? keywordMatches : assets);
          } catch (llmError) {
            console.warn('LLM ranking failed, using heuristic matches:', llmError);
            finalMatches = keywordMatches;
          }
        }

        matches.push({
          timestamp: suggestion.timestamp,
          suggestion: suggestion.suggestion,
          duration: suggestion.duration || 30,
          matchedAssetIds: finalMatches.slice(0, 3).map(a => a.id),
          matchedAssets: finalMatches.slice(0, 3)
        });
      }

      setBrollMap(matches);
    } catch (err) {
      console.error('B-roll matching error:', err);
      setError(err.message || 'Failed to generate matches');
    } finally {
      setIsMatching(false);
    }
  };

  /**
   * Heuristic keyword matching between suggestion and asset tags
   */
  const findKeywordMatches = (suggestionText, assetList) => {
    const suggestionLower = suggestionText.toLowerCase();
    const keywords = extractKeywords(suggestionText);

    return assetList
      .map(asset => {
        let score = 0;
        const assetTags = (asset.tags || []).join(' ').toLowerCase();
        const assetName = (asset.name || '').toLowerCase();
        const assetCategory = (asset.category || '').toLowerCase();
        const searchText = `${assetTags} ${assetName} ${assetCategory}`;

        // Exact keyword matches
        keywords.forEach(keyword => {
          if (searchText.includes(keyword)) {
            score += 2;
          }
        });

        // Partial matches
        keywords.forEach(keyword => {
          if (searchText.includes(keyword.substring(0, 4))) {
            score += 1;
          }
        });

        // Favorite assets get bonus
        if (asset.favorite) {
          score += 1;
        }

        return { ...asset, matchScore: score };
      })
      .filter(asset => asset.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  /**
   * Extract keywords from suggestion text
   */
  const extractKeywords = (text) => {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  };

  /**
   * Use LLM to rank matches (optional, for ambiguous cases)
   */
  const rankMatchesWithLLM = async (suggestionText, candidateAssets) => {
    if (candidateAssets.length === 0) return [];

    // Prepare asset tag list
    const assetTags = candidateAssets.map((asset, idx) => {
      const tags = (asset.tags || []).join(', ');
      const name = asset.name || 'unnamed';
      const category = asset.category || 'uncategorized';
      return `${idx}: ${name} (${category}) - Tags: ${tags || 'none'}`;
    }).join('\n');

    const prompt = `Rank these assets by relevance to this visual suggestion:

SUGGESTION: "${suggestionText}"

ASSETS:
${assetTags}

Return ONLY a comma-separated list of indices (0-based) in order of relevance, most relevant first.
Example: 2, 0, 5, 1`;

    try {
      const response = await modelRouter.chat({
        task: 'broll_match',
        messages: [{ role: 'user', content: prompt }],
        useCache: false
      });

      // Parse indices
      const indices = response
        .match(/\d+/g)
        ?.map(i => parseInt(i))
        .filter(i => i >= 0 && i < candidateAssets.length) || [];

      // Return assets in ranked order
      const ranked = indices.map(i => candidateAssets[i]).filter(Boolean);
      const remaining = candidateAssets.filter((_, i) => !indices.includes(i));
      return [...ranked, ...remaining];
    } catch (err) {
      console.warn('LLM ranking failed:', err);
      return candidateAssets; // Return original order
    }
  };

  // Auto-generate on mount if semantic analysis available
  useEffect(() => {
    if (semanticAnalysis && semanticAnalysis.visual_suggestions && brollMap.length === 0 && !isMatching) {
      generateMatches();
    }
  }, [semanticAnalysis]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
          <Film size={20} />
          B-Roll Matchmaker
        </h3>
        <button
          onClick={generateMatches}
          disabled={isMatching || !semanticAnalysis}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-bold px-3 py-1 rounded-lg text-sm flex items-center gap-2"
        >
          {isMatching ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Matching...
            </>
          ) : (
            <>
              <Search size={14} />
              Match
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {brollMap.length === 0 && !isMatching && !error && (
        <div className="text-center py-8 text-indigo-400 text-sm">
          <Film size={32} className="mx-auto mb-2 opacity-50" />
          <p>No matches yet. Click "Match" to generate suggestions.</p>
        </div>
      )}

      {isMatching && (
        <div className="text-center py-8">
          <RefreshCw size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-indigo-300 text-sm">Matching assets...</p>
        </div>
      )}

      {brollMap.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {brollMap.map((match, idx) => (
            <div
              key={idx}
              className="bg-indigo-950/30 rounded-lg p-3 border border-indigo-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-indigo-200 text-sm">
                    {match.timestamp}
                  </div>
                  <div className="text-indigo-300 text-xs mt-1">
                    {match.suggestion}
                  </div>
                </div>
                <span className="text-indigo-400 text-xs">
                  {match.duration}s
                </span>
              </div>

              {match.matchedAssets && match.matchedAssets.length > 0 ? (
                <div className="space-y-2 mt-3">
                  <div className="text-xs text-indigo-400">Suggested Assets:</div>
                  {match.matchedAssets.map((asset, assetIdx) => (
                    <button
                      key={assetIdx}
                      onClick={() => {
                        if (onAssetSelected) {
                          onAssetSelected(asset, match.timestamp);
                        }
                      }}
                      className="w-full text-left bg-indigo-900/20 hover:bg-indigo-900/40 rounded p-2 flex items-center gap-2 transition-all"
                    >
                      <ImageIcon size={14} className="text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-indigo-200 text-xs font-semibold truncate">
                          {asset.name || 'Unnamed Asset'}
                        </div>
                        {asset.tags && asset.tags.length > 0 && (
                          <div className="text-indigo-400 text-xs truncate">
                            {asset.tags.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                      {asset.favorite && (
                        <CheckCircle size={12} className="text-yellow-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-indigo-400 text-xs mt-2 flex items-center gap-2">
                  <XCircle size={12} />
                  No matching assets found
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

