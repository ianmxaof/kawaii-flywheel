import React, { useState, useRef, useEffect } from 'react';
import { Camera, Sparkles, Film, Globe, TrendingUp, Zap, Mic, Download, Upload, Clock, BarChart3, FileText } from 'lucide-react';
import { APIConnector } from '../utils/apiConnector';
import { CapCutTemplateGenerator } from '../utils/capCutTemplateGenerator';

const IntegratedContentFactory = ({ createProject, projects }) => {
  const [activeTab, setActiveTab] = useState('workflow');
  const [currentProject, setCurrentProject] = useState({
    idea: '',
    targetLength: 10,
    style: 'tutorial',
    languages: ['en'],
    script: null,
    thumbnail: null,
    template: null,
    voiceover: null,
    analytics: null,
    translations: null,
    optimalLength: null
  });
  const [processingLog, setProcessingLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logEndRef = useRef(null);
  const apiConnector = new APIConnector();
  const templateGenerator = new CapCutTemplateGenerator();

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processingLog]);

  const addLog = (msg, type = 'info') => {
    setProcessingLog(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      msg,
      type
    }]);
  };

  // FULL WORKFLOW: Idea → Script → Thumbnail → Template → Upload
  const runFullWorkflow = async () => {
    if (!currentProject.idea.trim()) {
      addLog('❌ Please enter a video idea first', 'error');
      return;
    }

    setIsProcessing(true);
    addLog('🚀 Starting full production workflow...', 'processing');
    
    try {
      // Step 1: Analyze & Optimize Length
      addLog('📊 Analyzing optimal video length...', 'processing');
      const optimalLength = await apiConnector.analyzeOptimalLength(currentProject.idea);
      setCurrentProject(prev => ({ ...prev, targetLength: optimalLength, optimalLength }));
      addLog(`✅ Optimal length: ${optimalLength} minutes`, 'success');
      
      // Step 2: Generate Script
      addLog('✍️ Generating monetizable script...', 'processing');
      const script = await apiConnector.generateScript(
        currentProject.idea,
        optimalLength,
        currentProject.style
      );
      setCurrentProject(prev => ({ ...prev, script }));
      addLog('✅ Script generated with ad breaks', 'success');
      
      // Step 3: Predict Virality
      addLog('🔮 Calculating virality score...', 'processing');
      const viralityData = await apiConnector.predictVirality(script, currentProject.idea);
      setCurrentProject(prev => ({ ...prev, analytics: viralityData }));
      addLog(`✅ Virality Score: ${viralityData.viralityScore}/100`, viralityData.viralityScore >= 70 ? 'success' : 'warning');
      
      // Step 4: Generate Thumbnail Concepts
      addLog('🎨 Creating thumbnail concepts...', 'processing');
      const thumbnailConcepts = await apiConnector.generateThumbnailConcepts(script);
      setCurrentProject(prev => ({ ...prev, thumbnail: thumbnailConcepts[0] || null }));
      addLog(`✅ ${thumbnailConcepts.length} thumbnail variants ready`, 'success');
      
      // Step 5: Multi-Language Scripts
      if (currentProject.languages.length > 1) {
        addLog('🌍 Translating to additional languages...', 'processing');
        const translations = await apiConnector.translateScript(script, currentProject.languages);
        setCurrentProject(prev => ({ ...prev, translations }));
        addLog(`✅ Translated to ${currentProject.languages.length} languages`, 'success');
      }
      
      // Step 6: Generate CapCut Template
      addLog('🎬 Building CapCut template...', 'processing');
      const template = templateGenerator.generateTemplate(script, currentProject.idea);
      setCurrentProject(prev => ({ ...prev, template }));
      addLog('✅ Template ready for import', 'success');
      
      // Step 7: Generate Voiceover (optional, requires backend)
      if (currentProject.languages.includes('en')) {
        addLog('🎤 Voiceover generation available via Voiceover tab', 'info');
      }
      
      // Auto-create project
      if (createProject) {
        try {
          createProject({
            title: currentProject.idea.substring(0, 50),
            script: script.text,
            metadata: {
              videoLength: optimalLength,
              adBreaks: script.adBreaks.length,
              viralityScore: viralityData.viralityScore,
              style: currentProject.style,
              languages: currentProject.languages,
            },
            thumbnail: thumbnailConcepts[0]?.description,
            capCutTemplate: template,
            translations: currentProject.translations,
          });
          addLog('📁 Project created automatically', 'success');
        } catch (error) {
          addLog(`⚠️ Failed to create project: ${error.message}`, 'error');
        }
      }
      
      addLog('🎉 WORKFLOW COMPLETE! Ready for production', 'success');
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      console.error('Workflow error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateVoiceover = async () => {
    if (!currentProject.script) {
      addLog('❌ Generate a script first', 'error');
      return;
    }

    try {
      addLog('🎤 Fetching available voices...', 'processing');
      const voices = await apiConnector.getVoices(true); // Get anime voices
      
      if (voices.length === 0) {
        addLog('⚠️ No voices available. Check backend connection.', 'warning');
        return;
      }

      const defaultVoiceId = voices[0].voice_id;
      addLog(`🎙️ Generating voiceover with voice: ${voices[0].name}...`, 'processing');
      
      const result = await apiConnector.generateVoiceover(
        currentProject.script,
        defaultVoiceId,
        'voiceover.mp3'
      );

      setCurrentProject(prev => ({
        ...prev,
        voiceover: {
          status: 'generated',
          duration: currentProject.targetLength * 60,
          format: 'mp3',
          downloadUrl: result.download_url,
          filename: 'voiceover.mp3'
        }
      }));

      addLog('✅ Voiceover audio ready', 'success');
    } catch (error) {
      addLog(`❌ Voiceover generation failed: ${error.message}`, 'error');
      console.error('Voiceover error:', error);
    }
  };

  const exportAsset = (type, content, filename) => {
    try {
      let blob, mimeType;
      
      if (type === 'script' || type === 'text') {
        blob = new Blob([content], { type: 'text/plain' });
        mimeType = 'text/plain';
      } else if (type === 'json') {
        blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
        mimeType = 'application/json';
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      addLog(`✅ ${filename} downloaded`, 'success');
    } catch (error) {
      addLog(`❌ Export failed: ${error.message}`, 'error');
    }
  };

  const workflowSteps = [
    { step: 'Length Analysis', icon: BarChart3, status: processingLog.some(l => l.msg.includes('Optimal length')) },
    { step: 'Script Generation', icon: FileText, status: processingLog.some(l => l.msg.includes('Script generated')) },
    { step: 'Virality Prediction', icon: TrendingUp, status: processingLog.some(l => l.msg.includes('Virality Score')) },
    { step: 'Thumbnail Concepts', icon: Camera, status: processingLog.some(l => l.msg.includes('thumbnail')) },
    { step: 'Multi-Language', icon: Globe, status: processingLog.some(l => l.msg.includes('Translated')) },
    { step: 'CapCut Template', icon: Film, status: processingLog.some(l => l.msg.includes('Template ready')) },
    { step: 'Voiceover Gen', icon: Mic, status: currentProject.voiceover !== null }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border-2 border-purple-500 p-8 mb-6 shadow-2xl">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3">
            🚀 INTEGRATED CONTENT FACTORY
          </h1>
          <p className="text-purple-300 text-lg">
            Idea → Script → Thumbnail → Template → Voiceover → Upload (Full Automation)
          </p>
        </div>

        {/* Main Tabs */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border-2 border-purple-500 p-6 shadow-2xl">
          
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'workflow', icon: Zap, label: 'Full Workflow' },
              { id: 'optimizer', icon: BarChart3, label: 'Length Optimizer' },
              { id: 'virality', icon: TrendingUp, label: 'Virality Score' },
              { id: 'thumbnail', icon: Camera, label: 'Thumbnail Gen' },
              { id: 'multilang', icon: Globe, label: 'Multi-Language' },
              { id: 'voiceover', icon: Mic, label: 'Voiceover' },
              { id: 'export', icon: Download, label: 'Export All' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* FULL WORKFLOW TAB */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-2 border-purple-400 rounded-2xl p-6">
                <h2 className="text-3xl font-bold text-purple-100 mb-4 flex items-center gap-3">
                  <Sparkles className="text-yellow-400" />
                  One-Click Video Production
                </h2>
                <p className="text-purple-300 mb-6">
                  Enter your video idea below. The system will automatically analyze optimal length, generate script, predict virality, create thumbnails, build CapCut template, and prepare for voiceover.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-200 font-bold mb-2">Video Idea</label>
                    <textarea
                      value={currentProject.idea}
                      onChange={(e) => setCurrentProject(prev => ({ ...prev, idea: e.target.value }))}
                      placeholder="e.g., 'How I automated my entire workflow with 3 free AI tools and now work 4 hours a week'"
                      className="w-full h-24 bg-black/50 border-2 border-purple-500 rounded-xl p-4 text-white text-lg placeholder-purple-400/50 resize-none"
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 font-bold mb-2">Content Style</label>
                      <select
                        value={currentProject.style}
                        onChange={(e) => setCurrentProject(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full bg-black/50 border-2 border-purple-500 rounded-xl p-3 text-white"
                        disabled={isProcessing}
                      >
                        <option value="tutorial">Tutorial (Step-by-step)</option>
                        <option value="rant">Rant (Edgy/Contrarian)</option>
                        <option value="case_study">Case Study (Story-driven)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-purple-200 font-bold mb-2">Languages</label>
                      <select
                        multiple
                        value={currentProject.languages}
                        onChange={(e) => setCurrentProject(prev => ({
                          ...prev,
                          languages: Array.from(e.target.selectedOptions, opt => opt.value)
                        }))}
                        className="w-full bg-black/50 border-2 border-purple-500 rounded-xl p-3 text-white"
                        disabled={isProcessing}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={runFullWorkflow}
                    disabled={!currentProject.idea || isProcessing}
                    className="w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:via-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-2xl py-6 rounded-xl transition-all shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <Zap size={32} />
                    {isProcessing ? 'PROCESSING...' : 'RUN FULL PRODUCTION WORKFLOW'}
                  </button>
                </div>
              </div>

              {/* Progress Visualization */}
              {processingLog.length > 0 && (
                <div className="bg-black/60 border-2 border-purple-500/50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-purple-200 mb-4">Production Pipeline</h3>
                  <div className="space-y-3">
                    {workflowSteps.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 bg-purple-950/40 rounded-lg p-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status ? 'bg-green-500' : 'bg-purple-800'
                        }`}>
                          {item.status ? '✓' : <item.icon size={20} className="text-purple-300" />}
                        </div>
                        <div className="flex-1">
                          <div className={`font-bold ${item.status ? 'text-green-400' : 'text-purple-300'}`}>
                            {item.step}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LENGTH OPTIMIZER TAB */}
          {activeTab === 'optimizer' && (
            <div className="space-y-6">
              <div className="bg-purple-900/30 border border-purple-400 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                  <Clock size={28} />
                  Dynamic Length Optimizer
                </h2>
                <p className="text-purple-300 mb-4">
                  AI analyzes your topic and determines the perfect video length for maximum engagement and monetization.
                </p>

                {currentProject.optimalLength ? (
                  <div className="bg-black/40 rounded-lg p-6 border border-purple-500">
                    <div className="text-center mb-4">
                      <div className="text-6xl font-black text-purple-400 mb-2">
                        {currentProject.optimalLength} min
                      </div>
                      <div className="text-purple-300">Optimal Length</div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-purple-950/50 rounded-lg p-3 text-center">
                        <div className="text-purple-300 text-sm mb-1">Ad Breaks</div>
                        <div className="text-2xl font-bold text-purple-100">
                          {Math.floor(currentProject.optimalLength / 3)}
                        </div>
                      </div>
                      <div className="bg-purple-950/50 rounded-lg p-3 text-center">
                        <div className="text-purple-300 text-sm mb-1">Word Count</div>
                        <div className="text-2xl font-bold text-purple-100">
                          ~{currentProject.optimalLength * 150}
                        </div>
                      </div>
                      <div className="bg-purple-950/50 rounded-lg p-3 text-center">
                        <div className="text-purple-300 text-sm mb-1">Revenue</div>
                        <div className="text-2xl font-bold text-green-400">
                          {currentProject.optimalLength >= 10 ? '5-6x' : '3-4x'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-purple-300 text-center py-8">
                    Run the full workflow to get length optimization
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VIRALITY SCORE TAB */}
          {activeTab === 'virality' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-pink-900/40 to-red-900/40 border-2 border-pink-400 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-pink-100 mb-4 flex items-center gap-2">
                  <TrendingUp size={28} />
                  Virality Predictor
                </h2>

                {currentProject.analytics ? (
                  <div>
                    <div className="text-center mb-6">
                      <div className={`text-7xl font-black mb-2 ${
                        currentProject.analytics.viralityScore >= 70 ? 'text-green-400' :
                        currentProject.analytics.viralityScore >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {currentProject.analytics.viralityScore}/100
                      </div>
                      <div className="text-pink-300">Virality Score</div>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-pink-500">
                      <pre className="text-pink-200 text-sm whitespace-pre-wrap">
                        {currentProject.analytics.analysis}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-pink-300 text-center py-8">
                    Run the full workflow to get virality prediction
                  </p>
                )}
              </div>
            </div>
          )}

          {/* THUMBNAIL GENERATOR TAB */}
          {activeTab === 'thumbnail' && (
            <div className="space-y-6">
              <div className="bg-cyan-900/30 border border-cyan-400 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
                  <Camera size={28} />
                  Script-to-Thumbnail Generator
                </h2>

                {currentProject.thumbnail ? (
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-lg p-6 border border-cyan-500">
                      <pre className="text-cyan-200 text-sm whitespace-pre-wrap">
                        {currentProject.thumbnail.description}
                      </pre>
                    </div>

                    <div className="bg-cyan-950/40 rounded-lg p-4">
                      <h3 className="text-cyan-300 font-bold mb-2">Next Steps:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-cyan-200 text-sm">
                        <li>Copy character description to Perchance</li>
                        <li>Copy background description to Perchance</li>
                        <li>Generate both images</li>
                        <li>Import to Thumbnail Workshop</li>
                        <li>Add text overlay as specified</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <p className="text-cyan-300 text-center py-8">
                    Generate script first to create thumbnail concepts
                  </p>
                )}
              </div>
            </div>
          )}

          {/* MULTI-LANGUAGE TAB */}
          {activeTab === 'multilang' && (
            <div className="space-y-6">
              <div className="bg-green-900/30 border border-green-400 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-green-100 mb-4 flex items-center gap-2">
                  <Globe size={28} />
                  Multi-Language Script Generator
                </h2>

                {currentProject.translations ? (
                  <div className="space-y-4">
                    {Object.entries(currentProject.translations).map(([lang, script]) => (
                      <div key={lang} className="bg-black/40 rounded-lg p-4 border border-green-500">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-green-300 font-bold text-lg">
                            {lang.toUpperCase()} Version
                          </h3>
                          <button
                            onClick={() => exportAsset('script', script, `script_${lang}.txt`)}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="text-green-200 text-sm max-h-40 overflow-y-auto">
                          {script ? script.substring(0, 500) + '...' : 'Translation failed'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-green-300 text-center py-8">
                    Select multiple languages in workflow and run generation
                  </p>
                )}
              </div>
            </div>
          )}

          {/* VOICEOVER TAB */}
          {activeTab === 'voiceover' && (
            <div className="space-y-6">
              <div className="bg-indigo-900/30 border border-indigo-400 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-indigo-100 mb-4 flex items-center gap-2">
                  <Mic size={28} />
                  ElevenLabs Voiceover Generator
                </h2>

                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-4">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Voiceover generation requires ElevenLabs API key and Python backend running on port 5000.
                  </p>
                </div>

                {currentProject.voiceover ? (
                  <div className="bg-black/40 rounded-lg p-6 border border-indigo-500">
                    <div className="text-indigo-200 mb-4">
                      <div className="mb-2">Status: <span className="text-green-400 font-bold">Generated</span></div>
                      <div className="mb-2">Duration: {currentProject.voiceover.duration}s</div>
                      <div>Format: {currentProject.voiceover.format}</div>
                    </div>
                    <button 
                      onClick={() => apiConnector.downloadVoiceover(currentProject.voiceover.filename)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded"
                    >
                      Download MP3
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-indigo-300 mb-4">
                      {currentProject.script ? 'Click below to generate voiceover from your script' : 'Generate a script first in the Full Workflow tab'}
                    </p>
                    <button
                      onClick={generateVoiceover}
                      disabled={!currentProject.script}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl"
                    >
                      Generate Voiceover
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-100 mb-4">Export All Assets</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => currentProject.script && exportAsset('script', currentProject.script.text, 'script.txt')}
                  disabled={!currentProject.script}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Script TXT
                </button>

                <button
                  onClick={() => currentProject.template && exportAsset('json', currentProject.template, 'capcut_template.json')}
                  disabled={!currentProject.template}
                  className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  CapCut Template
                </button>

                <button
                  onClick={() => currentProject.thumbnail && exportAsset('text', currentProject.thumbnail.description, 'thumbnail_concepts.txt')}
                  disabled={!currentProject.thumbnail}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Thumbnail Concepts
                </button>

                <button
                  disabled={!currentProject.voiceover}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Voiceover MP3
                </button>
              </div>

              <div className="bg-purple-900/30 border border-purple-400 rounded-xl p-6 mt-6">
                <h3 className="text-purple-200 font-bold mb-3">Production Checklist</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Script generated', complete: !!currentProject.script },
                    { label: 'Thumbnail concepts ready', complete: !!currentProject.thumbnail },
                    { label: 'CapCut template exported', complete: !!currentProject.template },
                    { label: 'Voiceover generated', complete: !!currentProject.voiceover },
                    { label: 'Virality score analyzed', complete: !!currentProject.analytics }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded ${item.complete ? 'bg-green-500' : 'bg-gray-600'}`}>
                        {item.complete && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={item.complete ? 'text-green-400' : 'text-purple-400'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Log */}
        <div className="mt-6 bg-black/60 border border-purple-500/50 rounded-xl p-4 h-64 overflow-y-auto">
          <h3 className="font-bold text-purple-300 mb-3 text-sm flex items-center gap-2">
            <Zap size={16} />
            SYSTEM LOG
          </h3>
          {processingLog.length === 0 ? (
            <p className="text-purple-400/50 text-sm">Waiting for workflow to start...</p>
          ) : (
            <div className="space-y-1">
              {processingLog.map((log, i) => (
                <div key={i} className={`text-xs font-mono ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'processing' ? 'text-cyan-400' :
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
    </div>
  );
};

export default IntegratedContentFactory;