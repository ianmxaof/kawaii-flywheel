import { useState } from 'react';
import { Sparkles, Download, Copy, Loader } from 'lucide-react';
import { atomizeContent } from '../../utils/claudeAPI';

export default function ContentAtomizer() {
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAtomize() {
    if (!topic.trim() || !script.trim()) {
      alert('Please enter both topic and script');
      return;
    }

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      alert('Claude API key not found. Set VITE_CLAUDE_API_KEY in .env file');
      return;
    }

    setLoading(true);
    try {
      const data = await atomizeContent(script, topic, apiKey);
      setResults(data);
    } catch (error) {
      alert('Failed to atomize content: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  function handleExport() {
    if (!results) return;

    const content = JSON.stringify(results, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content_atomized_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Content Atomizer
        </h2>
      </div>

      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
        <p className="text-pink-200 text-sm">
          💡 Convert one YouTube script into multiple content formats: YouTube Short, Twitter thread, LinkedIn post, Instagram caption, and blog outline.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-pink-300 mb-2 font-bold">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Automating workflows with Cursor IDE"
            className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
          />
        </div>

        <div>
          <label className="block text-pink-300 mb-2 font-bold">Script</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your YouTube script here..."
            className="w-full h-48 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50 resize-none"
          />
        </div>

        <button
          onClick={handleAtomize}
          disabled={loading || !topic.trim() || !script.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={18} />
              Atomizing Content...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate All Formats
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-pink-300 font-bold text-lg">Generated Content</h3>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center gap-2"
            >
              <Download size={16} />
              Export JSON
            </button>
          </div>

          {results.shortScript && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-pink-300 font-bold">YouTube Short Script (30s)</h4>
                <button
                  onClick={() => handleCopy(results.shortScript)}
                  className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.shortScript}</p>
            </div>
          )}

          {results.twitterThread && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-pink-300 font-bold">Twitter Thread</h4>
                <button
                  onClick={() => handleCopy(results.twitterThread)}
                  className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.twitterThread}</p>
            </div>
          )}

          {results.linkedInPost && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-pink-300 font-bold">LinkedIn Post</h4>
                <button
                  onClick={() => handleCopy(results.linkedInPost)}
                  className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.linkedInPost}</p>
            </div>
          )}

          {results.instagramCaption && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-pink-300 font-bold">Instagram Caption</h4>
                <button
                  onClick={() => handleCopy(results.instagramCaption)}
                  className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.instagramCaption}</p>
            </div>
          )}

          {results.blogOutline && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-pink-300 font-bold">Blog Post Outline</h4>
                <button
                  onClick={() => handleCopy(results.blogOutline)}
                  className="p-1.5 hover:bg-purple-500/20 rounded text-purple-300"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.blogOutline}</p>
            </div>
          )}

          {results.raw && (
            <div className="bg-black/60 border border-pink-500/50 rounded-lg p-4">
              <h4 className="text-pink-300 font-bold mb-2">Raw Response</h4>
              <p className="text-pink-200 text-sm whitespace-pre-wrap">{results.raw}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

