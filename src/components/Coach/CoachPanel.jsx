import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { modelRouter } from '../../utils/modelRouter';
import { useProjectPersistence } from '../../hooks/useProjectPersistence';

/**
 * Coach Panel - Analyzes last N videos to surface creator-level patterns and propose drills
 */
export default function CoachPanel({ pipelineData, onUpdateCoachSummary }) {
  const [coachSummary, setCoachSummary] = useState(pipelineData?.coachSummary || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const { projects, loadProjects } = useProjectPersistence();

  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Generate coach summary from recent projects
   */
  const analyzePatterns = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Load recent projects (last 5-10)
      const recentProjects = projects
        .slice(0, 10)
        .filter(p => p.data?.qualityCheck || p.data?.semanticAnalysis);

      if (recentProjects.length === 0) {
        setError('No projects with analysis data found. Generate a few videos first!');
        setIsAnalyzing(false);
        return;
      }

      // Build summaries for each project
      const projectSummaries = recentProjects.map(project => {
        const data = project.data || {};
        const viralityData = data.qualityCheck?.viralityData || {};
        const semanticAnalysis = data.semanticAnalysis || {};
        
        // Extract key metrics
        const hookScore = viralityData.breakdown?.hook || 0;
        const retentionScore = viralityData.breakdown?.retention || 0;
        const viralityScore = viralityData.viralityScore || 0;

        // Compress semantic analysis
        const emotionalArc = semanticAnalysis.emotional_arc 
          ? Object.keys(semanticAnalysis.emotional_arc).join(', ')
          : 'unknown';
        
        const patternInterrupts = semanticAnalysis.pattern_interrupts?.length || 0;

        return {
          title: project.name || 'Untitled',
          viralityScore,
          hookScore: Math.round(hookScore * 100),
          retentionScore: Math.round(retentionScore * 100),
          hookType: viralityData.breakdown?.hook_type || 'unknown',
          issues: viralityData.fatalFlaws?.slice(0, 2).map(f => f.message) || [],
          emotionalArc,
          patternInterrupts,
          semanticSummary: semanticAnalysis.key_moments?.slice(0, 2).map(m => m.content).join('; ') || 'N/A'
        };
      });

      // Create compressed summary for LLM (keep under 150 tokens per video)
      const compressedSummaries = projectSummaries.map(p => 
        `Video: "${p.title}" | Virality: ${p.viralityScore}/100 | Hook: ${p.hookScore}% | Retention: ${p.retentionScore}% | Issues: ${p.issues.join(', ') || 'none'} | Arc: ${p.emotionalArc} | Interrupts: ${p.patternInterrupts}`
      ).join('\n');

      // Call ModelRouter for coach analysis
      const scriptHash = modelRouter._hashString(compressedSummaries);
      const response = await modelRouter.chat({
        task: 'coach_mode',
        messages: [
          {
            role: 'user',
            content: `Here are summaries of the last ${projectSummaries.length} videos with scores and tags. Analyze them to identify recurring weaknesses and propose 2-3 targeted drills.

VIDEO SUMMARIES:
${compressedSummaries}

Provide analysis in this JSON format:
{
  "patterns": [
    {
      "issue": "weak hooks",
      "frequency": 3,
      "severity": "high",
      "description": "3 out of 5 videos have hook scores below 60%"
    }
  ],
  "drills": [
    {
      "title": "Hook Mastery Drill",
      "description": "Practice writing 5 hook variations for each video idea",
      "focus": "hook_score",
      "checklist": [
        "Write curiosity gap hook",
        "Write problem-solution hook",
        "Write pattern interrupt hook"
      ]
    }
  ],
  "recommendedHooks": [
    "Start with a surprising statistic",
    "Use pattern interrupts in first 3 seconds"
  ],
  "overallAssessment": "Your content shows strong retention but weak hooks. Focus on first 15 seconds."
}

Return ONLY valid JSON, no extra text.`
          }
        ],
        scriptHash,
        useCache: true
      });

      // Parse JSON response
      let parsed;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create basic structure from text
        parsed = {
          patterns: [
            {
              issue: 'Analysis incomplete',
              frequency: 0,
              severity: 'medium',
              description: 'Could not parse full analysis. Review your videos manually.'
            }
          ],
          drills: [
            {
              title: 'Review Recent Videos',
              description: 'Manually review your last 5 videos and identify patterns',
              focus: 'general',
              checklist: ['Watch each video', 'Note hook effectiveness', 'Check retention drops']
            }
          ],
          recommendedHooks: ['Focus on first 15 seconds', 'Use pattern interrupts'],
          overallAssessment: response.substring(0, 200)
        };
      }

      const summary = {
        ...parsed,
        analyzedAt: new Date().toISOString(),
        projectCount: projectSummaries.length
      };

      setCoachSummary(summary);
      
      // Update parent if callback provided
      if (onUpdateCoachSummary) {
        onUpdateCoachSummary(summary);
      }

    } catch (err) {
      console.error('Coach analysis error:', err);
      setError(err.message || 'Failed to analyze patterns. Try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze on mount if no summary exists
  useEffect(() => {
    if (!coachSummary && !isAnalyzing && projects.length > 0) {
      analyzePatterns();
    }
  }, [projects.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
          <Brain size={28} />
          Coach Mode
        </h2>
        <button
          onClick={analyzePatterns}
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
              Refresh Analysis
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {isAnalyzing && !coachSummary && (
        <div className="text-center py-16">
          <RefreshCw size={48} className="animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-purple-300">Analyzing your content patterns...</p>
        </div>
      )}

      {coachSummary && (
        <>
          {/* Overall Assessment */}
          <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
            <h3 className="font-bold text-purple-200 mb-3 flex items-center gap-2">
              <Target size={20} />
              Overall Assessment
            </h3>
            <p className="text-purple-300 text-sm leading-relaxed">
              {coachSummary.overallAssessment}
            </p>
            <div className="mt-4 text-xs text-purple-400">
              Analyzed {coachSummary.projectCount} videos • {new Date(coachSummary.analyzedAt).toLocaleString()}
            </div>
          </div>

          {/* Recurring Patterns */}
          {coachSummary.patterns && coachSummary.patterns.length > 0 && (
            <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
              <h3 className="font-bold text-purple-200 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Recurring Issues
              </h3>
              <div className="space-y-3">
                {coachSummary.patterns.map((pattern, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      pattern.severity === 'high'
                        ? 'border-red-500 bg-red-900/20'
                        : pattern.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-900/20'
                        : 'border-blue-500 bg-blue-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-purple-200 text-sm">{pattern.issue}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        pattern.severity === 'high'
                          ? 'bg-red-500 text-white'
                          : pattern.severity === 'medium'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {pattern.severity}
                      </span>
                    </div>
                    <p className="text-purple-300 text-xs mb-1">{pattern.description}</p>
                    <p className="text-purple-400 text-xs">Appears in {pattern.frequency} videos</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drills */}
          {coachSummary.drills && coachSummary.drills.length > 0 && (
            <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
              <h3 className="font-bold text-purple-200 mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                Targeted Drills
              </h3>
              <div className="space-y-4">
                {coachSummary.drills.map((drill, idx) => (
                  <div key={idx} className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
                    <h4 className="font-bold text-purple-200 mb-2">{drill.title}</h4>
                    <p className="text-purple-300 text-sm mb-3">{drill.description}</p>
                    {drill.checklist && drill.checklist.length > 0 && (
                      <div className="space-y-2">
                        {drill.checklist.map((item, itemIdx) => (
                          <label
                            key={itemIdx}
                            className="flex items-center gap-2 text-purple-300 text-sm cursor-pointer hover:text-purple-200"
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-purple-500 text-purple-600 focus:ring-purple-500"
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Hooks */}
          {coachSummary.recommendedHooks && coachSummary.recommendedHooks.length > 0 && (
            <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
              <h3 className="font-bold text-purple-200 mb-4">Recommended Hook Strategies</h3>
              <ul className="space-y-2">
                {coachSummary.recommendedHooks.map((hook, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-purple-300 text-sm">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!coachSummary && !isAnalyzing && !error && (
        <div className="text-center py-16 text-purple-400">
          <Brain size={48} className="mx-auto mb-4 opacity-50" />
          <p>No analysis yet. Click "Refresh Analysis" to get started.</p>
        </div>
      )}
    </div>
  );
}

