import { useState, useCallback } from 'react';

export function useCanvas() {
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const addLayer = useCallback((layer) => {
    const newLayer = {
      id: Date.now(),
      type: layer.type, // 'image' or 'text'
      ...layer,
      zIndex: layers.length,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    return newLayer.id;
  }, [layers.length]);

  const updateLayer = useCallback((id, updates) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  const deleteLayer = useCallback((id) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  const bringForward = useCallback((id) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (!layer) return prev;
      
      const maxZ = Math.max(...prev.map(l => l.zIndex));
      if (layer.zIndex < maxZ) {
        return prev.map(l => 
          l.id === id 
            ? { ...l, zIndex: maxZ + 1 }
            : l.zIndex > layer.zIndex 
              ? { ...l, zIndex: l.zIndex - 1 }
              : l
        );
      }
      return prev;
    });
  }, []);

  const sendBackward = useCallback((id) => {
    setLayers(prev => {
      const layer = prev.find(l => l.id === id);
      if (!layer) return prev;
      
      const minZ = Math.min(...prev.map(l => l.zIndex));
      if (layer.zIndex > minZ) {
        return prev.map(l => 
          l.id === id 
            ? { ...l, zIndex: minZ - 1 }
            : l.zIndex < layer.zIndex 
              ? { ...l, zIndex: l.zIndex + 1 }
              : l
        );
      }
      return prev;
    });
  }, []);

  const clearCanvas = useCallback(() => {
    setLayers([]);
    setSelectedLayerId(null);
  }, []);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return {
    layers: [...layers].sort((a, b) => a.zIndex - b.zIndex),
    selectedLayerId,
    selectedLayer,
    addLayer,
    updateLayer,
    deleteLayer,
    bringForward,
    sendBackward,
    clearCanvas,
    setSelectedLayerId,
  };
}

