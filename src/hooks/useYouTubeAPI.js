import { useState, useEffect } from 'react';

const STORAGE_KEY = 'youtube_auth_token';

export function useYouTubeAPI() {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored token
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const tokenData = JSON.parse(stored);
        // Check if token is expired
        if (tokenData.expiresAt && tokenData.expiresAt > Date.now()) {
          setAccessToken(tokenData.access_token);
          setIsAuthenticated(true);
        } else {
          // Token expired, remove it
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to parse stored token:', error);
      }
    }

    // Check for OAuth callback
    if (window.location.hash) {
      const tokenData = parseOAuthResponse(window.location.hash);
      if (tokenData.access_token) {
        const expiresAt = Date.now() + (parseInt(tokenData.expires_in) * 1000);
        const tokenToStore = {
          ...tokenData,
          expiresAt,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenToStore));
        setAccessToken(tokenData.access_token);
        setIsAuthenticated(true);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  function login(clientId, redirectUri) {
    const url = getOAuthURL(clientId, redirectUri);
    window.location.href = url;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    setIsAuthenticated(false);
  }

  return {
    accessToken,
    isAuthenticated,
    login,
    logout,
  };
}

function getOAuthURL(clientId, redirectUri, scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]) {
  const scopeString = scopes.join(' ');
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopeString)}&access_type=offline&prompt=consent`;
}

function parseOAuthResponse(hash) {
  const params = new URLSearchParams(hash.substring(1));
  return {
    access_token: params.get('access_token'),
    expires_in: params.get('expires_in'),
    token_type: params.get('token_type'),
  };
}

