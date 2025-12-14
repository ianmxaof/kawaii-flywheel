import html2canvas from 'html2canvas';

export async function exportCanvasAsPNG(element, options = {}) {
  const {
    width = 1280,
    height = 720,
    backgroundColor = '#000000',
    quality = 1,
  } = options;

  const canvas = await html2canvas(element, {
    width,
    height,
    backgroundColor,
    scale: quality,
    useCORS: true,
    logging: false,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 1.0);
  });
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

export function createImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

