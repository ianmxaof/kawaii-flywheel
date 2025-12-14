import { openDB } from 'idb';

const DB_NAME = 'ContentFactoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveImage(file, metadata = {}) {
  const db = await getDB();
  const arrayBuffer = await file.arrayBuffer();
  const imageData = {
    name: file.name,
    type: file.type,
    size: file.size,
    data: arrayBuffer,
    uploadedAt: new Date().toISOString(),
    ...metadata,
  };
  const id = await db.add(STORE_NAME, imageData);
  return { ...imageData, id };
}

export async function getAllImages() {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
}

export async function getImage(id) {
  const db = await getDB();
  return await db.get(STORE_NAME, id);
}

export async function deleteImage(id) {
  const db = await getDB();
  return await db.delete(STORE_NAME, id);
}

export async function deleteImages(ids) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  return await tx.done;
}

export async function clearAllImages() {
  const db = await getDB();
  return await db.clear(STORE_NAME);
}

export function imageToDataURL(imageData) {
  const blob = new Blob([imageData.data], { type: imageData.type });
  return URL.createObjectURL(blob);
}

