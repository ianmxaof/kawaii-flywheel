import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function ImageUploader({ onUpload, disabled = false }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFileSelect(files) {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    if (imageFiles.length > 0) {
      onUpload(imageFiles);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleClick() {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }

  function handleFileInput(e) {
    const files = e.target.files;
    if (files) {
      handleFileSelect(files);
    }
    e.target.value = ''; // Reset input
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging 
          ? 'border-pink-500 bg-pink-500/10' 
          : 'border-pink-500/50 bg-black/20 hover:border-pink-500 hover:bg-pink-500/5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      <Upload 
        size={48} 
        className={`mx-auto mb-4 ${isDragging ? 'text-pink-400' : 'text-pink-500/70'}`} 
      />
      <p className="text-pink-300 font-bold mb-2">
        {isDragging ? 'Drop images here' : 'Drag & drop images here'}
      </p>
      <p className="text-pink-400/70 text-sm">
        or click to browse
      </p>
      <p className="text-pink-400/50 text-xs mt-2">
        Supports PNG, JPG, WEBP
      </p>
    </div>
  );
}

