import { useState } from 'react';
import { Upload, Sparkles, Loader } from 'lucide-react';
import { analyzeThumbnail } from '../../utils/claudeAPI';

export default function ThumbnailAnalyzer() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setAnalysis(null);
      setError(null);
    }
  }

  async function handleAnalyze() {
    if (!image) return;

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      setError('Claude API key not found. Set VITE_CLAUDE_API_KEY in .env file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeThumbnail(image, apiKey);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Thumbnail Analyzer
        </h2>
      </div>

      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
        <p className="text-pink-200 text-sm">
          💡 Upload a competitor's thumbnail to learn what makes it clickable. AI will analyze colors, composition, text placement, and suggest improvements.
        </p>
      </div>

      {/* Image Upload */}
      <div className="bg-black/40 border-2 border-dashed border-pink-500/50 rounded-lg p-8 text-center">
        {imagePreview ? (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-64 mx-auto rounded-lg"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                  setAnalysis(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Remove
              </button>
              <label className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all cursor-pointer">
                <Upload size={16} className="inline mr-2" />
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer">
            <Upload size={48} className="mx-auto mb-4 text-pink-500/70" />
            <p className="text-pink-300 font-bold mb-2">Click to upload thumbnail</p>
            <p className="text-pink-400/70 text-sm">or drag and drop</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Analyze Button */}
      {image && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={18} />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Analyze Thumbnail
            </>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-black/60 border border-pink-500/50 rounded-lg p-6">
          <h3 className="text-pink-300 font-bold text-lg mb-4">Analysis Results</h3>
          <div className="prose prose-invert max-w-none">
            <div className="text-pink-200 whitespace-pre-wrap text-sm leading-relaxed">
              {analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

