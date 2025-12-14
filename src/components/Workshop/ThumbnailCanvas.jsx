import { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useCanvas } from '../../hooks/useCanvas';
import { useGallery } from '../../hooks/useGallery';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const SCALE = 0.5; // Display scale for UI

export default function ThumbnailCanvas({ onImageAdd, canvasRef }) {
  const internalCanvasRef = useRef(null);
  const ref = canvasRef || internalCanvasRef;
  const {
    layers,
    selectedLayerId,
    addLayer,
    updateLayer,
    deleteLayer,
    bringForward,
    sendBackward,
    setSelectedLayerId,
  } = useCanvas();
  
  const { images, getImageURL } = useGallery();
  const [imageURLs, setImageURLs] = useState(new Map());

  useEffect(() => {
    // Load image URLs
    const urls = new Map();
    images.forEach(img => {
      if (!imageURLs.has(img.id)) {
        urls.set(img.id, getImageURL(img));
      } else {
        urls.set(img.id, imageURLs.get(img.id));
      }
    });
    setImageURLs(urls);
  }, [images, getImageURL]);

  function handleDrop(e) {
    e.preventDefault();
    const imageId = parseInt(e.dataTransfer.getData('imageId'));
    if (imageId) {
      const image = images.find(img => img.id === imageId);
      if (image) {
        const url = imageURLs.get(imageId);
        addLayer({
          type: 'image',
          imageId: imageId,
          src: url,
          name: image.name,
          x: (e.clientX - canvasRef.current.getBoundingClientRect().left) / SCALE - 100,
          y: (e.clientY - canvasRef.current.getBoundingClientRect().top) / SCALE - 100,
          width: 200,
          height: 200,
        });
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleImageDragStart(e, imageId) {
    e.dataTransfer.setData('imageId', imageId.toString());
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Gallery Sidebar */}
      <div className="w-48 bg-black/40 border border-pink-500/30 rounded-lg p-4 overflow-y-auto">
        <h3 className="text-pink-300 font-bold mb-4">Drag to Canvas</h3>
        {images.length === 0 ? (
          <p className="text-pink-300/50 text-sm">No images in gallery</p>
        ) : (
          <div className="space-y-2">
            {images.map(image => {
              const url = imageURLs.get(image.id);
              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, image.id)}
                  className="cursor-move p-2 bg-black/20 rounded hover:bg-pink-500/10 border border-pink-500/20"
                >
                  {url && (
                    <img
                      src={url}
                      alt={image.name}
                      className="w-full h-20 object-cover rounded"
                    />
                  )}
                  <p className="text-xs text-pink-300 truncate mt-1">
                    {image.name || `Image ${image.id}`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col">
        <div
          ref={ref}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex-1 bg-gray-900 border-2 border-pink-500 rounded-lg overflow-hidden relative"
          style={{
            width: CANVAS_WIDTH * SCALE,
            height: CANVAS_HEIGHT * SCALE,
            margin: '0 auto',
          }}
        >
          {layers.map(layer => {
            if (layer.type === 'image') {
              return (
                <Draggable
                  key={layer.id}
                  position={{ x: layer.x || 0, y: layer.y || 0 }}
                  onStop={(e, data) => {
                    updateLayer(layer.id, {
                      x: data.x / SCALE,
                      y: data.y / SCALE,
                    });
                  }}
                  scale={SCALE}
                >
                  <div
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`
                      absolute cursor-move
                      ${selectedLayerId === layer.id ? 'ring-2 ring-pink-500' : ''}
                    `}
                    style={{
                      width: (layer.width || 200) * SCALE,
                      height: (layer.height || 200) * SCALE,
                    }}
                  >
                    <Resizable
                      width={(layer.width || 200) * SCALE}
                      height={(layer.height || 200) * SCALE}
                      onResize={(e, { size }) => {
                        updateLayer(layer.id, {
                          width: size.width / SCALE,
                          height: size.height / SCALE,
                        });
                      }}
                      handle={
                        <div
                          className={`
                            absolute bottom-0 right-0 w-4 h-4 bg-pink-500 cursor-se-resize
                            ${selectedLayerId === layer.id ? '' : 'hidden'}
                          `}
                        />
                      }
                    >
                      <div className="w-full h-full">
                        <img
                          src={layer.src}
                          alt={layer.name}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      </div>
                    </Resizable>
                  </div>
                </Draggable>
              );
            } else if (layer.type === 'text') {
              return (
                <Draggable
                  key={layer.id}
                  position={{ x: (layer.x || 0) * SCALE, y: (layer.y || 0) * SCALE }}
                  onStop={(e, data) => {
                    updateLayer(layer.id, {
                      x: data.x / SCALE,
                      y: data.y / SCALE,
                    });
                  }}
                  scale={SCALE}
                >
                  <div
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`
                      absolute cursor-move
                      ${selectedLayerId === layer.id ? 'ring-2 ring-pink-500' : ''}
                    `}
                    style={{
                      fontSize: (layer.fontSize || 48) * SCALE,
                      color: layer.color || '#ffffff',
                      fontFamily: layer.fontFamily || 'Arial',
                      textShadow: layer.stroke ? `2px 2px 0px ${layer.strokeColor || '#000000'}` : 'none',
                    }}
                  >
                    {layer.text || 'Text'}
                  </div>
                </Draggable>
              );
            }
            return null;
          })}
        </div>
        
        <div className="mt-2 text-center text-pink-300/70 text-sm">
          Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px (scaled for display)
        </div>
      </div>
    </div>
  );
}

