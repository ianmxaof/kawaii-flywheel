import { useState, useEffect } from 'react';
import { Type, Plus } from 'lucide-react';
import { AVAILABLE_FONTS, loadGoogleFonts } from '../../utils/fonts';

export default function TextEditor({ layers, selectedLayer, onAddText, onUpdateText }) {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Impact, sans-serif');
  const [color, setColor] = useState('#ffffff');
  const [strokeEnabled, setStrokeEnabled] = useState(true);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);

  useEffect(() => {
    loadGoogleFonts();
  }, []);

  useEffect(() => {
    if (selectedLayer && selectedLayer.type === 'text') {
      setText(selectedLayer.text || '');
      setFontSize(selectedLayer.fontSize || 48);
      setFontFamily(selectedLayer.fontFamily || 'Impact, sans-serif');
      setColor(selectedLayer.color || '#ffffff');
      setStrokeEnabled(selectedLayer.stroke !== false);
      setStrokeColor(selectedLayer.strokeColor || '#000000');
      setStrokeWidth(selectedLayer.strokeWidth || 2);
    } else {
      // Reset to defaults for new text
      setText('');
      setFontSize(48);
      setFontFamily('Impact, sans-serif');
      setColor('#ffffff');
      setStrokeEnabled(true);
      setStrokeColor('#000000');
      setStrokeWidth(2);
    }
  }, [selectedLayer]);

  function handleAddText() {
    if (!text.trim()) return;
    
    onAddText({
      type: 'text',
      text: text.trim(),
      fontSize,
      fontFamily,
      color,
      stroke: strokeEnabled,
      strokeColor: strokeEnabled ? strokeColor : null,
      strokeWidth: strokeEnabled ? strokeWidth : 0,
      x: 50,
      y: 50,
    });
    
    setText('');
  }

  function handleUpdateText() {
    if (!selectedLayer || selectedLayer.type !== 'text') return;
    
    onUpdateText(selectedLayer.id, {
      text: text.trim(),
      fontSize,
      fontFamily,
      color,
      stroke: strokeEnabled,
      strokeColor: strokeEnabled ? strokeColor : null,
      strokeWidth: strokeEnabled ? strokeWidth : 0,
    });
  }

  const isEditing = selectedLayer && selectedLayer.type === 'text';

  return (
    <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 space-y-4" style={{ position: 'absolute', top: '1120px' }}>
      <div className="flex items-center gap-2 mb-4">
        <Type className="text-pink-400" size={20} />
        <h3 className="text-pink-300 font-bold">
          {isEditing ? 'Edit Text' : 'Add Text'}
        </h3>
      </div>

      <div>
        <label className="block text-pink-300 mb-2 text-sm font-bold">Text Content</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isEditing) {
              handleAddText();
            }
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-pink-300 mb-2 text-sm font-bold">Font Size</label>
          <input
            type="range"
            min="24"
            max="200"
            value={fontSize}
            onChange={(e) => {
              setFontSize(parseInt(e.target.value));
              if (isEditing) {
                onUpdateText(selectedLayer.id, { fontSize: parseInt(e.target.value) });
              }
            }}
            className="w-full"
          />
          <div className="text-pink-300 text-sm mt-1">{fontSize}px</div>
        </div>

        <div>
          <label className="block text-pink-300 mb-2 text-sm font-bold">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              if (isEditing) {
                onUpdateText(selectedLayer.id, { fontFamily: e.target.value });
              }
            }}
            className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
          >
            {AVAILABLE_FONTS.map(font => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-pink-300 mb-2 text-sm font-bold">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (isEditing) {
                  onUpdateText(selectedLayer.id, { color: e.target.value });
                }
              }}
              className="w-12 h-10 rounded border border-pink-500"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (isEditing) {
                  onUpdateText(selectedLayer.id, { color: e.target.value });
                }
              }}
              className="flex-1 bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-pink-300 mb-2 text-sm font-bold">Stroke</label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={strokeEnabled}
              onChange={(e) => {
                setStrokeEnabled(e.target.checked);
                if (isEditing) {
                  onUpdateText(selectedLayer.id, {
                    stroke: e.target.checked,
                    strokeColor: e.target.checked ? strokeColor : null,
                  });
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-pink-300 text-sm">Enable Stroke</span>
          </label>
        </div>
      </div>

      {strokeEnabled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-pink-300 mb-2 text-sm font-bold">Stroke Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  if (isEditing) {
                    onUpdateText(selectedLayer.id, { strokeColor: e.target.value });
                  }
                }}
                className="w-12 h-10 rounded border border-pink-500"
              />
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  if (isEditing) {
                    onUpdateText(selectedLayer.id, { strokeColor: e.target.value });
                  }
                }}
                className="flex-1 bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-pink-300 mb-2 text-sm font-bold">Stroke Width</label>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => {
                setStrokeWidth(parseInt(e.target.value));
                if (isEditing) {
                  onUpdateText(selectedLayer.id, { strokeWidth: parseInt(e.target.value) });
                }
              }}
              className="w-full"
            />
            <div className="text-pink-300 text-sm mt-1">{strokeWidth}px</div>
          </div>
        </div>
      )}

      <div className="pt-2">
        {isEditing ? (
          <button
            onClick={handleUpdateText}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all"
          >
            Update Text
          </button>
        ) : (
          <button
            onClick={handleAddText}
            disabled={!text.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Text to Canvas
          </button>
        )}
      </div>

      {isEditing && (
        <div className="pt-2 border-t border-pink-500/30">
          <p className="text-pink-300/70 text-xs">
            💡 Tip: Drag the text on canvas to reposition it
          </p>
        </div>
      )}
    </div>
  );
}

