import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, MousePointerClick } from 'lucide-react';
import { useYouTubeAPI } from '../../hooks/useYouTubeAPI';
import { getChannelVideos, getVideoAnalytics } from '../../utils/youtubeAPI';

export default function AnalyticsDash() {
  const { isAuthenticated, accessToken } = useYouTubeAPI();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [channelId, setChannelId] = useState('');

  async function handleLoadVideos() {
    if (!channelId.trim() || !accessToken) {
      alert('Please enter channel ID and ensure you are authenticated');
      return;
    }

    setLoading(true);
    try {
      const data = await getChannelVideos(channelId, accessToken);
      setVideos(data.items || []);
    } catch (error) {
      alert('Failed to load videos: ' + error.message);
    } finally {
      setLoading(false);
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
        <BarChart3 className="text-pink-400" size={24} />
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          Analytics Dashboard
        </h2>
      </div>

      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4 mb-4">
        <p className="text-pink-200 text-sm">
          💡 Enter your YouTube channel ID to view analytics. Find it in your channel settings or use "mine" for your own channel.
        </p>
      </div>

      {/* Channel Input */}
      <div className="bg-black/40 border border-pink-500/30 rounded-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="Enter channel ID or 'mine'"
            className="flex-1 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
          />
          <button
            onClick={handleLoadVideos}
            disabled={loading || !channelId.trim()}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Loading...' : 'Load Videos'}
          </button>
        </div>
      </div>

      {/* Videos List */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-pink-300 font-bold text-lg">
            Recent Videos ({videos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video, index) => {
              const stats = video.statistics || {};
              const views = parseInt(stats.viewCount || 0);
              const likes = parseInt(stats.likeCount || 0);
              
              return (
                <div
                  key={video.id.videoId || index}
                  className="bg-black/40 border border-pink-500/30 rounded-lg p-4 hover:border-pink-500/60 transition-all"
                >
                  <h4 className="text-pink-300 font-bold mb-2 line-clamp-2">
                    {video.snippet?.title || 'Untitled'}
                  </h4>
                  
                  {video.snippet?.thumbnails?.default && (
                    <img
                      src={video.snippet.thumbnails.default.url}
                      alt={video.snippet.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-pink-300/70">
                      <Eye size={14} />
                      <span>{views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-pink-300/70">
                      <TrendingUp size={14} />
                      <span>{likes.toLocaleString()} likes</span>
                    </div>
                  </div>

                  {video.snippet?.publishedAt && (
                    <p className="text-pink-300/50 text-xs mt-2">
                      Published: {new Date(video.snippet.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {videos.length === 0 && !loading && (
        <div className="text-center text-pink-300/50 py-8">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Enter a channel ID and click "Load Videos" to see analytics</p>
        </div>
      )}
    </div>
  );
}

