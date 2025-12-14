# Testing Guide for Integrated Content Factory

This guide provides step-by-step instructions for testing the new Integrated Content Factory features.

## Prerequisites

1. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```
   - App should run on `http://localhost:5173`

2. **Backend Setup** (for voiceover features):
   ```bash
   cd backend
   python -m venv venv
   # Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
   pip install -r requirements.txt
   # Create .env file with ELEVENLABS_API_KEY
   python voiceover_server.py
   ```
   - Backend should run on `http://localhost:5000`

3. **Environment Variables**:
   - Frontend `.env`: `VITE_CLAUDE_API_KEY` (required)
   - Backend `backend/.env`: `ELEVENLABS_API_KEY` (optional, for voiceover)

## Test Cases

### 1. Full Workflow Test

**Goal**: Test the complete automation pipeline from idea to all assets.

**Steps**:
1. Open the app and navigate to "Integrated Factory" tab
2. Enter a video idea: "How I automated my entire workflow with 3 free AI tools"
3. Select style: "Tutorial"
4. Select languages: English (default)
5. Click "RUN FULL PRODUCTION WORKFLOW"
6. Monitor the processing log for:
   - ✅ Length analysis completion
   - ✅ Script generation completion
   - ✅ Virality score calculation
   - ✅ Thumbnail concepts generation
   - ✅ CapCut template creation
   - ✅ Project auto-creation

**Expected Results**:
- Optimal length should be between 8-15 minutes
- Script should be generated with timestamps
- Virality score should be 0-100 with analysis
- Thumbnail concepts should contain 3 variants
- Template should be created
- Project should appear in Projects tab

### 2. Length Optimizer Test

**Goal**: Verify dynamic length optimization works correctly.

**Steps**:
1. Run full workflow (or manually trigger length analysis)
2. Navigate to "Length Optimizer" tab
3. Verify displayed optimal length matches analysis

**Expected Results**:
- Optimal length shown (8-15 min)
- Ad breaks count calculated correctly
- Word count estimated (~length * 150)
- Revenue multiplier shown (3-6x)

### 3. Virality Score Test

**Goal**: Test virality prediction accuracy.

**Steps**:
1. Generate a script using full workflow
2. Navigate to "Virality Score" tab
3. Review the score and analysis

**Expected Results**:
- Score displayed (0-100)
- Color coding: Green (70+), Yellow (50-69), Red (<50)
- Analysis includes:
  - Strengths (2-3 bullet points)
  - Improvements (2-3 specific fixes)
  - Predicted views (7 days)

### 4. Thumbnail Generator Test

**Goal**: Verify script-to-thumbnail concept generation.

**Steps**:
1. Generate a script first
2. Navigate to "Thumbnail Gen" tab
3. Review thumbnail concepts

**Expected Results**:
- 3 thumbnail concepts displayed
- Each concept contains:
  - Character description (for Perchance)
  - Background description
  - Text overlay
  - Color scheme
  - Emotional trigger explanation

### 5. Multi-Language Test

**Goal**: Test script translation to multiple languages.

**Steps**:
1. In Full Workflow tab, select multiple languages (e.g., English, Spanish, French)
2. Run full workflow
3. Navigate to "Multi-Language" tab
4. Review translated scripts

**Expected Results**:
- All selected languages have translated scripts
- Timestamps preserved ([MM:SS] format)
- Visual cues remain in English
- Translations maintain natural flow
- Word count similar (±10% of original)

### 6. Voiceover Generation Test

**Goal**: Test ElevenLabs voiceover integration (requires backend).

**Prerequisites**: Backend server must be running with valid ELEVENLABS_API_KEY

**Steps**:
1. Generate a script first
2. Navigate to "Voiceover" tab
3. Click "Generate Voiceover"
4. Wait for generation to complete
5. Download the MP3 file

**Expected Results**:
- Voice list fetched from backend
- Generation completes successfully
- Download link available
- MP3 file downloads correctly

**Note**: If backend is not running, should show warning message gracefully.

### 7. Export All Test

**Goal**: Verify all assets can be exported.

**Steps**:
1. Generate all assets (run full workflow + voiceover)
2. Navigate to "Export All" tab
3. Click each export button:
   - Script TXT
   - CapCut Template
   - Thumbnail Concepts
   - Voiceover MP3

**Expected Results**:
- All enabled buttons work
- Files download correctly
- File names are appropriate
- Content is correct (script matches generated, template is valid JSON, etc.)

### 8. Error Handling Test

**Goal**: Verify graceful error handling.

**Test Cases**:

**8a. Missing API Key**:
- Remove `VITE_CLAUDE_API_KEY` from `.env`
- Try to run workflow
- Expected: Error message in log, no crash

**8b. Invalid API Key**:
- Set invalid Claude API key
- Try to run workflow
- Expected: Error message in log explaining API error

**8c. Backend Not Running**:
- Stop backend server
- Try to generate voiceover
- Expected: Warning message, no crash

**8d. Network Error**:
- Disconnect internet
- Try to run workflow
- Expected: Error in log, retry logic attempts

### 9. Integration with Existing Systems

**Goal**: Verify integration with existing components.

**Steps**:
1. Generate project via Integrated Factory
2. Navigate to "Projects" tab
3. Verify project appears
4. Select project and go to "Scripts" tab
5. Verify script is displayed
6. Verify metadata is saved

**Expected Results**:
- Project created with all metadata
- Script accessible in Scripts tab
- Metadata (length, virality score, etc.) preserved
- Can edit and update project normally

### 10. UI/UX Test

**Goal**: Verify user interface works smoothly.

**Checklist**:
- [ ] All tabs switch correctly
- [ ] Processing log auto-scrolls to bottom
- [ ] Status indicators update in real-time
- [ ] Buttons disabled during processing
- [ ] Loading states visible
- [ ] Error messages clear and helpful
- [ ] Responsive design (test on different screen sizes)
- [ ] No console errors in browser dev tools

## Performance Testing

### Large Script Test
- Generate script for 15-minute video
- Verify generation completes in reasonable time (< 60 seconds)
- Verify UI remains responsive

### Multiple Language Test
- Select all 6 supported languages
- Generate workflow
- Verify all translations complete
- Total time should be acceptable (< 5 minutes)

## Troubleshooting

### Issue: "Claude API key is required"
**Solution**: Add `VITE_CLAUDE_API_KEY` to `.env` file in project root

### Issue: Voiceover generation fails
**Solution**: 
1. Check backend is running: `http://localhost:5000/api/health`
2. Verify `ELEVENLABS_API_KEY` in `backend/.env`
3. Check backend logs for errors

### Issue: Translations not generating
**Solution**: 
1. Check Claude API key is valid
2. Check API rate limits haven't been exceeded
3. Review error messages in processing log

### Issue: Project not created
**Solution**: 
1. Check browser console for errors
2. Verify localStorage is enabled
3. Check `useProjects` hook is working

## Success Criteria

All tests pass when:
- ✅ Full workflow completes end-to-end
- ✅ All tabs display correct information
- ✅ Error handling works gracefully
- ✅ Exports function correctly
- ✅ Projects integrate with existing system
- ✅ No console errors
- ✅ UI is responsive and intuitive

## Next Steps After Testing

If all tests pass:
1. Deploy backend to production (Railway, Heroku, etc.)
2. Update `VITE_ELEVENLABS_BACKEND_URL` for production
3. Test with real video ideas
4. Generate first video using all assets
5. Iterate based on results