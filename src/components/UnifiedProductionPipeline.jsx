import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, FileText, TrendingUp, Mic, Camera, Film, Download, ChevronRight, Check, X, RefreshCw, Sparkles, Play, Zap } from 'lucide-react';
import { APIConnector } from '../utils/apiConnector';
import { CapCutTemplateGenerator } from '../utils/capCutTemplateGenerator';
import { useProjects } from '../hooks/useProjects';
import ThumbnailCanvas from './Workshop/ThumbnailCanvas';
import LayerPanel from './Workshop/LayerPanel';
import TextEditor from './Workshop/TextEditor';
import ExportPanel from './Workshop/ExportPanel';
import AssetLibraryPanel from './Workshop/AssetLibraryPanel';
import { useCanvas } from '../hooks/useCanvas';

const UnifiedProductionPipeline = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [ideaBank, setIdeaBank] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [pipelineData, setPipelineData] = useState({
    script: null,
    qualityCheck: null,
    voiceover: null,
    thumbnails: [],
    selectedThumbnail: null,
    template: null,
    translations: {}
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLog, setProcessingLog] = useState([]);
  const logEndRef = useRef(null);
  const canvasRef = useRef(null);
  const canvas = useCanvas();
  const apiConnector = new APIConnector();
  const templateGenerator = new CapCutTemplateGenerator();
  const { createProject } = useProjects();

  const stages = [
    { id: 0, name: 'Ideas', icon: Lightbulb, color: 'yellow' },
    { id: 1, name: 'Script', icon: FileText, color: 'blue' },
    { id: 2, name: 'Quality', icon: TrendingUp, color: 'green' },
    { id: 3, name: 'Voice', icon: Mic, color: 'purple' },
    { id: 4, name: 'Thumbnail', icon: Camera, color: 'pink' },
    { id: 5, name: 'Template', icon: Film, color: 'indigo' },
    { id: 6, name: 'Export', icon: Download, color: 'cyan' }
  ];

  // Load idea bank from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ideaBank');
    if (saved) {
      try {
        setIdeaBank(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load idea bank:', error);
      }
    }
  }, []);

  // Save idea bank to localStorage
  useEffect(() => {
    if (ideaBank.length > 0) {
      localStorage.setItem('ideaBank', JSON.stringify(ideaBank));
    }
  }, [ideaBank]);

  // Auto-scroll log
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

  // STAGE 1: Generate Script
  const generateScript = async () => {
    if (!selectedIdea) return;
    
    setIsProcessing(true);
    addLog('🎬 Generating monetizable script...', 'processing');
    
    try {
      // First, analyze optimal length
      addLog('📊 Analyzing optimal video length...', 'processing');
      const optimalLength = await apiConnector.analyzeOptimalLength(selectedIdea.title);
      addLog(`✅ Optimal length: ${optimalLength} minutes`, 'success');
      
      // Generate script
      const script = await apiConnector.generateScript(
        selectedIdea.title,
        optimalLength,
        'tutorial' // Default style, can be made configurable
      );
      
      setPipelineData(prev => ({
        ...prev,
        script: {
          text: script.text,
          length: script.length,
          wordCount: script.wordCount,
          adBreaks: script.adBreaks
        }
      }));
      
      addLog('✅ Script generated!', 'success');
      
      // Auto-advance to quality check
      setCurrentStage(2);
      setTimeout(() => runQualityCheck(script.text, script.length), 500);
      
    } catch (error) {
      addLog(`❌ Script generation failed: ${error.message}`, 'error');
      console.error('Script generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // STAGE 2: Quality Check
  const runQualityCheck = async (scriptText, length) => {
    setIsProcessing(true);
    addLog('🔮 Analyzing virality potential...', 'processing');
    
    try {
      const viralityData = await apiConnector.predictVirality(
        { text: scriptText },
        selectedIdea.title
      );
      
      setPipelineData(prev => ({
        ...prev,
        qualityCheck: {
          score: viralityData.viralityScore,
          analysis: viralityData.analysis,
          passed: viralityData.viralityScore >= 60,
          lengthOptimal: length >= 8 && length <= 12
        }
      }));
      
      addLog(`✅ Virality Score: ${viralityData.viralityScore}/100`, viralityData.viralityScore >= 70 ? 'success' : 'warning');
      
    } catch (error) {
      addLog(`❌ Quality check failed: ${error.message}`, 'error');
      console.error('Quality check error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // STAGE 4: Generate Thumbnail Concepts
  const generateThumbnailConcepts = async () => {
    if (!pipelineData.script) return;
    
    setIsProcessing(true);
    addLog('🎨 Generating thumbnail concepts...', 'processing');
    
    try {
      const concepts = await apiConnector.generateThumbnailConcepts(pipelineData.script);
      
      setPipelineData(prev => ({
        ...prev,
        thumbnails: concepts
      }));
      
      addLog(`✅ ${concepts.length} thumbnail concepts ready`, 'success');
      
    } catch (error) {
      addLog(`❌ Thumbnail generation failed: ${error.message}`, 'error');
      console.error('Thumbnail generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // STAGE 5: Generate CapCut Template
  const generateCapCutTemplate = () => {
    if (!pipelineData.script) return;
    
    addLog('🎬 Building CapCut template...', 'processing');
    
    try {
      const template = templateGenerator.generateTemplate(
        {
          script: pipelineData.script.text,
          targetMinutes: pipelineData.script.length,
          videoIdea: selectedIdea.title,
          adBreaks: pipelineData.script.adBreaks.map(t => ({
            timestamp: `${t}:00`,
            totalSeconds: t * 60
          }))
        },
        selectedIdea.title
      );
      
      setPipelineData(prev => ({
        ...prev,
        template
      }));
      
      addLog('✅ Template ready for import', 'success');
      
    } catch (error) {
      addLog(`❌ Template generation failed: ${error.message}`, 'error');
      console.error('Template generation error:', error);
    }
  };

  // Export functions
  const exportAsset = (type, content, filename) => {
    try {
      let blob, mimeType;
      
      if (type === 'script' || type === 'text') {
        blob = new Blob([content], { type: 'text/plain' });
      } else if (type === 'json') {
        blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
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

  // Auto-create project at export stage
  useEffect(() => {
    if (currentStage === 6 && pipelineData.script && pipelineData.template) {
      try {
        createProject({
          title: selectedIdea?.title || 'Untitled Project',
          script: pipelineData.script.text,
          metadata: {
            videoLength: pipelineData.script.length,
            adBreaks: pipelineData.script.adBreaks.length,
            viralityScore: pipelineData.qualityCheck?.score,
            style: 'tutorial',
          },
          thumbnail: pipelineData.thumbnails[0]?.description,
          capCutTemplate: pipelineData.template,
        });
        addLog('📁 Project created automatically', 'success');
      } catch (error) {
        addLog(`⚠️ Failed to create project: ${error.message}`, 'error');
      }
    }
  }, [currentStage, pipelineData, selectedIdea, createProject]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-6 mb-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
            ⚡ PRODUCTION PIPELINE
          </h1>
          <p className="text-purple-300">Idea → Script → Quality → Voice → Thumbnail → Template → Export</p>
        </div>

        {/* Pipeline Progress Bar */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-4 mb-4">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setCurrentStage(stage.id)}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    currentStage === stage.id ? 'scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    currentStage > stage.id
                      ? 'bg-green-500 shadow-lg'
                      : currentStage === stage.id
                      ? `bg-${stage.color}-500 shadow-lg ring-4 ring-${stage.color}-300`
                      : 'bg-gray-700'
                  }`}>
                    {currentStage > stage.id ? (
                      <Check size={24} className="text-white" />
                    ) : (
                      <stage.icon size={24} className="text-white" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-purple-300">{stage.name}</span>
                </button>
                {idx < stages.length - 1 && (
                  <ChevronRight size={20} className="text-purple-500" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left Sidebar: Idea Bank */}
          <div className="col-span-3 bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-yellow-500 p-4 h-[calc(100vh-280px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-300 flex items-center gap-2">
                <Lightbulb size={20} />
                Idea Bank
              </h2>
              <button
                onClick={() => {
                  const title = prompt('Video idea title:');
                  if (title) {
                    const description = prompt('Brief description (optional):') || '';
                    setIdeaBank(prev => [...prev, {
                      id: Date.now(),
                      title,
                      description,
                      created: new Date().toLocaleString()
                    }]);
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm font-bold"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2">
              {ideaBank.length === 0 ? (
                <p className="text-yellow-400/50 text-sm text-center py-8">
                  No ideas yet. Click + Add to start.
                </p>
              ) : (
                ideaBank.map(idea => (
                  <button
                    key={idea.id}
                    onClick={() => {
                      setSelectedIdea(idea);
                      setCurrentStage(1);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedIdea?.id === idea.id
                        ? 'bg-yellow-600 border-2 border-yellow-400'
                        : 'bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700'
                    }`}
                  >
                    <div className="font-bold text-yellow-100 text-sm mb-1 line-clamp-2">
                      {idea.title}
                    </div>
                    <div className="text-yellow-400 text-xs">{idea.created}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Center: Main Workspace */}
          <div className="col-span-6 bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-6 h-[calc(100vh-280px)] overflow-y-auto">
            
            {/* STAGE 0: IDEAS */}
            {currentStage === 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
                  <Lightbulb size={28} />
                  Select or Create an Idea
                </h2>
                <div className="text-center py-16 text-purple-300">
                  ← Choose an idea from the bank to start production
                  <br />
                  <br />
                  or click + Add to create a new video idea
                </div>
              </div>
            )}

            {/* STAGE 1: SCRIPT GENERATION */}
            {currentStage === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-blue-300 flex items-center gap-2">
                  <FileText size={28} />
                  Script Generation
                </h2>

                {!selectedIdea ? (
                  <div className="text-center py-16 text-purple-400">
                    ← Select an idea from the bank to begin
                  </div>
                ) : !pipelineData.script ? (
                  <div>
                    <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-500 mb-4">
                      <h3 className="font-bold text-blue-200 text-lg mb-2">{selectedIdea.title}</h3>
                      <p className="text-blue-300 text-sm">{selectedIdea.description || 'No description'}</p>
                    </div>

                    <button
                      onClick={generateScript}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-xl py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={24} className="animate-spin" />
                          Generating Script...
                        </>
                      ) : (
                        <>
                          <Sparkles size={24} />
                          Generate Monetizable Script
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-blue-950/50 rounded-xl p-4 border border-blue-500 mb-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400">{pipelineData.script.length} min</div>
                          <div className="text-blue-300 text-sm">Length</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400">~{pipelineData.script.wordCount}</div>
                          <div className="text-blue-300 text-sm">Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-400">
                            {pipelineData.script.adBreaks.length}
                          </div>
                          <div className="text-blue-300 text-sm">Ad Breaks</div>
                        </div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto bg-black/40 rounded p-3">
                        <pre className="text-blue-200 text-xs font-mono whitespace-pre-wrap">
                          {pipelineData.script.text.substring(0, 1000)}...
                        </pre>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={generateScript}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
                      >
                        <RefreshCw size={18} className="inline mr-2" />
                        Regenerate
                      </button>
                      <button
                        onClick={() => setCurrentStage(2)}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                      >
                        Continue to Quality Check
                        <ChevronRight size={18} className="inline ml-2" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2: QUALITY CHECK */}
            {currentStage === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-green-300 flex items-center gap-2">
                  <TrendingUp size={28} />
                  Quality Check
                </h2>

                {!pipelineData.qualityCheck ? (
                  <div className="text-center py-16">
                    <RefreshCw size={48} className="animate-spin text-green-500 mx-auto mb-4" />
                    <p className="text-green-300">Analyzing script for virality & monetization...</p>
                  </div>
                ) : (
                  <div>
                    <div className={`text-center mb-6 p-8 rounded-xl ${
                      pipelineData.qualityCheck.passed
                        ? 'bg-green-900/30 border-2 border-green-500'
                        : 'bg-red-900/30 border-2 border-red-500'
                    }`}>
                      <div className={`text-7xl font-black mb-2 ${
                        pipelineData.qualityCheck.score >= 70 ? 'text-green-400' :
                        pipelineData.qualityCheck.score >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {pipelineData.qualityCheck.score}/100
                      </div>
                      <div className="text-green-200 font-bold">
                        {pipelineData.qualityCheck.passed ? '✓ Ready for Production' : '✗ Needs Improvement'}
                      </div>
                    </div>

                    <div className="bg-green-950/50 rounded-xl p-4 border border-green-500 mb-4">
                      <pre className="text-green-200 text-sm whitespace-pre-wrap">
                        {pipelineData.qualityCheck.analysis}
                      </pre>
                    </div>

                    <div className="flex gap-2">
                      {!pipelineData.qualityCheck.passed && (
                        <button
                          onClick={() => {
                            setCurrentStage(1);
                            setPipelineData(prev => ({ ...prev, script: null, qualityCheck: null }));
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
                        >
                          ← Regenerate Script
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentStage(3)}
                        disabled={!pipelineData.qualityCheck.passed}
                        className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl"
                      >
                        Proceed to Voiceover →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 3: VOICEOVER */}
            {currentStage === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
                  <Mic size={28} />
                  Voiceover Generation
                </h2>

                <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4 mb-4">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Voiceover generation requires Python backend running on localhost:5000
                  </p>
                </div>

                <div className="bg-purple-950/50 rounded-xl p-6 border border-purple-500">
                  <h3 className="font-bold text-purple-200 mb-4">Options:</h3>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={async () => {
                        try {
                          addLog('🎤 Fetching available voices...', 'processing');
                          const voices = await apiConnector.getVoices(true);
                          if (voices.length > 0) {
                            const result = await apiConnector.generateVoiceover(
                              pipelineData.script,
                              voices[0].voice_id,
                              'voiceover.mp3'
                            );
                            setPipelineData(prev => ({
                              ...prev,
                              voiceover: {
                                status: 'generated',
                                duration: pipelineData.script.length * 60,
                                format: 'mp3',
                                downloadUrl: result.download_url,
                                filename: 'voiceover.mp3'
                              }
                            }));
                            addLog('✅ Voiceover generated', 'success');
                          }
                        } catch (error) {
                          addLog(`❌ Voiceover failed: ${error.message}`, 'error');
                        }
                      }}
                      disabled={!pipelineData.script}
                      className="w-full bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl text-left px-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">ElevenLabs API (Recommended)</div>
                          <div className="text-sm opacity-80">AI anime-style voice, $5/month</div>
                        </div>
                        <Play size={20} />
                      </div>
                    </button>

                    <button className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 rounded-xl text-left px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">Record Your Own</div>
                          <div className="text-sm opacity-80">More authentic, free</div>
                        </div>
                        <Mic size={20} />
                      </div>
                    </button>

                    <button
                      onClick={() => setCurrentStage(4)}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                    >
                      Skip for Now & Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: THUMBNAILS */}
            {currentStage === 4 && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-pink-300 flex items-center gap-2">
                    <Camera size={28} />
                    Thumbnail Workshop
                  </h2>
                  {pipelineData.thumbnails.length === 0 && (
                    <button
                      onClick={generateThumbnailConcepts}
                      disabled={isProcessing || !pipelineData.script}
                      className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Generate Concepts
                        </>
                      )}
                    </button>
                  )}
                </div>

                {pipelineData.thumbnails.length > 0 && (
                  <div className="bg-pink-950/30 rounded-xl p-4 border border-pink-500 mb-4">
                    <h3 className="font-bold text-pink-200 mb-3">Thumbnail Concepts:</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {pipelineData.thumbnails.map(concept => (
                        <div key={concept.id} className="bg-pink-950/50 rounded-xl p-3 border border-pink-500">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-pink-200 text-sm">Concept {concept.id}</h4>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(concept.description);
                                addLog('📋 Concept copied to clipboard', 'success');
                              }}
                              className="bg-pink-600 hover:bg-pink-500 text-white px-2 py-1 rounded text-xs"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-pink-200 text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                            {concept.description.substring(0, 200)}...
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Thumbnail Workshop Layout */}
                <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
                  {/* Canvas Area */}
                  <div className="col-span-8 bg-pink-950/30 rounded-xl p-4 border border-pink-500 flex flex-col min-h-0">
                    <ThumbnailCanvas
                      canvasRef={canvasRef}
                      onImageAdd={(image) => {
                        canvas.addLayer({
                          type: 'image',
                          ...image,
                        });
                      }}
                    />
                  </div>

                  {/* Right Sidebar: Tools */}
                  <div className="col-span-4 space-y-4 overflow-y-auto">
                    <AssetLibraryPanel
                      onAssetSelect={(asset) => {
                        canvas.addLayer(asset);
                      }}
                    />
                    <LayerPanel
                      layers={canvas.layers}
                      selectedLayerId={canvas.selectedLayerId}
                      onSelectLayer={canvas.setSelectedLayerId}
                      onBringForward={canvas.bringForward}
                      onSendBackward={canvas.sendBackward}
                      onDeleteLayer={canvas.deleteLayer}
                    />
                    <TextEditor
                      layers={canvas.layers}
                      selectedLayer={canvas.selectedLayer}
                      onAddText={(textData) => canvas.addLayer({ type: 'text', ...textData })}
                      onUpdateText={canvas.updateLayer}
                    />
                    <ExportPanel
                      canvasRef={canvasRef}
                      layers={canvas.layers}
                      onSaveLayout={(layout) => {
                        const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `thumbnail_layout_${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      onLoadLayout={(layout) => {
                        console.log('Load layout:', layout);
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStage(5)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                >
                  Proceed to Template Generation →
                </button>
              </div>
            )}

            {/* STAGE 5: TEMPLATE */}
            {currentStage === 5 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-indigo-300 flex items-center gap-2">
                  <Film size={28} />
                  CapCut Template
                </h2>

                {!pipelineData.template ? (
                  <button
                    onClick={() => {
                      generateCapCutTemplate();
                      setCurrentStage(6);
                    }}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xl py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={24} />
                    Generate CapCut Template
                  </button>
                ) : (
                  <div>
                    <div className="bg-indigo-950/50 rounded-xl p-4 border border-indigo-500 mb-4">
                      <h3 className="font-bold text-indigo-200 mb-3">Template Structure:</h3>
                      <div className="space-y-2 text-indigo-300 text-sm">
                        <div>📹 Video Tracks: {pipelineData.template.tracks?.length || 0}</div>
                        <div>🎵 Audio Tracks: {pipelineData.template.audio_tracks?.length || 0}</div>
                        <div>💰 Ad Breaks: {pipelineData.script?.adBreaks.length || 0}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStage(6)}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                    >
                      Continue to Export →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 6: EXPORT */}
            {currentStage === 6 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
                  <Download size={28} />
                  Export & Production
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => pipelineData.script && exportAsset('script', pipelineData.script.text, 'script.txt')}
                    disabled={!pipelineData.script}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    Download Script
                  </button>

                  <button
                    onClick={() => pipelineData.template && exportAsset('json', pipelineData.template, 'capcut_template.json')}
                    disabled={!pipelineData.template}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Film size={20} />
                    Download Template
                  </button>

                  {pipelineData.thumbnails.length > 0 && (
                    <button
                      onClick={() => exportAsset('text', pipelineData.thumbnails.map(c => c.description).join('\n\n'), 'thumbnail_concepts.txt')}
                      className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Camera size={20} />
                      Download Concepts
                    </button>
                  )}
                </div>

                <div className="bg-cyan-950/50 rounded-xl p-6 border border-cyan-500 mt-6">
                  <h3 className="font-bold text-cyan-200 mb-4">Next Steps:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-cyan-300 text-sm">
                    <li>Import CapCut template</li>
                    <li>Add voiceover audio</li>
                    <li>Generate thumbnails in Perchance (use concepts)</li>
                    <li>Add screen recordings</li>
                    <li>Export final video</li>
                    <li>Upload to YouTube</li>
                  </ol>
                </div>

                <button
                  onClick={() => {
                    setPipelineData({
                      script: null,
                      qualityCheck: null,
                      voiceover: null,
                      thumbnails: [],
                      selectedThumbnail: null,
                      template: null,
                      translations: {}
                    });
                    canvas.clearCanvas();
                    setCurrentStage(0);
                    setSelectedIdea(null);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl"
                >
                  <RefreshCw size={20} className="inline mr-2" />
                  Start New Project
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar: Project Status */}
          <div className="col-span-3 bg-black/40 backdrop-blur-xl rounded-2xl border-2 border-purple-500 p-4 h-[calc(100vh-280px)] overflow-y-auto">
            <h2 className="text-xl font-bold text-purple-300 mb-4">Project Status</h2>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${
                selectedIdea ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Idea Selected</span>
                  {selectedIdea ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
                {selectedIdea && (
                  <div className="text-xs text-purple-300 line-clamp-2">{selectedIdea.title}</div>
                )}
              </div>

              <div className={`p-3 rounded-lg border ${
                pipelineData.script ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Script Generated</span>
                  {pipelineData.script ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
                {pipelineData.script && (
                  <div className="text-xs text-purple-300">
                    {pipelineData.script.length} min · ~{pipelineData.script.wordCount} words
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-lg border ${
                pipelineData.qualityCheck ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Quality Check</span>
                  {pipelineData.qualityCheck ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
                {pipelineData.qualityCheck && (
                  <div className="text-xs text-purple-300">
                    Score: {pipelineData.qualityCheck.score}/100
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-lg border ${
                pipelineData.voiceover ? 'border-purple-500 bg-purple-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Voiceover</span>
                  {pipelineData.voiceover ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                pipelineData.thumbnails.length > 0 ? 'border-pink-500 bg-pink-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Thumbnails</span>
                  {pipelineData.thumbnails.length > 0 ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
                {pipelineData.thumbnails.length > 0 && (
                  <div className="text-xs text-purple-300">{pipelineData.thumbnails.length} concepts</div>
                )}
              </div>

              <div className={`p-3 rounded-lg border ${
                pipelineData.template ? 'border-indigo-500 bg-indigo-900/30' : 'border-gray-700 bg-gray-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-purple-200">Template</span>
                  {pipelineData.template ? <Check size={16} className="text-green-400" /> : <X size={16} className="text-gray-500" />}
                </div>
                {pipelineData.template && (
                  <div className="text-xs text-purple-300">
                    CapCut ready
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => setCurrentStage(1)}
                disabled={!selectedIdea}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-2 rounded-lg text-sm"
              >
                Generate Script
              </button>
              <button
                onClick={() => setCurrentStage(4)}
                disabled={!pipelineData.script}
                className="w-full bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 text-white font-bold py-2 rounded-lg text-sm"
              >
                Generate Thumbnails
              </button>
              <button
                onClick={() => setCurrentStage(6)}
                disabled={!pipelineData.script}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white font-bold py-2 rounded-lg text-sm"
              >
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Processing Log */}
        {processingLog.length > 0 && (
          <div className="mt-4 bg-black/60 border border-purple-500/50 rounded-xl p-4 h-48 overflow-y-auto">
            <h3 className="font-bold text-purple-300 mb-3 text-sm flex items-center gap-2">
              <Zap size={16} />
              SYSTEM LOG
            </h3>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedProductionPipeline;