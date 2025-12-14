import { useState, useEffect } from 'react';
import { getAllImages, saveImage, deleteImage, deleteImages, clearAllImages, imageToDataURL } from '../utils/indexedDB';
import { createZipFromImages, downloadBlob } from '../utils/zipExport';

export function useGallery() {
  const [images, setImages] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    setLoading(true);
    try {
      const allImages = await getAllImages();
      setImages(allImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addImages(files) {
    setLoading(true);
    try {
      const newImages = await Promise.all(
        Array.from(files).map(file => saveImage(file))
      );
      setImages(prev => [...prev, ...newImages]);
      return newImages;
    } catch (error) {
      console.error('Failed to add images:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function removeImage(id) {
    try {
      await deleteImage(id);
      setImages(prev => prev.filter(img => img.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }

  async function removeSelected() {
    if (selectedIds.size === 0) return;
    try {
      await deleteImages(Array.from(selectedIds));
      setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete selected images:', error);
      throw error;
    }
  }

  async function clearAll() {
    try {
      await clearAllImages();
      setImages([]);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to clear images:', error);
      throw error;
    }
  }

  async function downloadSelectedAsZip() {
    if (selectedIds.size === 0) return;
    
    const selectedImages = images.filter(img => selectedIds.has(img.id));
    const blobs = await Promise.all(
      selectedImages.map(img => {
        const blob = new Blob([img.data], { type: img.type });
        return blob;
      })
    );
    
    const zip = await createZipFromImages(
      blobs,
      selectedImages.map(img => img.name || `image_${img.id}.png`)
    );
    
    downloadBlob(zip, `thumbnails_${Date.now()}.zip`);
  }

  function toggleSelection(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(images.map(img => img.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function getImageURL(image) {
    return imageToDataURL(image);
  }

  return {
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
    refresh: loadImages,
  };
}

