import { Trash2, Download, X, CheckSquare, Square } from 'lucide-react';

export default function GalleryControls({
  selectedCount,
  totalCount,
  onDeleteSelected,
  onDownloadZip,
  onSelectAll,
  onDeselectAll,
  onClearAll,
  allSelected = false,
}) {
  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-black/40 rounded-lg border border-pink-500/30">
      <div className="flex items-center gap-4">
        <span className="text-pink-300 font-bold">
          {selectedCount > 0 ? `${selectedCount} selected` : `${totalCount} images`}
        </span>
        
        {selectedCount > 0 && (
          <>
            <button
              onClick={onDeleteSelected}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg flex items-center gap-2 transition-all"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
            
            <button
              onClick={onDownloadZip}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg flex items-center gap-2 transition-all"
            >
              <Download size={16} />
              Download ZIP
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {allSelected ? (
          <button
            onClick={onDeselectAll}
            className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg flex items-center gap-2 transition-all"
          >
            <Square size={16} />
            Deselect All
          </button>
        ) : (
          <button
            onClick={onSelectAll}
            className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg flex items-center gap-2 transition-all"
          >
            <CheckSquare size={16} />
            Select All
          </button>
        )}
        
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg flex items-center gap-2 transition-all"
        >
          <X size={16} />
          Clear All
        </button>
      </div>
    </div>
  );
}

