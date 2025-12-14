import React, { useState, useEffect } from 'react';
import { Image, Grid, Folder, Type, Search } from 'lucide-react';
import { useAssetLibrary } from '../../hooks/useAssetLibrary';

const AssetLibraryPanel = ({ onAssetSelect, selectedCategory = null }) => {
  const { getAssets } = useAssetLibrary();
  const [assets, setAssets] = useState([]);
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'characters');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'characters', name: 'Characters', icon: Image, color: 'purple' },
    { id: 'logos', name: 'Logos', icon: Grid, color: 'blue' },
    { id: 'backgrounds', name: 'Backgrounds', icon: Folder, color: 'green' },
  ];

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const categoryAssets = await getAssets(activeCategory);
        setAssets(categoryAssets);
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };

    loadAssets();
  }, [activeCategory, getAssets]);

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(searchLower) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleAssetClick = (asset) => {
    if (onAssetSelect) {
      onAssetSelect({
        type: 'image',
        src: asset.dataUrl,
        name: asset.name,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      });
    }
  };

  return (
    <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 h-full overflow-y-auto">
      <h3 className="text-pink-300 font-bold mb-4 flex items-center gap-2">
        <Image size={18} />
        Asset Library
      </h3>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? `bg-${cat.color}-600 text-white`
                : `bg-${cat.color}-900/30 text-${cat.color}-300 hover:bg-${cat.color}-800/40`
            }`}
          >
            <cat.icon size={14} className="inline mr-1" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-pink-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assets..."
          className="w-full pl-8 pr-3 py-2 bg-black/50 border border-pink-500 rounded-lg text-white text-sm placeholder-pink-300/50"
        />
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredAssets.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-pink-300/50 text-sm">
            No assets in {categories.find(c => c.id === activeCategory)?.name}
          </div>
        ) : (
          filteredAssets.map(asset => (
            <div
              key={asset.id}
              onClick={() => handleAssetClick(asset)}
              className="cursor-pointer bg-black/20 rounded-lg p-2 hover:bg-pink-500/10 border border-pink-500/20 transition-all"
            >
              <img
                src={asset.dataUrl}
                alt={asset.name}
                className="w-full h-20 object-cover rounded mb-1"
              />
              <p className="text-xs text-pink-300 truncate">
                {asset.name}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-pink-500/30">
        <p className="text-pink-300/70 text-xs text-center">
          Click asset to add to canvas
        </p>
      </div>
    </div>
  );
};

export default AssetLibraryPanel;