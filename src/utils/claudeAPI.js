const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function analyzeThumbnail(imageFile, apiKey) {
  if (!apiKey) {
    throw new Error('Claude API key is required. Set VITE_CLAUDE_API_KEY in .env');
  }

  // Convert image to base64
  const base64 = await fileToBase64(imageFile);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageFile.type || 'image/jpeg',
              data: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
            },
          },
          {
            type: 'text',
            text: 'Analyze this YouTube thumbnail. What makes it clickable? Provide:\n1. Color palette analysis\n2. Text placement and readability\n3. Face/character positioning\n4. Clickbait elements\n5. Overall composition strengths\n6. Specific improvement suggestions',
          },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function generateTitleVariations(topic, apiKey, count = 20) {
  if (!apiKey) {
    throw new Error('Claude API key is required');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate ${count} viral YouTube title variations for this topic: "${topic}"

Use these proven formulas:
- "I {ACTION} and {RESULT}"
- "This {TOOL} Changed Everything"
- "Nobody Talks About {PROBLEM}"
- "{NUMBER} {THINGS} That {BENEFIT}"
- "Why {COMPANY} Hates This"
- "{SHOCKING STATEMENT} (Here's Why)"

Style: Edgy, kawaii energy, anti-corporate
Target: Productivity-obsessed millennials/Gen Z
Tone: High energy, slightly cynical, ends hopeful

Return as a numbered list, one title per line.`,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  // Parse numbered list
  return text.split('\n')
    .filter(line => line.trim().match(/^\d+[\.\)]/))
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(title => title.length > 0);
}

export async function generatePromptVariations(basePrompt, apiKey, count = 10) {
  if (!apiKey) {
    throw new Error('Claude API key is required');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Generate ${count} variations of this Perchance AI image generation prompt. Keep the core style but vary emotions, poses, and actions:

Base prompt: "${basePrompt}"

Return as a numbered list, one prompt per line.`,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return text.split('\n')
    .filter(line => line.trim().match(/^\d+[\.\)]/))
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(prompt => prompt.length > 0);
}

export async function atomizeContent(script, topic, apiKey) {
  if (!apiKey) {
    throw new Error('Claude API key is required');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Convert this YouTube script into multiple content formats:

Topic: ${topic}
Script: ${script}

Generate:
1. YouTube Short script (30 seconds)
2. Twitter thread (8 tweets)
3. LinkedIn post (professional tone)
4. Instagram caption (with hashtags)
5. Blog post outline (800 words)

Format as JSON with keys: shortScript, twitterThread, linkedInPost, instagramCaption, blogOutline`,
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  
  // Try to parse JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // If JSON parsing fails, return as structured text
  }
  
  return { raw: text };
}

export async function batchGenerateMetadata(titles, apiKey) {
  if (!apiKey) {
    throw new Error('Claude API key is required');
  }

  const promises = titles.map(title => 
    fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Generate YouTube metadata for this title: "${title}"

Provide:
1. Optimized title (include year 2025)
2. Description with timestamps
3. 15 tags (mix broad + specific)

Format as JSON: {title, description, tags: []}`,
        }],
      }),
    }).then(res => res.json())
      .then(data => {
        const text = data.content[0].text;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {}
        return { title, description: text, tags: [] };
      })
  );

  return Promise.all(promises);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

