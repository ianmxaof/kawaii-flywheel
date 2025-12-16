import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Download, X, RefreshCw } from 'lucide-react';
import { useAssetLibrary } from '../../hooks/useAssetLibrary';

const InlinePerchanceGen = ({ onImageAdd }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('anime');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const { addAsset } = useAssetLibrary();

  const styles = [
    { value: 'anime', label: 'Anime' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'photographic', label: 'Photographic' },
    { value: 'digital-art', label: 'Digital Art' }
  ];

  const aspectRatios = [
    { value: '1:1', label: '1:1 (Square)' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '9:16', label: '9:16 (Vertical)' },
    { value: '3:2', label: '3:2 (Photo)' },
    { value: '2:3', label: '2:3 (Portrait)' }
  ];

  const generateImages = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const response = await fetch('http://localhost:5000/api/perchance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negative_prompt: '',
          aspect_ratio: aspectRatio,
          num_images: numImages,
          style: style
        })
      });

      const data = await response.json();

      if (data.success && data.images) {
        setGeneratedImages(data.images);

        // Auto-save to asset library
        for (const img of data.images) {
          try {
            // Convert base64 to blob
            const base64Data = img.data.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], `${img.id}.png`, { type: 'image/png' });

            // Add to asset library
            await addAsset('thumbnail', file);
          } catch (error) {
            console.error('Failed to save image to asset library:', error);
          }
        }
      } else {
        throw new Error(data.error || 'Image generation failed');
      }
    } catch (error) {
      console.error('Perchance generation failed:', error);
      alert(`Failed to generate images: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageClick = (image) => {
    if (onImageAdd) {
      // Convert base64 to blob URL for canvas
      const base64Data = image.data.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const blobUrl = URL.createObjectURL(blob);

      onImageAdd({
        type: 'image',
        src: blobUrl,
        width: 800,
        height: 800,
        x: 100,
        y: 100
      });
    }
  };

  const downloadImage = async (image) => {
    try {
      const link = document.createElement('a');
      link.href = image.data;
      link.download = `${image.id}.png`;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-pink-950/50 rounded-xl p-6 border-2 border-pink-500">
      <h3 className="text-xl font-bold text-pink-200 mb-4 flex items-center gap-2">
        <Sparkles size={24} />
        Perchance Generator (Inline)
      </h3>

      {/* Input Controls */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-bold text-pink-200 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your image generation prompt..."
            className="w-full bg-black/40 border-2 border-pink-500/50 rounded-xl px-4 py-3 text-pink-100 placeholder-pink-400/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-bold text-pink-200 mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-black/40 border-2 border-pink-500/50 rounded-lg px-3 py-2 text-pink-100 focus:outline-none focus:border-pink-400"
            >
              {styles.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-pink-200 mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-black/40 border-2 border-pink-500/50 rounded-lg px-3 py-2 text-pink-100 focus:outline-none focus:border-pink-400"
            >
              {aspectRatios.map(ar => (
                <option key={ar.value} value={ar.value}>{ar.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-pink-200 mb-2">
              Number of Images
            </label>
            <select
              value={numImages}
              onChange={(e) => setNumImages(parseInt(e.target.value))}
              className="w-full bg-black/40 border-2 border-pink-500/50 rounded-lg px-3 py-2 text-pink-100 focus:outline-none focus:border-pink-400"
            >
              {[4, 8, 12, 16, 32].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateImages}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-lg py-3 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Generating {numImages} Images...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate {numImages} Images
            </>
          )}
        </button>
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-pink-200 mb-3">
            Generated Images ({generatedImages.length})
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {generatedImages.map((image, idx) => (
              <div
                key={idx}
                className="relative group bg-black/40 rounded-lg overflow-hidden border-2 border-pink-700 hover:border-pink-400 transition-all"
              >
                <img
                  src={image.data}
                  alt={`Generated ${idx + 1}`}
                  className="w-full h-32 object-cover cursor-pointer"
                  onClick={() => handleImageClick(image)}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageClick(image);
                    }}
                    className="bg-pink-600 hover:bg-pink-500 text-white p-2 rounded-lg"
                    title="Add to canvas"
                  >
                    <ImageIcon size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(image);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-pink-400 mt-2">
            Click image to add to canvas → Images auto-saved to asset library
          </p>
        </div>
      )}

      {/* Backend Status */}
      <div className="mt-4 bg-blue-900/30 border border-blue-500 rounded-lg p-3">
        <p className="text-blue-200 text-xs">
          <strong>Backend Required:</strong> Make sure unified_server.py is running on localhost:5000
        </p>
      </div>
    </div>
  );
};

export default InlinePerchanceGen;
