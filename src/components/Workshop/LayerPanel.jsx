import { ArrowUp, ArrowDown, Trash2, Type, Image as ImageIcon } from 'lucide-react';

export default function LayerPanel({ layers, selectedLayerId, onSelectLayer, onBringForward, onSendBackward, onDeleteLayer }) {
  return (
    <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 h-full overflow-y-auto" style={{ height: '114px' }}>
      <h3 className="text-pink-300 font-bold mb-4">Layers</h3>
      
      {layers.length === 0 ? (
        <p className="text-pink-300/50 text-sm">No layers yet. Add images or text to get started.</p>
      ) : (
        <div className="space-y-2">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${selectedLayerId === layer.id 
                  ? 'bg-pink-500/30 border-2 border-pink-500' 
                  : 'bg-black/20 border border-pink-500/20 hover:bg-pink-500/10'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {layer.type === 'image' ? (
                    <ImageIcon size={16} className="text-pink-400" />
                  ) : (
                    <Type size={16} className="text-purple-400" />
                  )}
                  <span className="text-pink-200 text-sm font-bold">
                    {layer.type === 'image' ? (layer.name || 'Image') : (layer.text || 'Text')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBringForward(layer.id);
                    }}
                    className="p-1 hover:bg-pink-500/20 rounded"
                    title="Bring Forward"
                  >
                    <ArrowUp size={14} className="text-pink-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendBackward(layer.id);
                    }}
                    className="p-1 hover:bg-pink-500/20 rounded"
                    title="Send Backward"
                  >
                    <ArrowDown size={14} className="text-pink-300" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-300" />
                  </button>
                </div>
              </div>
              
              {layer.type === 'text' && (
                <p className="text-pink-300/70 text-xs truncate">
                  "{layer.text}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

