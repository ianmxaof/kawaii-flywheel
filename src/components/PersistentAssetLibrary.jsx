import React, { useState, useMemo } from 'react';
import { Upload, Folder, Image, Type, Trash2, Download, Search, Grid, List, Star, Tag } from 'lucide-react';
import { useAssetLibrary } from '../hooks/useAssetLibrary';

const PersistentAssetLibrary = () => {
  const { assets, addAsset, deleteAsset, toggleFavorite, addTag, saveTextStyle } = useAssetLibrary();
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('characters');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (asset.category !== activeCategory) return false;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(searchLower) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }, [assets, activeCategory, searchQuery]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          await addAsset(activeCategory, file);
        } catch (error) {
          console.error('Failed to upload asset:', error);
        }
      }
    }
  };

  const downloadAsset = (asset) => {
    const link = document.createElement('a');
    link.href = asset.dataUrl;
    link.download = asset.name;
    link.click();
  };

  const categories = [
    { id: 'characters', name: 'Characters', icon: Image, color: 'purple' },
    { id: 'logos', name: 'Tool Logos', icon: Grid, color: 'blue' },
    { id: 'backgrounds', name: 'Backgrounds', icon: Folder, color: 'green' },
    { id: 'textStyles', name: 'Text Styles', icon: Type, color: 'pink' }
  ];

  const activeCategoryInfo = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                📦 Asset Library
              </h1>
              <p className="text-purple-300">
                Your persistent collection of characters, logos, and backgrounds
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold"
              >
                {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar: Categories */}
          <div className="col-span-3 space-y-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${
                  activeCategory === cat.id
                    ? `bg-${cat.color}-600 border-2 border-${cat.color}-400 shadow-lg`
                    : `bg-${cat.color}-900/30 hover:bg-${cat.color}-800/40 border border-${cat.color}-700`
                }`}
              >
                <cat.icon size={24} className={`text-${cat.color}-200`} />
                <div>
                  <div className={`font-bold text-${cat.color}-100`}>{cat.name}</div>
                  <div className={`text-xs text-${cat.color}-300`}>
                    {assets.filter(a => a.category === cat.id).length} items
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="col-span-9 bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-6">
            
            {/* Search & Upload Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets by name or tag..."
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border-2 border-purple-500 rounded-xl text-white placeholder-purple-400"
                />
              </div>
              
              <label className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-bold cursor-pointer flex items-center gap-2">
                <Upload size={20} />
                Upload
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Assets Display */}
            {activeCategory === 'textStyles' ? (
              <div className="space-y-4">
                <div className="bg-pink-900/30 border border-pink-500 rounded-xl p-6">
                  <h3 className="font-bold text-pink-200 mb-4">Create New Text Style</h3>
                  <button
                    onClick={() => {
                      const name = prompt('Style name:');
                      if (name) {
                        saveTextStyle(name, {
                          fontFamily: 'Impact',
                          fontSize: 120,
                          color: '#FFFF00',
                          strokeWidth: 6,
                          strokeColor: '#000000'
                        });
                      }
                    }}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg font-bold"
                  >
                    + Add Text Style
                  </button>
                </div>

                {filteredAssets.map(style => (
                  <div key={style.id} className="bg-pink-950/50 rounded-xl p-4 border border-pink-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-pink-200 mb-2">{style.name}</div>
                        <div className="text-sm text-pink-300">
                          Font: {style.fontFamily} · Size: {style.fontSize}px · Color: {style.color}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAsset(style.id)}
                        className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-3'}>
                {filteredAssets.length === 0 ? (
                  <div className="col-span-4 text-center py-16 text-purple-400">
                    <Upload size={64} className="mx-auto mb-4 opacity-50" />
                    <p>No assets yet. Click Upload to add images.</p>
                  </div>
                ) : (
                  filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="bg-purple-950/50 rounded-xl border-2 border-purple-500 overflow-hidden transition-all hover:border-purple-400 hover:shadow-lg"
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="aspect-square bg-black/40 relative group">
                            <img
                              src={asset.dataUrl}
                              alt={asset.name}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => toggleFavorite(asset.id)}
                                className={`p-2 rounded-lg ${
                                  asset.favorite ? 'bg-yellow-500' : 'bg-purple-600 hover:bg-purple-500'
                                } text-white`}
                              >
                                <Star size={18} fill={asset.favorite ? 'currentColor' : 'none'} />
                              </button>
                              <button
                                onClick={() => downloadAsset(asset)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg"
                              >
                                <Download size={18} />
                              </button>
                              <button
                                onClick={() => deleteAsset(asset.id)}
                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="font-bold text-purple-100 text-sm truncate mb-1">
                              {asset.name}
                            </div>
                            <div className="text-xs text-purple-400">
                              {(asset.size / 1024).toFixed(1)} KB
                            </div>
                            {asset.tags && asset.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {asset.tags.map(tag => (
                                  <span key={tag} className="text-xs bg-purple-700 text-purple-200 px-2 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                const tag = prompt('Add tag:');
                                if (tag) addTag(asset.id, tag);
                              }}
                              className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              <Tag size={12} />
                              Add Tag
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-4 p-4">
                          <img
                            src={asset.dataUrl}
                            alt={asset.name}
                            className="w-16 h-16 object-contain bg-black/40 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-purple-100">{asset.name}</div>
                            <div className="text-sm text-purple-400">
                              {(asset.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleFavorite(asset.id)}
                              className={`p-2 rounded-lg ${
                                asset.favorite ? 'bg-yellow-500' : 'bg-purple-600 hover:bg-purple-500'
                              } text-white`}
                            >
                              <Star size={18} fill={asset.favorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => downloadAsset(asset)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg"
                            >
                              <Download size={18} />
                            </button>
                            <button
                              onClick={() => deleteAsset(asset.id)}
                              className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersistentAssetLibrary;