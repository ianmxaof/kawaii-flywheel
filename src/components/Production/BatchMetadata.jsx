import { useState } from 'react';
import { Download, Loader, Plus, X } from 'lucide-react';
import { batchGenerateMetadata } from '../../utils/claudeAPI';

export default function BatchMetadata() {
  const [titles, setTitles] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  function handleTitleChange(index, value) {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  }

  function handleAddTitle() {
    setTitles([...titles, '']);
  }

  function handleRemoveTitle(index) {
    if (titles.length > 1) {
      setTitles(titles.filter((_, i) => i !== index));
    }
  }

  async function handleGenerate() {
    const validTitles = titles.filter(t => t.trim().length > 0);
    if (validTitles.length === 0) {
      alert('Enter at least one title');
      return;
    }

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      alert('Claude API key not found. Set VITE_CLAUDE_API_KEY in .env file');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const data = await batchGenerateMetadata(validTitles, apiKey);
      setResults(data);
    } catch (error) {
      alert('Failed to generate metadata: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (results.length === 0) return;

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_metadata_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Batch Metadata Generator
        </h2>
      </div>

      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
        <p className="text-pink-200 text-sm">
          💡 Enter up to 10 video titles and generate all metadata (title, description, tags) in parallel. Perfect for batch content creation!
        </p>
      </div>

      {/* Title Inputs */}
      <div className="space-y-2">
        {titles.map((title, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(index, e.target.value)}
              placeholder={`Title ${index + 1}...`}
              className="flex-1 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
            />
            {titles.length > 1 && (
              <button
                onClick={() => handleRemoveTitle(index)}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAddTitle}
          disabled={titles.length >= 10}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={16} />
          Add Title
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading || titles.filter(t => t.trim()).length === 0}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={18} />
              Generating Metadata...
            </>
          ) : (
            <>
              Generate Metadata for {titles.filter(t => t.trim()).length} Videos
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-pink-300 font-bold text-lg">
              Generated Metadata ({results.length} videos)
            </h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Export JSON
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
                <h4 className="text-pink-300 font-bold mb-3">Video {index + 1}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-pink-300/70">Title:</span>
                    <p className="text-pink-200">{result.title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-pink-300/70">Description:</span>
                    <p className="text-pink-200 whitespace-pre-wrap">{result.description || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-pink-300/70">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(result.tags || []).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-pink-300 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

