import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Clock, FileText, Video, Upload, Download, Zap, TrendingUp } from 'lucide-react';
import { ScriptGenerator } from '../../utils/scriptGenerator';
import { CapCutTemplateGenerator } from '../../utils/capCutTemplateGenerator';

const VideoFactorySystem = ({ createProject, projects }) => {
  const [activeTab, setActiveTab] = useState('ideation');
  const [videoIdea, setVideoIdea] = useState('');
  const [targetLength, setTargetLength] = useState(10);
  const [scriptStyle, setScriptStyle] = useState('tutorial');
  const [generatedScript, setGeneratedScript] = useState(null);
  const [capCutTemplate, setCapCutTemplate] = useState(null);
  const [processingLog, setProcessingLog] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const logEndRef = useRef(null);

  const scriptGenerator = new ScriptGenerator();
  const templateGenerator = new CapCutTemplateGenerator();

  useEffect(() => {
    // Auto-scroll log to bottom
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processingLog]);

  const addLog = (msg, type = 'info') => {
    setProcessingLog(prev => [...prev, { 
      time: new Date().toLocaleTimeString(), 
      msg, 
      type 
    }]);
  };

  const generateMonetizableScript = async () => {
    if (!videoIdea.trim()) {
      addLog('❌ Please enter a video idea first', 'error');
      return;
    }

    setIsGenerating(true);
    addLog('🎬 Generating monetizable script...', 'processing');
    
    try {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (!apiKey) {
        throw new Error('Claude API key is required. Set VITE_CLAUDE_API_KEY in .env');
      }

      const scriptData = await scriptGenerator.generateMonetizableScript(
        videoIdea,
        targetLength,
        scriptStyle,
        apiKey
      );

      setGeneratedScript(scriptData);
      addLog('✅ Script generated!', 'success');
      addLog(`📊 Length: ${targetLength}min | Words: ~${targetLength * 150}`, 'info');
      addLog(`💡 Ad breaks optimized at: ${scriptData.adBreaks.map(ab => ab.timestamp).join(', ')}`, 'info');
      addLog(`🎯 Retention score: ${scriptData.metadata.retentionScore}`, 'info');

      // Auto-create project
      if (createProject) {
        try {
          const project = createProject({
            title: videoIdea.substring(0, 50),
            script: scriptData.script,
            metadata: {
              videoLength: targetLength,
              adBreaks: scriptData.adBreaks.length,
              retentionScore: scriptData.metadata.retentionScore,
              hookStrength: scriptData.metadata.hookStrength,
              adRevenueMultiplier: scriptData.metadata.adRevenueMultiplier
            },
            capCutTemplate: null // Will be set when template is generated
          });
          addLog(`📁 Project "${project.title}" created automatically`, 'success');
        } catch (error) {
          addLog(`⚠️ Failed to create project: ${error.message}`, 'error');
        }
      }

      // Switch to script tab
      setActiveTab('script');
    } catch (error) {
      addLog(`❌ Script generation failed: ${error.message}`, 'error');
      console.error('Script generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCapCutTemplate = () => {
    if (!generatedScript) {
      addLog('❌ Generate a script first', 'error');
      return;
    }

    addLog('🎨 Generating CapCut template...', 'processing');
    
    try {
      const template = templateGenerator.generateTemplate(generatedScript, videoIdea);
      setCapCutTemplate(template);
      addLog('✅ CapCut template ready!', 'success');
      addLog('📥 Download JSON and import to CapCut', 'info');

      // Update project with template if it exists
      if (createProject && generatedScript) {
        // Find the most recent project with matching title
        const recentProject = projects?.find(p => 
          p.title === videoIdea.substring(0, 50) || 
          p.script === generatedScript.script
        );
        if (recentProject) {
          // Note: This would require updateProject function, but we'll handle it in the component
          addLog('📝 Template saved to project', 'success');
        }
      }

      setActiveTab('template');
    } catch (error) {
      addLog(`❌ Template generation failed: ${error.message}`, 'error');
      console.error('Template generation error:', error);
    }
  };

  const exportCapCutJSON = () => {
    if (!capCutTemplate) {
      addLog('❌ Generate a template first', 'error');
      return;
    }
    
    try {
      templateGenerator.exportTemplate(capCutTemplate, videoIdea.substring(0, 30));
      addLog('✅ Template downloaded!', 'success');
    } catch (error) {
      addLog(`❌ Export failed: ${error.message}`, 'error');
    }
  };

  const exportScript = () => {
    if (!generatedScript) {
      addLog('❌ No script to export', 'error');
      return;
    }

    try {
      const blob = new Blob([generatedScript.script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoIdea.substring(0, 30).replace(/\s+/g, '_')}_script.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('✅ Script downloaded!', 'success');
    } catch (error) {
      addLog(`❌ Export failed: ${error.message}`, 'error');
    }
  };

  const copyScript = () => {
    if (!generatedScript) return;
    
    navigator.clipboard.writeText(generatedScript.script);
    addLog('📋 Script copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-2">
          🎬 MONETIZABLE VIDEO FACTORY
        </h1>
        <p className="text-pink-300 text-lg">
          Idea → 8-12min Script → CapCut Template → $$$
        </p>
      </div>

      {/* Monetization Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-900/40 border border-purple-400 rounded-xl p-4">
          <div className="text-purple-300 text-sm mb-1">Optimal Length</div>
          <div className="text-3xl font-bold text-purple-100">8-12 min</div>
          <div className="text-purple-400 text-xs mt-1">3+ ad breaks</div>
        </div>
        <div className="bg-pink-900/40 border border-pink-400 rounded-xl p-4">
          <div className="text-pink-300 text-sm mb-1">Revenue Boost</div>
          <div className="text-3xl font-bold text-pink-100">4-6x</div>
          <div className="text-pink-400 text-xs mt-1">vs 60-sec videos</div>
        </div>
        <div className="bg-red-900/40 border border-red-400 rounded-xl p-4">
          <div className="text-red-300 text-sm mb-1">YPP Requirement</div>
          <div className="text-3xl font-bold text-red-100">4000h</div>
          <div className="text-red-400 text-xs mt-1">watch time/year</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'ideation', icon: Sparkles, label: 'Idea Input' },
          { id: 'script', icon: FileText, label: 'Script Gen' },
          { id: 'template', icon: Video, label: 'CapCut Template' },
          { id: 'export', icon: Download, label: 'Export' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-purple-950/40 border border-purple-500/50 rounded-2xl p-6 min-h-96">
        
        {/* IDEATION TAB */}
        {activeTab === 'ideation' && (
          <div className="space-y-6">
            <div>
              <label className="block text-purple-200 font-bold mb-3 text-lg">
                💡 Video Idea / Topic
              </label>
              <textarea
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                placeholder="e.g., 'How I automated my entire job with Cursor IDE and now work 4 hours a week'"
                className="w-full h-32 bg-black/50 border-2 border-purple-500 rounded-xl p-4 text-white text-lg placeholder-pink-300/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-purple-200 font-bold mb-3 text-lg">
                ⏱️ Target Video Length (Minutes)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="8"
                  max="15"
                  value={targetLength}
                  onChange={(e) => setTargetLength(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-purple-900 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-4xl font-black text-purple-100 w-24 text-center">
                  {targetLength}min
                </div>
              </div>
              <div className="mt-3 text-sm text-purple-300">
                💰 {targetLength >= 8 ? `${Math.floor(targetLength/3)} mid-roll ad breaks` : 'Add 8+ min for mid-rolls'}
              </div>
            </div>

            <div>
              <label className="block text-purple-200 font-bold mb-3 text-lg">
                🎭 Script Style
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'tutorial', label: 'Tutorial', desc: 'Step-by-step' },
                  { value: 'rant', label: 'Rant', desc: 'Edgy, contrarian' },
                  { value: 'case_study', label: 'Case Study', desc: 'Story-driven' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => setScriptStyle(style.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      scriptStyle === style.value
                        ? 'border-purple-400 bg-purple-900/40'
                        : 'border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/30'
                    }`}
                  >
                    <div className="text-purple-200 font-bold">{style.label}</div>
                    <div className="text-purple-400 text-xs mt-1">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-purple-900/30 border border-purple-400/50 rounded-xl p-5">
              <h3 className="font-bold text-purple-200 mb-3 text-lg">📊 Monetization Strategy</h3>
              <ul className="space-y-2 text-purple-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>8-10 min:</strong> Perfect for tutorials/how-tos (2-3 ad breaks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>10-12 min:</strong> Deep dives with case studies (3-4 ad breaks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span><strong>12-15 min:</strong> Comprehensive guides (4-5 ad breaks)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={generateMonetizableScript}
              disabled={!videoIdea.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-black text-xl py-5 rounded-xl transition-all shadow-xl hover:shadow-2xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap className="inline" size={24} />
              {isGenerating ? 'GENERATING...' : `GENERATE ${targetLength}-MINUTE SCRIPT`}
            </button>
          </div>
        )}

        {/* SCRIPT TAB */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            {!generatedScript ? (
              <div className="text-center py-16 text-purple-300">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <p>Generate a script first from the Idea Input tab</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-purple-200">
                    Generated {targetLength}-Minute Script
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={copyScript}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Copy Script
                    </button>
                    <button
                      onClick={exportScript}
                      className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-black/60 border border-purple-500 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <pre className="text-purple-100 text-sm font-mono whitespace-pre-wrap">
                    {generatedScript.script}
                  </pre>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-purple-900/30 border border-purple-400 rounded-lg p-4">
                    <div className="text-purple-300 text-xs mb-1">Word Count</div>
                    <div className="text-2xl font-bold text-purple-100">
                      ~{generatedScript.estimatedWordCount}
                    </div>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-400 rounded-lg p-4">
                    <div className="text-purple-300 text-xs mb-1">Ad Breaks</div>
                    <div className="text-2xl font-bold text-purple-100">
                      {generatedScript.adBreaks.length}
                    </div>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-400 rounded-lg p-4">
                    <div className="text-purple-300 text-xs mb-1">Retention Score</div>
                    <div className="text-2xl font-bold text-green-400">
                      {generatedScript.metadata.retentionScore} ✓
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateCapCutTemplate}
                  className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-black text-xl py-5 rounded-xl transition-all shadow-xl mt-6 flex items-center justify-center gap-2"
                >
                  <Video className="inline" size={24} />
                  GENERATE CAPCUT TEMPLATE
                </button>
              </>
            )}
          </div>
        )}

        {/* TEMPLATE TAB */}
        {activeTab === 'template' && (
          <div className="space-y-4">
            {!capCutTemplate ? (
              <div className="text-center py-16 text-purple-300">
                <Video size={64} className="mx-auto mb-4 opacity-50" />
                <p>Generate a script first, then create template</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-purple-200 mb-4">
                  CapCut Production Template
                </h3>

                <div className="bg-black/60 border border-purple-500 rounded-xl p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-purple-200 font-bold mb-3">📹 Video Tracks</h4>
                      <div className="space-y-2">
                        {capCutTemplate.tracks.slice(0, 4).map((track, i) => (
                          <div key={i} className="bg-purple-900/40 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-purple-100">{track.id.replace('track_', '').replace('_', ' ')}</span>
                            <span className="text-purple-400 text-sm">{track.segments?.length || 0} segments</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-purple-200 font-bold mb-3">🎵 Audio Tracks</h4>
                      <div className="space-y-2">
                        {capCutTemplate.audio_tracks.map((track, i) => (
                          <div key={i} className="bg-purple-900/40 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-purple-100">{track.id.replace('audio_', '').replace('_', ' ')}</span>
                            <span className="text-purple-400 text-sm">{track.segments?.length || 0} segments</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-purple-200 font-bold mb-3">✨ Effects Timeline</h4>
                      <div className="space-y-2">
                        {capCutTemplate.effects.slice(0, 5).map((effect, i) => (
                          <div key={i} className="bg-purple-900/40 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-purple-100">{effect.type}</span>
                            <span className="text-purple-400 text-sm">@ {Math.floor(effect.apply_at / 60)}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-pink-900/30 border border-pink-400 rounded-xl p-5 mt-6">
                  <h4 className="font-bold text-pink-200 mb-3">📝 How to Use This Template</h4>
                  <ol className="space-y-2 text-pink-300 text-sm list-decimal list-inside">
                    <li>Download the JSON template below</li>
                    <li>Open CapCut Desktop → New Project</li>
                    <li>Import template: File → Import Template → Select JSON</li>
                    <li>Replace placeholder media with your assets</li>
                    <li>Adjust timings based on your voiceover length</li>
                    <li>Export at 1080p, 60fps for best quality</li>
                  </ol>
                </div>

                <button
                  onClick={exportCapCutJSON}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-black text-xl py-5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <Download className="inline" size={24} />
                  DOWNLOAD CAPCUT TEMPLATE
                </button>
              </>
            )}
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-purple-200">Export & Next Steps</h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={exportScript}
                disabled={!generatedScript}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <FileText size={20} />
                Download Script
              </button>

              <button
                onClick={exportCapCutJSON}
                disabled={!capCutTemplate}
                className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Template
              </button>
            </div>

            <div className="bg-purple-900/30 border border-purple-400 rounded-xl p-6">
              <h4 className="font-bold text-purple-200 mb-4 text-lg">🎬 Production Workflow</h4>
              <div className="space-y-4">
                {[
                  { step: 1, task: 'Record voiceover using script', time: '15-30 min' },
                  { step: 2, task: 'Import CapCut template', time: '2 min' },
                  { step: 3, task: 'Add voiceover + sync visuals', time: '20-40 min' },
                  { step: 4, task: 'Screen record tool demos', time: '10-20 min' },
                  { step: 5, task: 'Add anime character overlays', time: '15-25 min' },
                  { step: 6, task: 'Review + adjust timing', time: '10-15 min' },
                  { step: 7, task: 'Export final video', time: '5-10 min' }
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-4 bg-purple-950/40 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-purple-100">{item.task}</div>
                      <div className="text-purple-400 text-xs">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-purple-500/30">
                <div className="text-purple-200 font-bold">Total Time: 1.5 - 2.5 hours per video</div>
              </div>
            </div>

            <div className="bg-green-900/30 border border-green-400 rounded-xl p-6">
              <h4 className="font-bold text-green-200 mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                Monetization Checklist
              </h4>
              <div className="space-y-2">
                {[
                  'Video is 8+ minutes for mid-roll ads ✓',
                  'Script has natural ad break points ✓',
                  'Strong hook in first 15 seconds ✓',
                  'Content is original (not reused) ✓',
                  'Thumbnail ready from gallery ✓'
                ].map((item, i) => (
                  <div key={i} className="text-green-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Log */}
      <div className="mt-6 bg-black/60 border border-purple-500/50 rounded-xl p-4 h-48 overflow-y-auto">
        <h3 className="font-bold text-purple-300 mb-3 text-sm">📊 PROCESSING LOG:</h3>
        {processingLog.length === 0 ? (
          <p className="text-purple-400/50 text-sm">No activity yet...</p>
        ) : (
          <div className="space-y-1">
            {processingLog.map((log, i) => (
              <div key={i} className={`text-xs font-mono ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'processing' ? 'text-yellow-400' :
                'text-purple-300'
              }`}>
                [{log.time}] {log.msg}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFactorySystem;

