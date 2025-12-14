import { useState } from 'react';
import { Sparkles, Copy, Star, Loader } from 'lucide-react';
import { generateTitleVariations } from '../../utils/claudeAPI';

const STORAGE_KEY = 'contentFactory_favoriteTitles';

export default function TitleGenerator() {
  const [topic, setTopic] = useState('');
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  function saveFavorites(newFavorites) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  function toggleFavorite(title) {
    const isFavorite = favorites.includes(title);
    if (isFavorite) {
      saveFavorites(favorites.filter(t => t !== title));
    } else {
      saveFavorites([...favorites, title]);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) return;

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      alert('Claude API key not found. Set VITE_CLAUDE_API_KEY in .env file');
      return;
    }

    setLoading(true);
    try {
      const results = await generateTitleVariations(topic, apiKey, 20);
      setTitles(results);
    } catch (error) {
      alert('Failed to generate titles: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Viral Title Generator
        </h2>
      </div>

      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
        <p className="text-pink-200 text-sm">
          💡 Enter a topic and get 20 viral title variations using proven formulas. Save your favorites for A/B testing!
        </p>
      </div>

      {/* Input */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 space-y-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., automating my job with Cursor IDE"
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleGenerate();
            }
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={18} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate 20 Title Variations
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {titles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-pink-300 font-bold">Generated Titles ({titles.length})</h3>
            <button
              onClick={() => {
                const allTitles = titles.join('\n');
                handleCopy(allTitles);
              }}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              <Copy size={14} />
              Copy All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {titles.map((title, index) => {
              const isFavorite = favorites.includes(title);
              return (
                <div
                  key={index}
                  className="bg-black/40 border border-pink-500/30 rounded-lg p-3 hover:border-pink-500/60 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-pink-200 text-sm flex-1">{title}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleFavorite(title)}
                        className={`p-1.5 rounded transition-all ${
                          isFavorite
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'hover:bg-pink-500/20 text-pink-300/70'
                        }`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleCopy(title)}
                        className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                        title="Copy"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-300 font-bold mb-3 flex items-center gap-2">
            <Star size={18} fill="currentColor" />
            Favorites ({favorites.length})
          </h3>
          <div className="space-y-2">
            {favorites.map((title, index) => (
              <div
                key={index}
                className="bg-black/20 border border-yellow-500/20 rounded-lg p-3 flex items-start justify-between gap-2"
              >
                <p className="text-yellow-200 text-sm flex-1">{title}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFavorite(title)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-300"
                    title="Remove"
                  >
                    <Star size={14} fill="currentColor" />
                  </button>
                  <button
                    onClick={() => handleCopy(title)}
                    className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                    title="Copy"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

