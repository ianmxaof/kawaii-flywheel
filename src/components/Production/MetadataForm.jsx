import { useState, useEffect } from 'react';
import { Download, Calendar, Tag, FileText } from 'lucide-react';
import { generateTags, generateDescription, optimizeTitle } from '../../utils/metadataGenerator';

const BEST_TIMES = [
  { time: '14:00', label: '2:00 PM EST', description: 'Afternoon browsing peak' },
  { time: '15:00', label: '3:00 PM EST', description: 'Late afternoon' },
  { time: '16:00', label: '4:00 PM EST', description: 'Pre-evening' },
  { time: '20:00', label: '8:00 PM EST', description: 'Evening watch time' },
];

export default function MetadataForm({ project, onUpdate }) {
  const [title, setTitle] = useState(project?.metadata?.title || '');
  const [description, setDescription] = useState(project?.metadata?.description || '');
  const [tags, setTags] = useState(project?.metadata?.tags || []);
  const [scheduleTime, setScheduleTime] = useState(project?.metadata?.scheduleTime || '');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (project?.metadata) {
      setTitle(project.metadata.title || '');
      setDescription(project.metadata.description || '');
      setTags(project.metadata.tags || []);
      setScheduleTime(project.metadata.scheduleTime || '');
    }
  }, [project]);

  function handleAutoGenerate() {
    if (!title) {
      alert('Enter a title first');
      return;
    }

    const optimizedTitle = optimizeTitle(title);
    setTitle(optimizedTitle);

    const autoTags = generateTags(title, 'automation');
    setTags(autoTags);

    if (project?.script) {
      const autoDescription = generateDescription(optimizedTitle, project.script);
      setDescription(autoDescription);
    }
  }

  function handleAddTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter(t => t !== tagToRemove));
  }

  function handleExport() {
    const metadata = {
      title,
      description,
      tags,
      scheduleTime,
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.title || 'metadata'}_metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (onUpdate && project) {
      onUpdate({
        metadata: {
          title,
          description,
          tags,
          scheduleTime,
        },
      });
    }
  }, [title, description, tags, scheduleTime, onUpdate, project]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
          <FileText size={24} />
          Metadata Generator
        </h2>
        <button
          onClick={handleAutoGenerate}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Auto-Generate
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-pink-300 mb-2 font-bold">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter video title..."
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50"
          maxLength={100}
        />
        <div className="text-pink-300/70 text-xs mt-1">
          {title.length}/100 characters
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-pink-300 mb-2 font-bold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter video description..."
          className="w-full h-48 bg-black/50 border-2 border-pink-500 rounded-lg p-3 text-white placeholder-pink-300/50 resize-none"
        />
        <div className="text-pink-300/70 text-xs mt-1">
          {description.length} characters
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-pink-300 mb-2 font-bold flex items-center gap-2">
          <Tag size={16} />
          Tags ({tags.length}/15)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              }
            }}
            placeholder="Add tag..."
            className="flex-1 bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white placeholder-pink-300/50"
            disabled={tags.length >= 15}
          />
          <button
            onClick={handleAddTag}
            disabled={tags.length >= 15 || !newTag.trim()}
            className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg transition-all disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-pink-300 text-sm flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="block text-pink-300 mb-2 font-bold flex items-center gap-2">
          <Calendar size={16} />
          Schedule Time
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          {BEST_TIMES.map((option) => (
            <button
              key={option.time}
              onClick={() => setScheduleTime(option.time)}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                scheduleTime === option.time
                  ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                  : 'border-pink-500/30 hover:border-pink-500/60 bg-black/20 text-pink-300/70'
              }`}
            >
              <div className="font-bold">{option.label}</div>
              <div className="text-xs opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
        <input
          type="datetime-local"
          value={scheduleTime}
          onChange={(e) => setScheduleTime(e.target.value)}
          className="w-full bg-black/50 border-2 border-pink-500 rounded-lg p-2 text-white"
        />
      </div>

      {/* Export */}
      <div className="pt-4 border-t border-pink-500/30">
        <button
          onClick={handleExport}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Export Metadata as JSON
        </button>
      </div>
    </div>
  );
}

