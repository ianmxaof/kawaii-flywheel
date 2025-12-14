import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useGallery } from '../../hooks/useGallery';
import ImageUploader from './ImageUploader';
import GalleryControls from './GalleryControls';

export default function ImageGallery() {
  const {
    images,
    selectedIds,
    loading,
    addImages,
    removeImage,
    removeSelected,
    clearAll,
    downloadSelectedAsZip,
    toggleSelection,
    selectAll,
    deselectAll,
    getImageURL,
  } = useGallery();

  const [imageURLs, setImageURLs] = useState(new Map());

  useEffect(() => {
    // Create object URLs for all images
    const urls = new Map();
    images.forEach(img => {
      if (!imageURLs.has(img.id)) {
        urls.set(img.id, getImageURL(img));
      } else {
        urls.set(img.id, imageURLs.get(img.id));
      }
    });
    setImageURLs(urls);

    // Cleanup function
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  async function handleUpload(files) {
    try {
      await addImages(files);
    } catch (error) {
      alert('Failed to upload images: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (confirm('Delete this image?')) {
      try {
        await removeImage(id);
        // Revoke URL
        const url = imageURLs.get(id);
        if (url) {
          URL.revokeObjectURL(url);
          setImageURLs(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }
      } catch (error) {
        alert('Failed to delete image: ' + error.message);
      }
    }
  }

  async function handleClearAll() {
    if (confirm('Clear all images? This cannot be undone.')) {
      try {
        await clearAll();
        // Revoke all URLs
        imageURLs.forEach(url => URL.revokeObjectURL(url));
        setImageURLs(new Map());
      } catch (error) {
        alert('Failed to clear images: ' + error.message);
      }
    }
  }

  const allSelected = images.length > 0 && selectedIds.size === images.length;

  return (
    <div className="space-y-4">
      <ImageUploader onUpload={handleUpload} disabled={loading} />

      {images.length > 0 && (
        <GalleryControls
          selectedCount={selectedIds.size}
          totalCount={images.length}
          onDeleteSelected={removeSelected}
          onDownloadZip={downloadSelectedAsZip}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onClearAll={handleClearAll}
          allSelected={allSelected}
        />
      )}

      {loading && images.length === 0 && (
        <div className="text-center text-pink-300 py-8">
          Loading images...
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className="text-center text-pink-300/50 py-8">
          No images yet. Upload some to get started!
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map(image => {
            const url = imageURLs.get(image.id);
            const isSelected = selectedIds.has(image.id);
            
            return (
              <div
                key={image.id}
                className={`
                  relative group cursor-pointer rounded-lg overflow-hidden
                  border-2 transition-all
                  ${isSelected 
                    ? 'border-pink-500 ring-2 ring-pink-500/50' 
                    : 'border-pink-500/30 hover:border-pink-500/60'
                  }
                `}
                onClick={() => toggleSelection(image.id)}
              >
                {url && (
                  <img
                    src={url}
                    alt={image.name || 'Uploaded image'}
                    className="w-full h-32 object-cover"
                  />
                )}
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                    <Check size={16} className="text-white" />
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image.id);
                  }}
                  className="absolute top-2 left-2 bg-red-500/80 hover:bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>

                {/* Image name */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                  <p className="text-xs text-pink-200 truncate">
                    {image.name || `Image ${image.id}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

