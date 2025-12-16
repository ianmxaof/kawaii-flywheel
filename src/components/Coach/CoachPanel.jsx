import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, CheckCircle, XCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/**
 * Coach Panel - Shows ONE primary actionable insight
 * Enhanced with episode tracking and manual metrics entry
 */
export default function CoachPanel({ pipelineData, onUpdateCoachSummary }) {
  const [primaryInsight, setPrimaryInsight] = useState(null);
  const [fullAnalysis, setFullAnalysis] = useState(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [showMetricsEntry, setShowMetricsEntry] = useState(false);
  const [metricsForm, setMetricsForm] = useState({
    views: '',
    ctr: '',
    avgViewDuration: '',
    shares: ''
  });

  /**
   * Fetch primary insight from backend
   */
  const fetchPrimaryInsight = async (episodeNum = null) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const episodeToAnalyze = episodeNum || currentEpisode;
      
      // Call backend to analyze episode
      const response = await fetch(`${API_BASE}/api/coach/analyze/${episodeToAnalyze}`);
      
      if (!response.ok) {
        // If episode doesn't exist, try to get learning arc
        if (response.status === 404) {
          const arcResponse = await fetch(`${API_BASE}/api/coach/learning-arc`);
          if (arcResponse.ok) {
            const arc = await arcResponse.json();
            if (arc.episodes && arc.episodes.length > 0) {
              // Use latest episode
              const latest = arc.episodes[arc.episodes.length - 1];
              setCurrentEpisode(latest.episode_num);
              // Try to get insight for latest episode
              const latestResponse = await fetch(`${API_BASE}/api/coach/analyze/${latest.episode_num}`);
              if (latestResponse.ok) {
                const analysis = await latestResponse.json();
                setPrimaryInsight(analysis.primary_insight);
                setFullAnalysis(analysis);
                setIsAnalyzing(false);
                return;
              }
            }
          }
        }
        throw new Error(`Failed to fetch insight: ${response.statusText}`);
      }

      const analysis = await response.json();
      
      // Set primary insight (the ONE thing to show)
      if (analysis.primary_insight) {
        setPrimaryInsight(analysis.primary_insight);
      } else {
        // Fallback if no primary insight
        setPrimaryInsight({
          type: 'info',
          message: 'No insights available yet. Add an episode to get started.',
          action: 'Create your first episode',
          priority: 'low'
        });
      }
      
      // Store full analysis (hidden by default)
      setFullAnalysis(analysis);
      
    } catch (err) {
      console.error('Coach analysis error:', err);
      setError(err.message || 'Failed to fetch insights. Make sure backend is running.');
      
      // Set fallback insight
      setPrimaryInsight({
        type: 'info',
        message: 'Connect to backend to get AI-powered insights',
        action: 'Start backend server and refresh',
        priority: 'low'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Submit manual metrics entry (for Episode 10)
   */
  const submitMetrics = async () => {
    if (!metricsForm.views || !metricsForm.ctr) {
      alert('Please fill in at least Views and CTR');
      return;
    }

    try {
      const actualMetrics = {
        views: parseInt(metricsForm.views),
        ctr: parseFloat(metricsForm.ctr) / 100, // Convert percentage to decimal
        avg_view_duration: parseFloat(metricsForm.avgViewDuration) || 0,
        shares: parseInt(metricsForm.shares) || 0
      };

      const response = await fetch(`${API_BASE}/api/coach/update-metrics/${currentEpisode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(actualMetrics)
      });

      if (!response.ok) {
        throw new Error('Failed to update metrics');
      }

      alert('Metrics updated successfully!');
      setShowMetricsEntry(false);
      setMetricsForm({ views: '', ctr: '', avgViewDuration: '', shares: '' });
      
      // Refresh insight
      fetchPrimaryInsight();
    } catch (err) {
      console.error('Error updating metrics:', err);
      alert('Failed to update metrics: ' + err.message);
    }
  };

  // Fetch insight on mount
  useEffect(() => {
    fetchPrimaryInsight();
  }, []);

  const getInsightColor = (type) => {
    switch (type) {
      case 'weakness':
        return 'border-red-500 bg-red-900/20';
      case 'strength':
        return 'border-green-500 bg-green-900/20';
      case 'learning':
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-purple-500 bg-purple-900/20';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'weakness':
        return <XCircle className="text-red-400" size={24} />;
      case 'strength':
        return <CheckCircle className="text-green-400" size={24} />;
      case 'learning':
        return <TrendingUp className="text-blue-400" size={24} />;
      default:
        return <Target className="text-purple-400" size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
          <Brain size={28} />
          Coach Mode
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMetricsEntry(!showMetricsEntry)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            {showMetricsEntry ? 'Cancel' : 'Add Metrics'}
          </button>
          <button
            onClick={() => fetchPrimaryInsight()}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Manual Metrics Entry Form (for Episode 10) */}
      {showMetricsEntry && (
        <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
          <h3 className="font-bold text-purple-200 mb-4">Enter Actual Metrics (Episode {currentEpisode})</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-purple-300 text-sm mb-2">Views</label>
              <input
                type="number"
                value={metricsForm.views}
                onChange={(e) => setMetricsForm({...metricsForm, views: e.target.value})}
                placeholder="1000"
                className="w-full bg-black/50 border-2 border-purple-500 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-2">CTR (%)</label>
              <input
                type="number"
                step="0.1"
                value={metricsForm.ctr}
                onChange={(e) => setMetricsForm({...metricsForm, ctr: e.target.value})}
                placeholder="5.0"
                className="w-full bg-black/50 border-2 border-purple-500 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-2">Avg View Duration (seconds)</label>
              <input
                type="number"
                value={metricsForm.avgViewDuration}
                onChange={(e) => setMetricsForm({...metricsForm, avgViewDuration: e.target.value})}
                placeholder="120"
                className="w-full bg-black/50 border-2 border-purple-500 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-2">Shares</label>
              <input
                type="number"
                value={metricsForm.shares}
                onChange={(e) => setMetricsForm({...metricsForm, shares: e.target.value})}
                placeholder="10"
                className="w-full bg-black/50 border-2 border-purple-500 rounded-lg p-2 text-white"
              />
            </div>
          </div>
          <button
            onClick={submitMetrics}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg"
          >
            Update Episode Metrics
          </button>
        </div>
      )}

      {isAnalyzing && !primaryInsight && (
        <div className="text-center py-16">
          <RefreshCw size={48} className="animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-purple-300">Analyzing your content patterns...</p>
        </div>
      )}

      {/* ONE PRIMARY INSIGHT - This is what shows by default */}
      {primaryInsight && (
        <div className={`rounded-xl p-6 border-2 ${getInsightColor(primaryInsight.type)}`}>
          <div className="flex items-start gap-4">
            {getInsightIcon(primaryInsight.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-purple-200">
                  🎯 Your Biggest Opportunity
                </h3>
                {primaryInsight.priority && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    primaryInsight.priority === 'high' ? 'bg-red-500 text-white' :
                    primaryInsight.priority === 'medium' ? 'bg-yellow-500 text-black' :
                    'bg-blue-500 text-white'
                  }`}>
                    {primaryInsight.priority}
                  </span>
                )}
              </div>
              <p className="text-purple-100 text-lg mb-3">
                {primaryInsight.message}
              </p>
              {primaryInsight.action && (
                <p className="text-purple-300 text-sm">
                  <strong>Action:</strong> {primaryInsight.action}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Analysis (Hidden by default) */}
      {fullAnalysis && (
        <div className="bg-purple-950/30 rounded-xl p-4 border border-purple-500">
          <button
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="w-full flex items-center justify-between text-purple-300 hover:text-purple-200"
          >
            <span className="text-sm font-bold">
              {showFullAnalysis ? 'Hide' : 'View'} Full Analysis
            </span>
            {showFullAnalysis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showFullAnalysis && (
            <div className="mt-4 space-y-4">
              {/* All Insights */}
              {fullAnalysis.insights && fullAnalysis.insights.length > 0 && (
                <div>
                  <h4 className="font-bold text-purple-200 mb-2">All Insights</h4>
                  <div className="space-y-2">
                    {fullAnalysis.insights.map((insight, idx) => (
                      <div key={idx} className="text-sm text-purple-300">
                        • {insight.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Metrics */}
              {fullAnalysis.predicted_metrics && (
                <div>
                  <h4 className="font-bold text-purple-200 mb-2">Predicted Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-purple-300">
                      CTR: {(fullAnalysis.predicted_metrics.ctr * 100).toFixed(2)}%
                    </div>
                    <div className="text-purple-300">
                      Retention: {(fullAnalysis.predicted_metrics.retention * 100).toFixed(2)}%
                    </div>
                    {fullAnalysis.predicted_metrics.views && (
                      <div className="text-purple-300">
                        Views: {fullAnalysis.predicted_metrics.views.expected?.toLocaleString() || 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actual Metrics (if available) */}
              {fullAnalysis.actual_metrics && (
                <div>
                  <h4 className="font-bold text-purple-200 mb-2">Actual Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-green-300">
                      Views: {fullAnalysis.actual_metrics.views?.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-green-300">
                      CTR: {(fullAnalysis.actual_metrics.ctr * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!primaryInsight && !isAnalyzing && !error && (
        <div className="text-center py-16 text-purple-400">
          <Brain size={48} className="mx-auto mb-4 opacity-50" />
          <p>No insights yet. Create an episode to get started.</p>
        </div>
      )}
    </div>
  );
}
