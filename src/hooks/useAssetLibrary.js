import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'AssetLibrary';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

/**
 * Hook for managing persistent asset library with IndexedDB
 */
export function useAssetLibrary() {
  const [db, setDb] = useState(null);
  const [assets, setAssets] = useState([]);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          setDb(request.result);
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            store.createIndex('favorite', 'favorite', { unique: false });
          }
        };
      });
    };

    initDB().catch(console.error);
  }, []);

  // Load all assets
  const loadAssets = useCallback(async () => {
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        setAssets(request.result);
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Load assets on mount and when DB is ready
  useEffect(() => {
    if (db) {
      loadAssets();
    }
  }, [db, loadAssets]);

  // Get assets by category
  const getAssets = useCallback(async (category) => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('category');
      const request = index.getAll(category);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  // Add asset
  const addAsset = useCallback(async (category, file) => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const newAsset = {
          id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category,
          name: file.name,
          dataUrl: e.target.result,
          size: file.size,
          type: file.type,
          tags: [],
          favorite: false,
          uploadedAt: new Date().toISOString()
        };

        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          await store.add(newAsset);
          
          await loadAssets();
          resolve(newAsset);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, [db, loadAssets]);

  // Delete asset
  const deleteAsset = useCallback(async (assetId) => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(assetId);

      request.onsuccess = async () => {
        await loadAssets();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, loadAssets]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (assetId) => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(assetId);

      getRequest.onsuccess = () => {
        const asset = getRequest.result;
        if (!asset) {
          reject(new Error('Asset not found'));
          return;
        }

        asset.favorite = !asset.favorite;
        const updateRequest = store.put(asset);

        updateRequest.onsuccess = async () => {
          await loadAssets();
          resolve(asset);
        };

        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }, [db, loadAssets]);

  // Add tag
  const addTag = useCallback(async (assetId, tag) => {
    if (!db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(assetId);

      getRequest.onsuccess = () => {
        const asset = getRequest.result;
        if (!asset) {
          reject(new Error('Asset not found'));
          return;
        }

        if (!asset.tags) asset.tags = [];
        if (!asset.tags.includes(tag)) {
          asset.tags.push(tag);
        }

        const updateRequest = store.put(asset);

        updateRequest.onsuccess = async () => {
          await loadAssets();
          resolve(asset);
        };

        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }, [db, loadAssets]);

  // Save text style
  const saveTextStyle = useCallback(async (styleName, styleData) => {
    if (!db) throw new Error('Database not initialized');

    const newStyle = {
      id: `style_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: 'textStyles',
      name: styleName,
      ...styleData,
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(newStyle);

      request.onsuccess = async () => {
        await loadAssets();
        resolve(newStyle);
      };

      request.onerror = () => reject(request.error);
    });
  }, [db, loadAssets]);

  return {
    assets,
    getAssets,
    addAsset,
    deleteAsset,
    toggleFavorite,
    addTag,
    saveTextStyle,
    loadAssets
  };
}