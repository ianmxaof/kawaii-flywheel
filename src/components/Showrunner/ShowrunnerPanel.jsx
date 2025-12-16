import React, { useState } from 'react';
import { Calendar, Video, Sparkles, RefreshCw, CheckCircle, Clock, Target, Plus } from 'lucide-react';
import { modelRouter } from '../../utils/modelRouter';
import { useProjects } from '../../hooks/useProjects';

/**
 * Showrunner Panel - Provides weekly content plans and multi-episode series arcs
 */
export default function ShowrunnerPanel({ ideaBank = [], onSeriesCreated }) {
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [seriesPlan, setSeriesPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [persona, setPersona] = useState('kawaii-chaos');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [videosPerWeek, setVideosPerWeek] = useState(2);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const { createProject } = useProjects();

  /**
   * Generate weekly plan
   */
  const generateWeeklyPlan = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Prepare idea summaries
      const ideaSummaries = ideaBank
        .slice(0, 20)
        .map(idea => `- "${idea.title}"${idea.description ? `: ${idea.description}` : ''}`)
        .join('\n');

      const prompt = `Generate a weekly content plan for a YouTube creator.

CONSTRAINTS:
- Hours per week: ${hoursPerWeek}
- Target videos per week: ${videosPerWeek}
- Persona: ${persona === 'kawaii-chaos' ? 'Kawaii chaos, edgy but helpful, anime automation channel' : 'Calm expert, professional, tutorial-focused'}
- Time constraints: ${hoursPerWeek} hours/week

AVAILABLE IDEAS:
${ideaSummaries || 'No ideas in bank yet'}

Generate a weekly plan in this JSON format:
{
  "weekly_plan": [
    {
      "day": "Monday",
      "tasks": [
        "Generate scripts for ideas: 'AI Automation Tool', 'Zapier Tutorial'",
        "Record voiceovers (2 hours)"
      ],
      "estimated_hours": 3
    },
    {
      "day": "Tuesday",
      "tasks": [
        "Generate thumbnails for 2 videos",
        "Edit video 1 (CapCut)"
      ],
      "estimated_hours": 4
    }
  ],
  "total_hours": ${hoursPerWeek},
  "videos_scheduled": ${videosPerWeek}
}

Return ONLY valid JSON, no extra text.`;

      const scriptHash = modelRouter._hashString(ideaSummaries + persona + hoursPerWeek + videosPerWeek);
      const response = await modelRouter.chat({
        task: 'showrunner_planning',
        messages: [{ role: 'user', content: prompt }],
        scriptHash,
        persona,
        useCache: false
      });

      // Parse JSON
      let parsed;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        parsed = {
          weekly_plan: [
            { day: 'Monday', tasks: ['Plan your week'], estimated_hours: 2 }
          ],
          total_hours: hoursPerWeek,
          videos_scheduled: videosPerWeek
        };
      }

      setWeeklyPlan(parsed);
    } catch (err) {
      console.error('Weekly plan generation error:', err);
      setError(err.message || 'Failed to generate weekly plan');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate series arc from selected ideas
   */
  const generateSeriesArc = async () => {
    if (selectedIdeas.length === 0) {
      setError('Please select at least 1-2 ideas to create a series');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ideaTexts = selectedIdeas
        .map(id => {
          const idea = ideaBank.find(i => i.id === id);
          return idea ? `"${idea.title}"${idea.description ? `: ${idea.description}` : ''}` : null;
        })
        .filter(Boolean)
        .join('\n');

      const prompt = `Generate a 3-5 episode series arc from these seed ideas:

SEED IDEAS:
${ideaTexts}

Persona: ${persona === 'kawaii-chaos' ? 'Kawaii chaos, edgy but helpful' : 'Calm expert, professional'}

Create a series plan in this JSON format:
{
  "title": "AI Automation Series",
  "description": "Complete guide to automating workflows",
  "episodes": [
    {
      "id": 1,
      "title": "Episode 1: Introduction to Automation",
      "hook": "You're wasting 10 hours a week on repetitive tasks. Here's how to automate them.",
      "length": 10,
      "key_points": ["What is automation", "Why it matters", "Basic tools"]
    },
    {
      "id": 2,
      "title": "Episode 2: Zapier Deep Dive",
      "hook": "Zapier can connect 5000+ apps. Here's how to use it like a pro.",
      "length": 12,
      "key_points": ["Zapier setup", "Common workflows", "Advanced tips"]
    }
  ],
  "total_episodes": 3,
  "estimated_total_length": 35
}

Return ONLY valid JSON, no extra text.`;

      const scriptHash = modelRouter._hashString(ideaTexts + persona);
      const response = await modelRouter.chat({
        task: 'series_architect',
        messages: [{ role: 'user', content: prompt }],
        scriptHash,
        persona,
        useCache: false
      });

      // Parse JSON
      let parsed;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        setError('Failed to parse series plan. Try again.');
        return;
      }

      setSeriesPlan(parsed);
    } catch (err) {
      console.error('Series generation error:', err);
      setError(err.message || 'Failed to generate series');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Create projects from series plan
   */
  const createSeriesProjects = async () => {
    if (!seriesPlan || !seriesPlan.episodes) {
      setError('No series plan available');
      return;
    }

    try {
      for (const episode of seriesPlan.episodes) {
        await createProject({
          title: episode.title,
          script: `[HOOK]\n${episode.hook}\n\n[KEY POINTS]\n${episode.key_points?.join('\n') || ''}`,
          metadata: {
            videoLength: episode.length || 10,
            seriesTitle: seriesPlan.title,
            episodeNumber: episode.id,
            totalEpisodes: seriesPlan.total_episodes
          },
          thumbnail: null,
          capCutTemplate: null
        });
      }

      if (onSeriesCreated) {
        onSeriesCreated(seriesPlan);
      }

      alert(`✅ Created ${seriesPlan.episodes.length} projects from series!`);
    } catch (err) {
      console.error('Failed to create series projects:', err);
      setError('Failed to create projects: ' + err.message);
    }
  };

  const toggleIdeaSelection = (ideaId) => {
    setSelectedIdeas(prev =>
      prev.includes(ideaId)
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
          <Calendar size={28} />
          AI Showrunner
        </h2>
      </div>

      {/* Configuration */}
      <div className="bg-purple-950/30 rounded-xl p-4 border border-purple-500">
        <h3 className="font-bold text-purple-200 mb-3">Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-purple-300 text-sm mb-1">Persona</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-black/40 border border-purple-500 rounded-lg px-3 py-2 text-purple-100"
            >
              <option value="kawaii-chaos">Kawaii Chaos</option>
              <option value="calm-expert">Calm Expert</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-purple-300 text-sm mb-1">Hours/Week</label>
              <input
                type="number"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 10)}
                className="w-full bg-black/40 border border-purple-500 rounded-lg px-3 py-2 text-purple-100"
                min="1"
                max="40"
              />
            </div>
            <div>
              <label className="block text-purple-300 text-sm mb-1">Videos/Week</label>
              <input
                type="number"
                value={videosPerWeek}
                onChange={(e) => setVideosPerWeek(parseInt(e.target.value) || 2)}
                className="w-full bg-black/40 border border-purple-500 rounded-lg px-3 py-2 text-purple-100"
                min="1"
                max="10"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Weekly Plan Section */}
      <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-purple-200 flex items-center gap-2">
            <Calendar size={20} />
            Weekly Plan
          </h3>
          <button
            onClick={generateWeeklyPlan}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Plan
              </>
            )}
          </button>
        </div>

        {weeklyPlan && (
          <div className="space-y-3">
            {weeklyPlan.weekly_plan?.map((day, idx) => (
              <div key={idx} className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-purple-200">{day.day}</h4>
                  <span className="text-purple-400 text-xs flex items-center gap-1">
                    <Clock size={14} />
                    {day.estimated_hours || 0}h
                  </span>
                </div>
                <ul className="space-y-1">
                  {day.tasks?.map((task, taskIdx) => (
                    <li key={taskIdx} className="text-purple-300 text-sm flex items-start gap-2">
                      <CheckCircle size={14} className="mt-0.5 text-purple-500 flex-shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="text-xs text-purple-400 mt-4">
              Total: {weeklyPlan.total_hours || 0} hours • {weeklyPlan.videos_scheduled || 0} videos
            </div>
          </div>
        )}
      </div>

      {/* Series Architect Section */}
      <div className="bg-purple-950/30 rounded-xl p-6 border border-purple-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-purple-200 flex items-center gap-2">
            <Video size={20} />
            Series Architect
          </h3>
        </div>

        {/* Idea Selection */}
        {ideaBank.length > 0 && (
          <div className="mb-4">
            <label className="block text-purple-300 text-sm mb-2">Select 1-2 seed ideas:</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {ideaBank.slice(0, 10).map(idea => (
                <label
                  key={idea.id}
                  className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-900/30"
                >
                  <input
                    type="checkbox"
                    checked={selectedIdeas.includes(idea.id)}
                    onChange={() => toggleIdeaSelection(idea.id)}
                    className="w-4 h-4 rounded border-purple-500 text-purple-600"
                  />
                  <span className="text-purple-300 text-sm flex-1">{idea.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generateSeriesArc}
          disabled={isGenerating || selectedIdeas.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mb-4"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Generating Series...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Series Arc
            </>
          )}
        </button>

        {seriesPlan && (
          <div className="space-y-4">
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
              <h4 className="font-bold text-purple-200 mb-1">{seriesPlan.title}</h4>
              <p className="text-purple-300 text-sm mb-3">{seriesPlan.description}</p>
              <div className="text-xs text-purple-400">
                {seriesPlan.total_episodes || seriesPlan.episodes?.length || 0} episodes • ~{seriesPlan.estimated_total_length || 0} min total
              </div>
            </div>

            <div className="space-y-3">
              {seriesPlan.episodes?.map(episode => (
                <div key={episode.id} className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-bold text-purple-200">
                      Episode {episode.id}: {episode.title}
                    </h5>
                    <span className="text-purple-400 text-xs">{episode.length || 10} min</span>
                  </div>
                  <p className="text-purple-300 text-sm mb-2 italic">"{episode.hook}"</p>
                  {episode.key_points && episode.key_points.length > 0 && (
                    <ul className="space-y-1">
                      {episode.key_points.map((point, idx) => (
                        <li key={idx} className="text-purple-400 text-xs flex items-start gap-2">
                          <span className="text-purple-500">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={createSeriesProjects}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create {seriesPlan.episodes?.length || 0} Projects from Series
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

