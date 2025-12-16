import React from 'react';
import { Brain, TrendingUp, Zap, Eye, Music, AlertCircle } from 'lucide-react';

const SemanticAnalysisPanel = ({ analysis, durationMinutes }) => {
  if (!analysis) {
    return (
      <div className="bg-purple-950/50 rounded-xl p-6 border border-purple-500">
        <div className="text-center py-8">
          <Brain size={48} className="text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-purple-300">Waiting for semantic analysis...</p>
        </div>
      </div>
    );
  }

  const emotionalArc = analysis.emotional_arc || {};
  const keyMoments = analysis.key_moments || [];
  const patternInterrupts = analysis.pattern_interrupts || [];
  const voiceoverGuide = analysis.voiceover_guide || {};
  const visualSuggestions = analysis.visual_suggestions || [];

  return (
    <div className="space-y-4">
      {/* Emotional Arc Visualization */}
      <div className="bg-purple-950/50 rounded-xl p-6 border border-purple-500">
        <h3 className="text-xl font-bold text-purple-200 mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Emotional Arc
        </h3>
        
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(emotionalArc).map(([phase, data]) => (
            <div key={phase} className="bg-purple-900/30 rounded-lg p-3 border border-purple-700">
              <div className="text-xs font-bold text-purple-300 uppercase mb-2">
                {phase.replace('_', ' ')}
              </div>
              <div className="text-sm text-purple-200 mb-1">{data.emotion}</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-purple-900 rounded-full h-2">
                  <div 
                    className="bg-purple-400 h-2 rounded-full"
                    style={{ width: `${(data.energy / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-purple-400">{data.energy}/10</span>
              </div>
              <div className="text-xs text-purple-400">{data.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Moments */}
      {keyMoments.length > 0 && (
        <div className="bg-blue-950/50 rounded-xl p-6 border border-blue-500">
          <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
            <Zap size={24} />
            Key Moments ({keyMoments.length})
          </h3>
          
          <div className="space-y-2">
            {keyMoments
              .sort((a, b) => a.importance - b.importance)
              .reverse()
              .slice(0, 5)
              .map((moment, idx) => (
                <div 
                  key={idx}
                  className="bg-blue-900/30 rounded-lg p-3 border border-blue-700 flex items-start gap-3"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      moment.importance >= 9 ? 'bg-red-500 text-white' :
                      moment.importance >= 7 ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {moment.importance}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-300 uppercase">
                        {moment.type}
                      </span>
                      <span className="text-xs text-blue-400">{moment.timestamp}</span>
                    </div>
                    <div className="text-sm text-blue-200 line-clamp-2">
                      {moment.content}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Voiceover Guide */}
      {voiceoverGuide && (
        <div className="bg-green-950/50 rounded-xl p-6 border border-green-500">
          <h3 className="text-xl font-bold text-green-200 mb-4 flex items-center gap-2">
            <Music size={24} />
            Voiceover Guide
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Emphasis Points */}
            {voiceoverGuide.emphasis_points && voiceoverGuide.emphasis_points.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Emphasis Points ({voiceoverGuide.emphasis_points.length})
                </div>
                <div className="space-y-1">
                  {voiceoverGuide.emphasis_points.slice(0, 3).map((point, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{point.timestamp}</span>: {point.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pause Points */}
            {voiceoverGuide.pause_points && voiceoverGuide.pause_points.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Pause Points ({voiceoverGuide.pause_points.length})
                </div>
                <div className="space-y-1">
                  {voiceoverGuide.pause_points.slice(0, 3).map((point, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{point.timestamp}</span>: {point.duration}s pause
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Energy Levels */}
            {voiceoverGuide.energy_levels && voiceoverGuide.energy_levels.length > 0 && (
              <div>
                <div className="text-sm font-bold text-green-300 mb-2">
                  Energy Levels ({voiceoverGuide.energy_levels.length})
                </div>
                <div className="space-y-1">
                  {voiceoverGuide.energy_levels.slice(0, 3).map((level, idx) => (
                    <div key={idx} className="text-xs text-green-200 bg-green-900/30 rounded p-2">
                      <span className="font-bold">{level.timestamp}</span>: {level.level}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pattern Interrupts */}
      {patternInterrupts.length > 0 && (
        <div className="bg-yellow-950/50 rounded-xl p-6 border border-yellow-500">
          <h3 className="text-xl font-bold text-yellow-200 mb-4 flex items-center gap-2">
            <AlertCircle size={24} />
            Pattern Interrupts ({patternInterrupts.length})
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {patternInterrupts.map((interrupt, idx) => (
              <div 
                key={idx}
                className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-yellow-300 uppercase">
                    {interrupt.type}
                  </span>
                  <span className="text-xs text-yellow-400">{interrupt.timestamp}</span>
                </div>
                <div className="text-sm text-yellow-200">
                  {interrupt.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Suggestions */}
      {visualSuggestions.length > 0 && (
        <div className="bg-cyan-950/50 rounded-xl p-6 border border-cyan-500">
          <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
            <Eye size={24} />
            Visual Suggestions ({visualSuggestions.length})
          </h3>
          
          <div className="space-y-2">
            {visualSuggestions.slice(0, 5).map((suggestion, idx) => (
              <div 
                key={idx}
                className="bg-cyan-900/30 rounded-lg p-3 border border-cyan-700 flex items-start gap-3"
              >
                <div className="text-xs font-bold text-cyan-300">
                  {suggestion.timestamp}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-cyan-200">{suggestion.suggestion}</div>
                  {suggestion.duration && (
                    <div className="text-xs text-cyan-400 mt-1">
                      Duration: {suggestion.duration}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticAnalysisPanel;
