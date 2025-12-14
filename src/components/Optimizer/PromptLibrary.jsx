import { useState, useEffect } from 'react';
import { Save, Copy, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { generatePromptVariations } from '../../utils/claudeAPI';

const STORAGE_KEY = 'contentFactory_prompts';

const PROMPT_CATEGORIES = {
  chibi: 'Chibi Character',
  background: 'Background',
  icon: 'Icon/Logo',
  other: 'Other',
};

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('chibi');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  function loadPrompts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrompts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  }

  function savePrompts(newPrompts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrompts));
      setPrompts(newPrompts);
    } catch (error) {
      console.error('Failed to save prompts:', error);
    }
  }

  function handleSave() {
    if (!newPrompt.trim()) return;

    const prompt = {
      id: Date.now(),
      text: newPrompt.trim(),
      category: newCategory,
      createdAt: new Date().toISOString(),
    };

    savePrompts([...prompts, prompt]);
    setNewPrompt('');
  }

  function handleDelete(id) {
    if (confirm('Delete this prompt?')) {
      savePrompts(prompts.filter(p => p.id !== id));
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
        setVariations([]);
      }
    }
  }

  async function handleGenerateVariations(prompt) {
    setSelectedPrompt(prompt);
    setLoading(true);
    setVariations([]);

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) {
      alert('Claude API key not found. Set VITE_CLAUDE_API_KEY in .env file');
      setLoading(false);
      return;
    }

    try {
      const results = await generatePromptVariations(prompt.text, apiKey, 10);
      setVariations(results);
    } catch (error) {
      alert('Failed to generate variations: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  const promptsByCategory = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Prompt Library
        </h2>
      </div>

      {/* Add New Prompt */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 space-y-3">
        <h3 className="text-pink-300 font-bold">Add New Prompt</h3>
        <textarea
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          placeholder="e.g., heroic kawaii chibi, confident pointing, anime style, transparent background"
          className="w-full h-24 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50 resize-none"
        />
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
          >
            {Object.entries(PROMPT_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!newPrompt.trim()}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save Prompt
          </button>
        </div>
      </div>

      {/* Saved Prompts */}
      <div className="space-y-4">
        {Object.entries(PROMPT_CATEGORIES).map(([categoryKey, categoryLabel]) => {
          const categoryPrompts = promptsByCategory[categoryKey] || [];
          if (categoryPrompts.length === 0) return null;

          return (
            <div key={categoryKey} className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
              <h3 className="text-pink-300 font-bold mb-3">{categoryLabel}</h3>
              <div className="space-y-2">
                {categoryPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className="bg-black/20 border border-pink-500/20 rounded-lg p-3 hover:border-pink-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-pink-200 text-sm flex-1">{prompt.text}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleCopy(prompt.text)}
                          className="p-1.5 hover:bg-pink-500/20 rounded"
                          title="Copy"
                        >
                          <Copy size={14} className="text-pink-300" />
                        </button>
                        <button
                          onClick={() => handleGenerateVariations(prompt)}
                          className="p-1.5 hover:bg-purple-500/20 rounded"
                          title="Generate Variations"
                        >
                          <RefreshCw size={14} className="text-purple-300" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Variations */}
      {selectedPrompt && (
        <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-pink-300 font-bold">
              Variations for: "{selectedPrompt.text}"
            </h3>
            {loading && (
              <div className="text-pink-300 text-sm">Generating...</div>
            )}
          </div>

          {variations.length > 0 && (
            <div className="space-y-2">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className="bg-black/20 border border-purple-500/20 rounded-lg p-3 flex items-start justify-between gap-2"
                >
                  <p className="text-pink-200 text-sm flex-1">{variation}</p>
                  <button
                    onClick={() => handleCopy(variation)}
                    className="p-1.5 hover:bg-purple-500/20 rounded"
                    title="Copy"
                  >
                    <Copy size={14} className="text-purple-300" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {prompts.length === 0 && (
        <div className="text-center text-pink-300/50 py-8">
          <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
          <p>No prompts saved yet. Add your first prompt above!</p>
        </div>
      )}
    </div>
  );
}

