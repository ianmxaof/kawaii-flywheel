import { useState } from 'react';
import { LogIn, LogOut, CheckCircle } from 'lucide-react';
import { useYouTubeAPI } from '../../hooks/useYouTubeAPI';

export default function YouTubeAuth() {
  const { isAuthenticated, login, logout } = useYouTubeAPI();
  const [clientId, setClientId] = useState(() => {
    return import.meta.env.VITE_YOUTUBE_CLIENT_ID || '';
  });
  const [redirectUri, setRedirectUri] = useState(() => {
    return import.meta.env.VITE_YOUTUBE_REDIRECT_URI || window.location.origin;
  });

  function handleLogin() {
    if (!clientId.trim()) {
      alert('Please enter your YouTube OAuth Client ID. Get it from Google Cloud Console.');
      return;
    }
    login(clientId, redirectUri);
  }

  return (
    <div className="bg-black/40 border border-pink-500/30 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        {isAuthenticated ? (
          <CheckCircle className="text-green-400" size={24} />
        ) : (
          <LogIn className="text-pink-400" size={24} />
        )}
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          YouTube Authentication
        </h2>
      </div>

      {isAuthenticated ? (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
            <p className="text-green-300 font-bold">✓ Authenticated with YouTube</p>
            <p className="text-green-300/70 text-sm mt-2">
              You can now upload videos and access analytics.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4">
            <p className="text-pink-200 text-sm mb-2">
              To use YouTube features, you need to:
            </p>
            <ol className="text-pink-200 text-sm space-y-1 list-decimal list-inside">
              <li>Create a project in Google Cloud Console</li>
              <li>Enable YouTube Data API v3</li>
              <li>Create OAuth 2.0 credentials (Web application)</li>
              <li>Add your redirect URI: <code className="bg-black/50 px-1 rounded">{redirectUri}</code></li>
              <li>Enter your Client ID below</li>
            </ol>
          </div>

          <div>
            <label className="block text-pink-300 mb-2 font-bold">OAuth Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Google OAuth Client ID"
              className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
            />
            <p className="text-pink-300/70 text-xs mt-1">
              Or set VITE_YOUTUBE_CLIENT_ID in .env file
            </p>
          </div>

          <div>
            <label className="block text-pink-300 mb-2 font-bold">Redirect URI</label>
            <input
              type="text"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              placeholder="http://localhost:5173"
              className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!clientId.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Login with YouTube
          </button>
        </div>
      )}
    </div>
  );
}

