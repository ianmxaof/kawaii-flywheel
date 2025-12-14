import { useState, useEffect } from 'react';
import { FileText, Copy, Download, Clock, Type } from 'lucide-react';

const SCRIPT_TEMPLATE = `[HOOK - 0-3 seconds]
Nobody talks about [PROBLEM]...

[INTRO - 3-8 seconds]
Hey, it's [CHARACTER NAME], and [RELATABLE STRUGGLE]

[PROBLEM SETUP - 8-20 seconds]
So here's what was driving me insane...
[Paint the pain point they feel too]
I was spending [TIME] on [TASK] every single day

[THE DISCOVERY - 20-25 seconds]
Then I found out about [SOLUTION]
And everything changed

[THE METHOD - 25-45 seconds]
Here's exactly what I did:
Step 1: [ACTION] - [RESULT]
Step 2: [ACTION] - [RESULT]  
Step 3: [ACTION] - [RESULT]

[THE EDGY TAKE - 45-52 seconds]
Now here's what nobody tells you...
Companies don't want you to know this because...
The reason this isn't mainstream is...

[CALL TO ACTION - 52-60 seconds]
Try this and let me know what breaks
Subscribe if you want more forbidden productivity hacks
*final kawaii sound effect*`;

const WORDS_PER_SECOND = 2.5;

export default function ScriptEditor({ project, onUpdate }) {
  const [script, setScript] = useState(project?.script || '');
  const [wordCount, setWordCount] = useState(0);
  const [timeEstimate, setTimeEstimate] = useState(0);

  useEffect(() => {
    if (project?.script) {
      setScript(project.script);
    }
  }, [project]);

  useEffect(() => {
    const words = script.trim().split(/\s+/).filter(w => w.length > 0);
    const count = words.length;
    const time = count / WORDS_PER_SECOND;
    
    setWordCount(count);
    setTimeEstimate(time);
    
    if (onUpdate && project) {
      onUpdate({ script });
    }
  }, [script, onUpdate, project]);

  function handleTemplateLoad() {
    if (confirm('Load template? This will replace your current script.')) {
      setScript(SCRIPT_TEMPLATE);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(script);
    alert('Script copied to clipboard!');
  }

  function handleExport() {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.title || 'script'}_script.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const isOptimal = timeEstimate >= 55 && timeEstimate <= 65;
  const isTooShort = timeEstimate < 55;
  const isTooLong = timeEstimate > 65;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 flex items-center gap-2">
          <FileText size={24} />
          Script Editor
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTemplateLoad}
            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all flex items-center gap-2"
          >
            <Type size={14} />
            Load Template
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-black/40 border border-pink-500/30 rounded-lg p-3">
          <div className="text-pink-300/70 text-sm mb-1">Word Count</div>
          <div className="text-pink-300 font-bold text-xl">{wordCount}</div>
        </div>
        <div className={`border rounded-lg p-3 ${
          isOptimal ? 'bg-green-500/20 border-green-500' :
          isTooShort ? 'bg-yellow-500/20 border-yellow-500' :
          isTooLong ? 'bg-red-500/20 border-red-500' :
          'bg-black/40 border-pink-500/30'
        }`}>
          <div className="text-pink-300/70 text-sm mb-1 flex items-center gap-1">
            <Clock size={14} />
            Duration
          </div>
          <div className={`font-bold text-xl ${
            isOptimal ? 'text-green-400' :
            isTooShort ? 'text-yellow-400' :
            isTooLong ? 'text-red-400' :
            'text-pink-300'
          }`}>
            {timeEstimate.toFixed(1)}s
          </div>
          {!isOptimal && (
            <div className="text-xs mt-1 opacity-70">
              {isTooShort ? 'Target: 55-65s' : 'Target: 55-65s'}
            </div>
          )}
        </div>
        <div className="bg-black/40 border border-pink-500/30 rounded-lg p-3">
          <div className="text-pink-300/70 text-sm mb-1">Characters</div>
          <div className="text-pink-300 font-bold text-xl">{script.length}</div>
        </div>
      </div>

      {/* Editor */}
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Start writing your script here, or load the template..."
        className="w-full h-96 bg-black/50 border-2 border-pink-500 rounded-lg p-4 text-white placeholder-pink-300/50 font-mono text-sm resize-none"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          disabled={!script.trim()}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Copy size={16} />
          Copy to Clipboard
        </button>
        <button
          onClick={handleExport}
          disabled={!script.trim()}
          className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download size={16} />
          Export as TXT
        </button>
      </div>

      {/* Tips */}
      <div className="bg-purple-900/30 border border-pink-400 rounded-lg p-4">
        <h3 className="font-bold text-pink-300 mb-2">📝 Script Formula Tips:</h3>
        <ul className="text-pink-200 text-sm space-y-1">
          <li>• Hook (0-3s): Create curiosity gap immediately</li>
          <li>• Intro (3-8s): Relatable pain point</li>
          <li>• Method (25-45s): 3 key steps max</li>
          <li>• Edgy Take (45-52s): Contrarian but not offensive</li>
          <li>• CTA (52-60s): Clear call to action</li>
        </ul>
      </div>
    </div>
  );
}

