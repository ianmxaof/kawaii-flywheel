import JSZip from 'jszip';

export async function createZipFromImages(images, filenames = []) {
  const zip = new JSZip();
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const filename = filenames[i] || `image_${i + 1}.png`;
    
    if (image instanceof Blob) {
      zip.file(filename, image);
    } else if (image instanceof File) {
      zip.file(filename, image);
    } else if (typeof image === 'string') {
      // Data URL
      const response = await fetch(image);
      const blob = await response.blob();
      zip.file(filename, blob);
    } else if (image.data) {
      // IndexedDB image object
      const blob = new Blob([image.data], { type: image.type });
      zip.file(filename, blob);
    }
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

