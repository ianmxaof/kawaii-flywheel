import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle, Target, DollarSign, Eye } from 'lucide-react';
import { SemanticAnalyzer } from '../../utils/semanticAnalyzer';

const QualityCombinedPanel = ({ viralityResult, semanticAnalysis, onRegenerate, onProceed }) => {
  if (!viralityResult) {
    return (
      <div className="bg-green-950/50 rounded-xl p-6 border border-green-500">
        <div className="text-center py-8">
          <TrendingUp size={48} className="text-green-400 mx-auto mb-4 animate-pulse" />
          <p className="text-green-300">Analyzing quality...</p>
        </div>
      </div>
    );
  }

  // Calculate semantic score
  const semanticAnalyzer = new SemanticAnalyzer();
  const semanticScore = semanticAnalysis 
    ? semanticAnalyzer.calculateSemanticScore(semanticAnalysis)
    : 50;

  // Combined score (60% virality, 40% semantic)
  const combinedScore = Math.round(
    (viralityResult.viralityScore * 0.6) + (semanticScore * 0.4)
  );

  const passed = combinedScore >= 60;
  const fatalFlaws = viralityResult.fatalFlaws || [];
  const improvements = viralityResult.improvements || [];

  return (
    <div className="space-y-4">
      {/* Combined Score Display */}
      <div className={`text-center p-8 rounded-xl ${
        passed
          ? 'bg-green-900/30 border-2 border-green-500'
          : 'bg-red-900/30 border-2 border-red-500'
      }`}>
        <div className={`text-7xl font-black mb-2 ${
          combinedScore >= 70 ? 'text-green-400' :
          combinedScore >= 50 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {combinedScore}/100
        </div>
        <div className="text-green-200 font-bold text-lg mb-4">
          {passed ? '✓ Ready for Production' : '✗ Needs Improvement'}
        </div>
        
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-xs text-green-300 mb-1">Virality Score</div>
            <div className="text-2xl font-bold text-green-400">
              {viralityResult.viralityScore}/100
            </div>
            <div className="text-xs text-green-400 mt-1">(60% weight)</div>
          </div>
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-xs text-purple-300 mb-1">Semantic Score</div>
            <div className="text-2xl font-bold text-purple-400">
              {semanticScore}/100
            </div>
            <div className="text-xs text-purple-400 mt-1">(40% weight)</div>
          </div>
        </div>
      </div>

      {/* Fatal Flaws */}
      {fatalFlaws.length > 0 && (
        <div className="bg-red-950/50 rounded-xl p-6 border border-red-500">
          <h3 className="text-xl font-bold text-red-200 mb-4 flex items-center gap-2">
            <AlertTriangle size={24} />
            Fatal Flaws ({fatalFlaws.length})
          </h3>
          
          <div className="space-y-2">
            {fatalFlaws.map((flaw, idx) => (
              <div 
                key={idx}
                className="bg-red-900/30 rounded-lg p-3 border border-red-700 flex items-start gap-3"
              >
                <XCircle 
                  size={20} 
                  className={`flex-shrink-0 mt-0.5 ${
                    flaw.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                  }`} 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase ${
                      flaw.severity === 'critical' ? 'text-red-300' : 'text-yellow-300'
                    }`}>
                      {flaw.severity}
                    </span>
                    <span className="text-xs text-red-400">{flaw.type}</span>
                  </div>
                  <div className="text-sm text-red-200">{flaw.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="bg-blue-950/50 rounded-xl p-6 border border-blue-500">
        <h3 className="text-xl font-bold text-blue-200 mb-4 flex items-center gap-2">
          <Target size={24} />
          Virality Breakdown
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {viralityResult.breakdown && Object.entries(viralityResult.breakdown).map(([key, value]) => (
            <div key={key} className="bg-blue-900/30 rounded-lg p-3 border border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-blue-200 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm font-bold text-blue-400">
                  {Math.round(value * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-900 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
      {improvements.length > 0 && (
        <div className="bg-yellow-950/50 rounded-xl p-6 border border-yellow-500">
          <h3 className="text-xl font-bold text-yellow-200 mb-4 flex items-center gap-2">
            <CheckCircle size={24} />
            Improvement Recommendations ({improvements.length})
          </h3>
          
          <div className="space-y-3">
            {improvements.slice(0, 5).map((imp, idx) => (
              <div 
                key={idx}
                className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    imp.priority === 'critical' ? 'bg-red-500 text-white' :
                    imp.priority === 'high' ? 'bg-yellow-500 text-black' :
                    'bg-yellow-700 text-white'
                  }`}>
                    {imp.priority}
                  </span>
                  <span className="text-xs text-yellow-400 uppercase">
                    {imp.category}
                  </span>
                </div>
                <div className="text-sm text-yellow-200 mb-2 font-bold">
                  {imp.suggestion}
                </div>
                {imp.example && (
                  <div className="text-xs text-yellow-300 bg-yellow-900/50 rounded p-2 mt-2">
                    <span className="font-bold">Example:</span> {imp.example}
                  </div>
                )}
                {imp.fix && (
                  <div className="text-xs text-yellow-400 mt-2">
                    <span className="font-bold">Fix:</span> {imp.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Prediction */}
      {viralityResult.viewPrediction && (
        <div className="bg-cyan-950/50 rounded-xl p-6 border border-cyan-500">
          <h3 className="text-xl font-bold text-cyan-200 mb-4 flex items-center gap-2">
            <Eye size={24} />
            View Prediction
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-700">
              <div className="text-xs text-cyan-300 mb-1">Week 1</div>
              <div className="text-lg font-bold text-cyan-400">
                {viralityResult.viewPrediction.week1.min.toLocaleString()} - {viralityResult.viewPrediction.week1.max.toLocaleString()}
              </div>
            </div>
            <div className="bg-cyan-900/30 rounded-lg p-4 border border-cyan-700">
              <div className="text-xs text-cyan-300 mb-1">Week 4</div>
              <div className="text-lg font-bold text-cyan-400">
                {viralityResult.viewPrediction.week4.min.toLocaleString()} - {viralityResult.viewPrediction.week4.max.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-cyan-900/30 rounded-lg p-3 border border-cyan-700">
            <div className="text-xs text-cyan-300 mb-1">Potential</div>
            <div className={`text-sm font-bold ${
              viralityResult.viewPrediction.potential === 'viral_candidate' ? 'text-green-400' :
              viralityResult.viewPrediction.potential === 'steady_growth' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {viralityResult.viewPrediction.potential.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Monetization Potential */}
      {viralityResult.monetizationPotential && (
        <div className="bg-green-950/50 rounded-xl p-6 border border-green-500">
          <h3 className="text-xl font-bold text-green-200 mb-4 flex items-center gap-2">
            <DollarSign size={24} />
            Monetization Potential
          </h3>
          
          {viralityResult.monetizationPotential.eligible ? (
            <div className="space-y-2">
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
                <div className="text-sm text-green-300 mb-1">Estimated RPM</div>
                <div className="text-2xl font-bold text-green-400">
                  ${viralityResult.monetizationPotential.estimatedRPM}
                </div>
              </div>
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
                <div className="text-sm text-green-300 mb-1">Monthly Potential (10 videos)</div>
                <div className="text-lg font-bold text-green-400">
                  ${viralityResult.monetizationPotential.monthlyPotential}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-900/30 rounded-lg p-3 border border-red-700">
              <div className="text-sm text-red-200">
                {viralityResult.monetizationPotential.reason}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!passed && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
          >
            ← Regenerate Script
          </button>
        )}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl disabled:cursor-not-allowed"
          disabled={!passed}
        >
          {passed ? 'Proceed to Voiceover →' : 'Fix Issues First'}
        </button>
      </div>
    </div>
  );
};

export default QualityCombinedPanel;
