import { useState, useRef } from 'react';
import { Download, Save, FolderOpen, Zap, Moon, Flame } from 'lucide-react';
import { exportCanvasAsPNG, downloadBlob } from '../../utils/imageProcessing';

const PRESETS = {
  high_energy: {
    name: 'High Energy',
    icon: Zap,
    description: 'Bright colors, high contrast, bold text',
    settings: {
      contrast: 1.3,
      saturation: 1.2,
      brightness: 1.1,
    },
  },
  mysterious: {
    name: 'Mysterious',
    icon: Moon,
    description: 'Dark tones, subtle lighting, enigmatic',
    settings: {
      contrast: 1.1,
      saturation: 0.8,
      brightness: 0.7,
    },
  },
  edgy: {
    name: 'Edgy',
    icon: Flame,
    description: 'Bold reds/blacks, aggressive styling',
    settings: {
      contrast: 1.4,
      saturation: 1.3,
      brightness: 0.9,
    },
  },
};

export default function ExportPanel({ canvasRef, layers, onSaveLayout, onLoadLayout }) {
  const [exporting, setExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const fileInputRef = useRef(null);

  async function handleExportPNG() {
    if (!canvasRef.current) return;
    
    setExporting(true);
    try {
      const blob = await exportCanvasAsPNG(canvasRef.current, {
        width: 1280,
        height: 720,
        backgroundColor: '#000000',
        quality: 1,
      });
      
      downloadBlob(blob, `thumbnail_${Date.now()}.png`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export thumbnail. Make sure the canvas has content.');
    } finally {
      setExporting(false);
    }
  }

  function handleSaveLayout() {
    const layout = {
      layers,
      preset: selectedPreset,
      savedAt: new Date().toISOString(),
    };
    
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `thumbnail_layout_${Date.now()}.json`);
    
    if (onSaveLayout) {
      onSaveLayout(layout);
    }
  }

  function handleLoadLayout() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const layout = JSON.parse(event.target.result);
        if (onLoadLayout) {
          onLoadLayout(layout);
        }
        setSelectedPreset(layout.preset);
      } catch (error) {
        alert('Failed to load layout. Invalid file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 space-y-4">
      <h3 className="text-pink-300 font-bold mb-4 flex items-center gap-2">
        <Download size={20} className="text-pink-400" />
        Export & Presets
      </h3>

      {/* Presets */}
      <div>
        <label className="block text-pink-300 mb-2 text-sm font-bold">Style Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const Icon = preset.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedPreset(key)}
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${selectedPreset === key
                    ? 'border-pink-500 bg-pink-500/20'
                    : 'border-pink-500/30 hover:border-pink-500/60 bg-black/20'
                  }
                `}
              >
                <Icon size={24} className={`mx-auto mb-2 ${selectedPreset === key ? 'text-pink-400' : 'text-pink-500/70'}`} />
                <div className="text-pink-300 text-xs font-bold">{preset.name}</div>
                <div className="text-pink-400/70 text-xs mt-1">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="space-y-2">
        <button
          onClick={handleExportPNG}
          disabled={exporting || layers.length === 0}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Download size={18} />
          {exporting ? 'Exporting...' : 'Export as PNG (1280×720)'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveLayout}
            disabled={layers.length === 0}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} />
            Save Layout
          </button>

          <button
            onClick={handleLoadLayout}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <FolderOpen size={16} />
            Load Layout
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {layers.length === 0 && (
        <p className="text-pink-300/50 text-xs text-center">
          Add images or text to canvas before exporting
        </p>
      )}
    </div>
  );
}

