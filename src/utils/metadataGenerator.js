export function generateTags(title, topic = 'automation') {
  const baseTags = [
    'automation',
    'productivity',
    'youtube',
    'tech',
    'tutorial',
  ];

  const topicTags = {
    automation: ['zapier', 'make', 'n8n', 'workflow', 'efficiency'],
    coding: ['programming', 'developer', 'code', 'software', 'tech'],
    ai: ['artificial intelligence', 'machine learning', 'chatgpt', 'claude', 'ai tools'],
  };

  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const specificTags = titleWords.slice(0, 5);

  const allTags = [
    ...baseTags,
    ...(topicTags[topic] || []),
    ...specificTags,
  ].slice(0, 15);

  return [...new Set(allTags)];
}

export function generateDescription(title, script, timestamps = []) {
  const hook = script.split('\n')[0] || title;
  
  let description = `${hook}\n\n`;
  
  if (timestamps.length > 0) {
    description += '📋 Chapters:\n';
    timestamps.forEach((ts, i) => {
      description += `${ts.time} - ${ts.title}\n`;
    });
    description += '\n';
  }
  
  description += `🔗 Resources mentioned in this video:\n`;
  description += `- [Add links here]\n\n`;
  description += `💡 Related videos:\n`;
  description += `- [Video idea 1]\n`;
  description += `- [Video idea 2]\n`;
  description += `- [Video idea 3]\n\n`;
  description += `👋 Subscribe for more automation and productivity tips!\n\n`;
  description += `#automation #productivity #youtube #tech`;

  return description;
}

export function optimizeTitle(title) {
  // Add year for freshness if not present
  if (!title.includes('2025') && !title.includes('2024')) {
    title = title.replace(/(\d{4})?$/, '2025');
  }
  
  // Ensure title is under 100 characters (YouTube limit)
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }
  
  return title;
}

