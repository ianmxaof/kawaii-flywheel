// YouTube API utilities
// Note: This is a simplified version. Full implementation would require OAuth 2.0 flow
// For production, use google-auth-library and proper OAuth flow

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function uploadVideo(videoFile, metadata, accessToken) {
  // This is a placeholder - actual implementation requires:
  // 1. OAuth 2.0 token
  // 2. Resumable upload protocol
  // 3. Proper error handling
  
  const formData = new FormData();
  formData.append('video', videoFile);
  
  // YouTube Data API v3 upload endpoint
  const response = await fetch(`${YOUTUBE_API_BASE}/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: metadata.privacyStatus || 'private',
        publishAt: metadata.scheduleTime || null,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getVideoAnalytics(videoId, accessToken) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=statistics,snippet&id=${videoId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items[0];
}

export async function getChannelVideos(channelId, accessToken, maxResults = 50) {
  const response = await fetch(
    `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&maxResults=${maxResults}&order=date`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`);
  }

  return response.json();
}

export function getOAuthURL(clientId, redirectUri, scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]) {
  const scopeString = scopes.join(' ');
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopeString)}&access_type=offline&prompt=consent`;
}

export function parseOAuthResponse(hash) {
  const params = new URLSearchParams(hash.substring(1));
  return {
    access_token: params.get('access_token'),
    expires_in: params.get('expires_in'),
    token_type: params.get('token_type'),
  };
}

