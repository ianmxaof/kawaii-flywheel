import { useState } from 'react';
import { Upload, Video, Image as ImageIcon, Calendar, Loader } from 'lucide-react';
import { useYouTubeAPI } from '../../hooks/useYouTubeAPI';
import { uploadVideo } from '../../utils/youtubeAPI';

export default function Uploader({ projects }) {
  const { isAuthenticated, accessToken } = useYouTubeAPI();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    tags: [],
    privacyStatus: 'private',
    scheduleTime: '',
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadQueue, setUploadQueue] = useState([]);

  function handleVideoSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    }
  }

  function handleThumbnailSelect(e) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
    }
  }

  function loadProjectMetadata(project) {
    if (project) {
      setMetadata({
        title: project.metadata?.title || project.title || '',
        description: project.metadata?.description || '',
        tags: project.metadata?.tags || [],
        privacyStatus: 'private',
        scheduleTime: project.metadata?.scheduleTime || '',
      });
    }
  }

  async function handleUpload() {
    if (!videoFile || !accessToken) {
      alert('Please select a video file and ensure you are authenticated');
      return;
    }

    if (!metadata.title.trim()) {
      alert('Please enter a video title');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress (actual upload would use resumable upload protocol)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      await uploadVideo(videoFile, metadata, accessToken);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      alert('Video uploaded successfully!');
      
      // Reset form
      setVideoFile(null);
      setThumbnailFile(null);
      setMetadata({
        title: '',
        description: '',
        tags: [],
        privacyStatus: 'private',
        scheduleTime: '',
      });
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-6 text-center">
        <p className="text-pink-300">Please authenticate with YouTube first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Video Uploader
        </h2>
      </div>

      {/* Project Selector */}
      {projects && projects.length > 0 && (
        <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
          <label className="block text-pink-300 mb-2 font-bold">Load from Project</label>
          <select
            onChange={(e) => {
              const projectId = parseInt(e.target.value);
              const project = projects.find(p => p.id === projectId);
              if (project) {
                loadProjectMetadata(project);
              }
            }}
            className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video File */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
        <label className="block text-pink-300 mb-2 font-bold flex items-center gap-2">
          <Video size={18} />
          Video File
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
        />
        {videoFile && (
          <p className="text-pink-300/70 text-sm mt-2">
            Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Thumbnail */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
        <label className="block text-pink-300 mb-2 font-bold flex items-center gap-2">
          <ImageIcon size={18} />
          Thumbnail (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailSelect}
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
        />
        {thumbnailFile && (
          <p className="text-pink-300/70 text-sm mt-2">
            Selected: {thumbnailFile.name}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-pink-300 mb-2 font-bold">Title *</label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
            className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white"
            placeholder="Video title..."
          />
        </div>

        <div>
          <label className="block text-pink-300 mb-2 font-bold">Description</label>
          <textarea
            value={metadata.description}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            className="w-full h-32 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white resize-none"
            placeholder="Video description..."
          />
        </div>

        <div>
          <label className="block text-pink-300 mb-2 font-bold">Tags (comma-separated)</label>
          <input
            type="text"
            value={metadata.tags.join(', ')}
            onChange={(e) => setMetadata({
              ...metadata,
              tags: e.target.value.split(',').map(t => t.trim()).filter(t => t),
            })}
            className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-pink-300 mb-2 font-bold">Privacy</label>
            <select
              value={metadata.privacyStatus}
              onChange={(e) => setMetadata({ ...metadata, privacyStatus: e.target.value })}
              className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
            >
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div>
            <label className="block text-pink-300 mb-2 font-bold flex items-center gap-2">
              <Calendar size={16} />
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              value={metadata.scheduleTime}
              onChange={(e) => setMetadata({ ...metadata, scheduleTime: e.target.value })}
              className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-pink-300 font-bold">Uploading...</span>
            <span className="text-pink-300">{progress}%</span>
          </div>
          <div className="w-full bg-black/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !videoFile || !metadata.title.trim()}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader className="animate-spin" size={18} />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} />
            Upload Video
          </>
        )}
      </button>
    </div>
  );
}

