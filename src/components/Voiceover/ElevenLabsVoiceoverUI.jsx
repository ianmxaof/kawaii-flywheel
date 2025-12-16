import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, Download, RefreshCw, Folder, Check, X, Volume2, Settings, SkipForward } from 'lucide-react';
import { APIConnector } from '../../utils/apiConnector';

const ElevenLabsVoiceoverUI = ({ script, semanticGuide, onVoiceoverGenerated, onSkip }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);
  const [saveDirectory, setSaveDirectory] = useState('');
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.75,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  });
  const [costEstimate, setCostEstimate] = useState({ chars: 0, cost: 0 });

  const apiConnector = new APIConnector();

  // Load available voices on mount
  useEffect(() => {
    fetchVoices();
  }, []);

  // Calculate cost estimate when script changes
  useEffect(() => {
    if (script) {
      calculateCost();
    }
  }, [script, voiceSettings]);

  const fetchVoices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/voiceover/anime-voices');
      const data = await response.json();
      setVoices(data.voices || []);
      
      // Auto-select first anime-style voice
      if (data.voices && data.voices.length > 0) {
        setSelectedVoice(data.voices[0]);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  const calculateCost = async () => {
    if (!script) return;
    
    try {
      const scriptText = typeof script === 'string' ? script : script.text || '';
      const estimate = await apiConnector.estimateCost(scriptText, 'starter');
      
      setCostEstimate({
        chars: estimate.character_count || scriptText.length,
        cost: estimate.estimated_cost || 0
      });
    } catch (error) {
      console.error('Cost estimation failed:', error);
      const scriptText = typeof script === 'string' ? script : script.text || '';
      const charCount = scriptText.length;
      const estimatedCost = (charCount / 6000).toFixed(2); // $5 for 30k chars
      setCostEstimate({ chars: charCount, cost: parseFloat(estimatedCost) });
    }
  };

  const generateVoiceover = async () => {
    if (!script || !selectedVoice) {
      alert('Please select a voice and ensure script is available');
      return;
    }

    setIsGenerating(true);
    
    try {
      const scriptText = typeof script === 'string' ? script : script.text || '';
      
      const response = await fetch('http://localhost:5000/api/voiceover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          voice_id: selectedVoice.voice_id,
          output_name: `voiceover_${Date.now()}.mp3`,
          settings: voiceSettings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedAudio({
          url: `http://localhost:5000${data.download_url}`,
          filename: data.filename,
          generatedAt: new Date().toISOString()
        });

        // Notify parent component
        if (onVoiceoverGenerated) {
          onVoiceoverGenerated({
            status: 'generated',
            duration: (scriptText.length / 150) * 60, // Estimate duration
            format: 'mp3',
            downloadUrl: data.download_url,
            filename: data.filename
          });
        }
      } else {
        throw new Error(data.error || 'Voiceover generation failed');
      }
    } catch (error) {
      console.error('Voiceover generation failed:', error);
      alert(`Failed to generate voiceover: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (!generatedAudio) return;

    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio(generatedAudio.url);
      audio.play();
      setIsPlaying(true);
      setAudioPlayer(audio);

      audio.onended = () => setIsPlaying(false);
    }
  };

  const downloadAudio = async () => {
    if (!generatedAudio) return;

    // If directory selected, save to that location
    if (saveDirectory && window.voiceoverDirHandle) {
      await saveToDirectory();
    } else {
      // Default browser download
      const link = document.createElement('a');
      link.href = generatedAudio.url;
      link.download = generatedAudio.filename;
      link.click();
    }
  };

  const pickSaveDirectory = async () => {
    try {
      // Use File System Access API (modern browsers)
      const dirHandle = await window.showDirectoryPicker();
      setSaveDirectory(dirHandle.name);
      
      // Store handle for later use
      window.voiceoverDirHandle = dirHandle;
      
      setShowDirectoryPicker(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Directory picker failed:', error);
      }
    }
  };

  const saveToDirectory = async () => {
    if (!window.voiceoverDirHandle || !generatedAudio) return;

    try {
      // Fetch audio blob
      const response = await fetch(generatedAudio.url);
      const blob = await response.blob();

      // Create file in selected directory
      const fileHandle = await window.voiceoverDirHandle.getFileHandle(
        generatedAudio.filename,
        { create: true }
      );

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      alert(`Saved to: ${saveDirectory}/${generatedAudio.filename}`);
    } catch (error) {
      console.error('Failed to save to directory:', error);
      alert('Failed to save file. Try manual download instead.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Voice Selection */}
      <div className="bg-purple-950/50 rounded-xl p-6 border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
          <Mic size={24} />
          Voice Selection
        </h3>

        {voices.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-purple-400">Loading voices from ElevenLabs...</p>
            <p className="text-purple-500 text-sm mt-2">
              Make sure Python backend is running on localhost:5000
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {voices.map(voice => (
              <button
                key={voice.voice_id}
                onClick={() => setSelectedVoice(voice)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedVoice?.voice_id === voice.voice_id
                    ? 'border-purple-400 bg-purple-700 shadow-lg'
                    : 'border-purple-700 bg-purple-900/30 hover:bg-purple-800/40'
                }`}
              >
                <div className="font-bold text-purple-100 mb-1">{voice.name}</div>
                <div className="text-sm text-purple-300">
                  {voice.labels?.accent || 'Neutral'} · {voice.labels?.age || 'Adult'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice Settings */}
      <div className="bg-purple-950/50 rounded-xl p-6 border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
          <Settings size={24} />
          Voice Settings
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-purple-300 mb-2">
              <span>Stability</span>
              <span>{voiceSettings.stability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={voiceSettings.stability}
              onChange={(e) => setVoiceSettings(prev => ({
                ...prev,
                stability: parseFloat(e.target.value)
              }))}
              className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-purple-400 mt-1">
              Lower = more expressive, Higher = more consistent
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm text-purple-300 mb-2">
              <span>Similarity Boost</span>
              <span>{voiceSettings.similarity_boost.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={voiceSettings.similarity_boost}
              onChange={(e) => setVoiceSettings(prev => ({
                ...prev,
                similarity_boost: parseFloat(e.target.value)
              }))}
              className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-purple-400 mt-1">
              Higher = closer to original voice sample
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm text-purple-300 mb-2">
              <span>Style Exaggeration</span>
              <span>{voiceSettings.style.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={voiceSettings.style}
              onChange={(e) => setVoiceSettings(prev => ({
                ...prev,
                style: parseFloat(e.target.value)
              }))}
              className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-purple-400 mt-1">
              How much to exaggerate the speaking style (0.5 recommended)
            </p>
          </div>

          <label className="flex items-center gap-2 text-purple-300">
            <input
              type="checkbox"
              checked={voiceSettings.use_speaker_boost}
              onChange={(e) => setVoiceSettings(prev => ({
                ...prev,
                use_speaker_boost: e.target.checked
              }))}
              className="w-4 h-4"
            />
            <span>Speaker Boost (enhances clarity)</span>
          </label>
        </div>
      </div>

      {/* Semantic Pacing Guide */}
      {semanticGuide && semanticGuide.voiceover_guide && (
        <div className="bg-green-950/50 rounded-xl p-6 border-2 border-green-500">
          <h3 className="text-xl font-bold text-green-200 mb-4 flex items-center gap-2">
            <Volume2 size={24} />
            Semantic Pacing Guide
          </h3>

          <div className="space-y-3">
            {semanticGuide.voiceover_guide.emphasis_points && semanticGuide.voiceover_guide.emphasis_points.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Emphasis Points ({semanticGuide.voiceover_guide.emphasis_points.length})
                </div>
                <div className="space-y-1">
                  {semanticGuide.voiceover_guide.emphasis_points.slice(0, 5).map((point, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{point.timestamp}</span>: "{point.text}" - {point.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {semanticGuide.voiceover_guide.pause_points && semanticGuide.voiceover_guide.pause_points.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Pause Points ({semanticGuide.voiceover_guide.pause_points.length})
                </div>
                <div className="space-y-1">
                  {semanticGuide.voiceover_guide.pause_points.slice(0, 5).map((point, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{point.timestamp}</span>: Pause {point.duration}s - {point.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {semanticGuide.voiceover_guide.energy_levels && semanticGuide.voiceover_guide.energy_levels.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Energy Levels ({semanticGuide.voiceover_guide.energy_levels.length})
                </div>
                <div className="space-y-1">
                  {semanticGuide.voiceover_guide.energy_levels.slice(0, 5).map((level, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{level.timestamp}</span>: {level.level} energy - {level.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-xl p-4">
        <h4 className="font-bold text-yellow-200 mb-2">Cost Estimate</h4>
        <div className="text-yellow-300 text-sm">
          Characters: {costEstimate.chars.toLocaleString()} · Estimated: ${costEstimate.cost.toFixed(2)}
        </div>
        <div className="text-yellow-400 text-xs mt-1">
          Starter tier: $5/month for 30,000 characters (~20 videos)
        </div>
      </div>

      {/* Generation Controls */}
      <div className="bg-purple-950/50 rounded-xl p-6 border-2 border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4">Generation</h3>

        <div className="space-y-3">
          {/* Directory Picker */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDirectoryPicker(true)}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Folder size={16} />
              {saveDirectory || 'Set Save Directory'}
            </button>
            {saveDirectory && (
              <span className="text-purple-300 text-sm">
                ✓ Saves to: {saveDirectory}
              </span>
            )}
          </div>

          {showDirectoryPicker && (
            <div className="bg-purple-900/50 border border-purple-500 rounded-lg p-4">
              <p className="text-purple-200 mb-3">
                Choose where to save voiceover files:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={pickSaveDirectory}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg"
                >
                  Browse Folders
                </button>
                <button
                  onClick={() => setShowDirectoryPicker(false)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
              <p className="text-purple-400 text-xs mt-2">
                Browser will ask for permission to save files
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateVoiceover}
            disabled={isGenerating || !selectedVoice || !script}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-xl py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={24} className="animate-spin" />
                Generating Voiceover...
              </>
            ) : (
              <>
                <Mic size={24} />
                Generate Voiceover
              </>
            )}
          </button>

          {/* Generated Audio Controls */}
          {generatedAudio && (
            <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-green-200">
                    ✓ Voiceover Generated
                  </div>
                  <div className="text-green-400 text-sm">
                    {generatedAudio.filename}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={playAudio}
                    className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={downloadAudio}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => setGeneratedAudio(null)}
                    className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Regenerate if needed */}
              <button
                onClick={generateVoiceover}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Regenerate (if voice sounds wrong)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skip Button */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <SkipForward size={20} />
          Skip for Now & Continue
        </button>
      )}

      {/* Backend Status */}
      <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-3">
        <p className="text-blue-200 text-sm">
          <strong>Backend Required:</strong> Make sure Python server is running on localhost:5000
        </p>
        <code className="text-blue-300 text-xs block mt-1">
          cd backend && python unified_server.py
        </code>
      </div>
    </div>
  );
};

export default ElevenLabsVoiceoverUI;
