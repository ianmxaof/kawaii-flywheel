export class CapCutTemplateGenerator {
  constructor() {
    this.fps = 60;
    this.resolution = { width: 1920, height: 1080 };
  }

  /**
   * Generate complete CapCut template from script
   * @param {Object} scriptData - Parsed script from ScriptGenerator
   * @param {string} videoIdea - Video topic
   * @returns {Object} CapCut-compatible project file
   */
  generateTemplate(scriptData, videoIdea) {
    const durationFrames = scriptData.targetMinutes * 60 * this.fps;
    
    return {
      // CapCut project metadata
      draft_info: {
        draft_id: this.generateId(),
        draft_name: this.sanitizeFilename(videoIdea),
        draft_folder: "YouTube_Automation",
        create_time: Date.now() * 1000,
        duration: durationFrames,
        fps: this.fps,
        platform: "PC",
        resolution: this.resolution
      },
      
      // Video tracks (layers)
      tracks: this.generateTracks(scriptData, durationFrames),
      
      // Audio configuration
      audio_tracks: this.generateAudioTracks(scriptData, durationFrames),
      
      // Text overlays and titles
      text_tracks: this.generateTextTracks(scriptData),
      
      // Effects and transitions
      effects: this.generateEffects(scriptData),
      
      // Materials (placeholders)
      materials: this.generateMaterialPlaceholders(),
      
      // Export settings
      export_settings: this.getExportSettings()
    };
  }

  /**
   * Generate video track structure
   */
  generateTracks(scriptData, totalDuration) {
    return [
      // Track 1: Background layer
      {
        id: "track_bg",
        type: "video",
        layer: 1,
        segments: [
          {
            id: "seg_bg_main",
            material_id: "mat_background",
            target_timerange: {
              start: 0,
              duration: totalDuration
            },
            source_timerange: {
              start: 0,
              duration: totalDuration
            },
            enable_adjust: true,
            adjustments: {
              brightness: 0.0,
              contrast: 0.1,
              saturation: 0.15
            }
          }
        ]
      },
      
      // Track 2: Screen recordings
      {
        id: "track_screen",
        type: "video",
        layer: 2,
        segments: this.generateScreenRecordingSegments(scriptData)
      },
      
      // Track 3: Anime character overlay
      {
        id: "track_character",
        type: "video",
        layer: 3,
        segments: this.generateCharacterSegments(scriptData, totalDuration)
      },
      
      // Track 4: Overlay graphics (icons, logos)
      {
        id: "track_overlays",
        type: "video",
        layer: 4,
        segments: this.generateOverlaySegments(scriptData)
      }
    ];
  }

  /**
   * Generate screen recording segments based on script sections
   */
  generateScreenRecordingSegments(scriptData) {
    const segments = [];
    
    scriptData.sections.forEach((section, index) => {
      // Skip intro and outro (first 30s and last 60s)
      if (section.totalSeconds < 30 || 
          section.totalSeconds > (scriptData.targetMinutes * 60 - 60)) {
        return;
      }
      
      const startFrame = section.totalSeconds * this.fps;
      const durationFrames = 45 * this.fps; // 45-second segments
      
      segments.push({
        id: `seg_screen_${index}`,
        material_id: `mat_screen_recording_${index + 1}`,
        target_timerange: {
          start: startFrame,
          duration: durationFrames
        },
        source_timerange: {
          start: 0,
          duration: durationFrames
        },
        enable_adjust: true,
        adjustments: {
          transform: {
            scale: 0.85,
            position: { x: 0, y: 50 }
          }
        },
        animations: [
          {
            type: "zoom_in",
            start: 0,
            duration: 30,
            easing: "ease_out"
          }
        ]
      });
    });
    
    return segments;
  }

  /**
   * Generate anime character segments
   */
  generateCharacterSegments(scriptData, totalDuration) {
    const segments = [];
    const positions = {
      bottom_right: { x: 1400, y: 600, scale: 1.0 },
      bottom_left: { x: 200, y: 600, scale: 1.0 },
      center: { x: 960, y: 540, scale: 1.2 }
    };
    
    // Main character (persistent throughout)
    segments.push({
      id: "seg_char_main",
      material_id: "mat_anime_character",
      target_timerange: {
        start: 30 * this.fps, // Start after hook
        duration: totalDuration - (90 * this.fps) // End before outro
      },
      source_timerange: {
        start: 0,
        duration: totalDuration
      },
      enable_adjust: true,
      adjustments: {
        transform: positions.bottom_right
      },
      animations: [
        {
          type: "bounce_in",
          start: 0,
          duration: 20,
          easing: "bounce"
        }
      ]
    });
    
    // Character reactions at key moments
    const reactions = [
      { time: 15, emotion: "excited", duration: 5 },
      { time: 120, emotion: "shocked", duration: 3 },
      { time: scriptData.targetMinutes * 30, emotion: "determined", duration: 4 }
    ];
    
    reactions.forEach((reaction, i) => {
      segments.push({
        id: `seg_char_reaction_${i}`,
        material_id: `mat_character_${reaction.emotion}`,
        target_timerange: {
          start: reaction.time * this.fps,
          duration: reaction.duration * this.fps
        },
        source_timerange: {
          start: 0,
          duration: reaction.duration * this.fps
        },
        enable_adjust: true,
        adjustments: {
          transform: positions.center
        },
        animations: [
          {
            type: "pop_in",
            start: 0,
            duration: 10,
            easing: "ease_out"
          }
        ]
      });
    });
    
    return segments;
  }

  /**
   * Generate overlay segments (tool logos, icons)
   */
  generateOverlaySegments(scriptData) {
    const segments = [];
    
    // Add tool logo overlays at mention points
    const toolKeywords = ['zapier', 'cursor', 'make', 'n8n', 'chatgpt', 'claude'];
    
    scriptData.sections.forEach((section, index) => {
      const lowerContent = section.content.toLowerCase();
      
      toolKeywords.forEach((tool, toolIndex) => {
        if (lowerContent.includes(tool)) {
          segments.push({
            id: `seg_overlay_${tool}_${index}`,
            material_id: `mat_icon_${tool}`,
            target_timerange: {
              start: section.totalSeconds * this.fps,
              duration: 3 * this.fps
            },
            source_timerange: {
              start: 0,
              duration: 3 * this.fps
            },
            enable_adjust: true,
            adjustments: {
              transform: {
                scale: 0.15,
                position: { 
                  x: 150 + (toolIndex * 120), 
                  y: 150 
                }
              },
              opacity: 0.9
            },
            animations: [
              {
                type: "slide_in_left",
                start: 0,
                duration: 15,
                easing: "ease_out"
              }
            ]
          });
        }
      });
    });
    
    return segments;
  }

  /**
   * Generate audio tracks
   */
  generateAudioTracks(scriptData, totalDuration) {
    return [
      // Track 1: Main voiceover
      {
        id: "audio_vo",
        type: "audio",
        layer: 1,
        segments: [
          {
            id: "seg_vo_main",
            material_id: "mat_voiceover",
            target_timerange: {
              start: 0,
              duration: totalDuration
            },
            source_timerange: {
              start: 0,
              duration: totalDuration
            },
            volume: 1.0,
            fade_in: 0,
            fade_out: 30
          }
        ]
      },
      
      // Track 2: Background music
      {
        id: "audio_bgm",
        type: "audio",
        layer: 2,
        segments: [
          // Energetic intro (0-30s)
          {
            id: "seg_bgm_intro",
            material_id: "mat_music_energetic",
            target_timerange: {
              start: 0,
              duration: 30 * this.fps
            },
            source_timerange: {
              start: 0,
              duration: 30 * this.fps
            },
            volume: 0.6,
            fade_in: 0,
            fade_out: 15
          },
          // Ambient middle section
          {
            id: "seg_bgm_main",
            material_id: "mat_music_ambient",
            target_timerange: {
              start: 30 * this.fps,
              duration: (totalDuration - (90 * this.fps))
            },
            source_timerange: {
              start: 0,
              duration: (totalDuration - (90 * this.fps))
            },
            volume: 0.25,
            fade_in: 15,
            fade_out: 15
          },
          // Energetic outro
          {
            id: "seg_bgm_outro",
            material_id: "mat_music_energetic",
            target_timerange: {
              start: (scriptData.targetMinutes * 60 - 60) * this.fps,
              duration: 60 * this.fps
            },
            source_timerange: {
              start: 0,
              duration: 60 * this.fps
            },
            volume: 0.5,
            fade_in: 15,
            fade_out: 30
          }
        ]
      },
      
      // Track 3: Sound effects
      {
        id: "audio_sfx",
        type: "audio",
        layer: 3,
        segments: this.generateSFXSegments(scriptData)
      }
    ];
  }

  /**
   * Generate sound effect segments
   */
  generateSFXSegments(scriptData) {
    const sfx = [];
    
    // Add whoosh at key moments
    const keyMoments = [0, 15, 120, scriptData.targetMinutes * 30];
    keyMoments.forEach((time, i) => {
      sfx.push({
        id: `seg_sfx_whoosh_${i}`,
        material_id: "mat_sfx_whoosh",
        target_timerange: {
          start: time * this.fps,
          duration: 1 * this.fps
        },
        volume: 0.7
      });
    });
    
    // Add anime squeals
    scriptData.sections.forEach((section, i) => {
      if (section.content.includes('*squeal*') || section.content.includes('*gasp*')) {
        sfx.push({
          id: `seg_sfx_anime_${i}`,
          material_id: "mat_sfx_kawaii_squeal",
          target_timerange: {
            start: section.totalSeconds * this.fps,
            duration: 0.5 * this.fps
          },
          volume: 0.8
        });
      }
    });
    
    return sfx;
  }

  /**
   * Generate text track overlays
   */
  generateTextTracks(scriptData) {
    const textSegments = [];
    
    // Title card (0-3 seconds)
    textSegments.push({
      id: "text_title",
      content: scriptData.videoIdea.toUpperCase(),
      style: {
        font: "Impact",
        size: 120,
        color: "#FFFF00",
        stroke: {
          width: 6,
          color: "#000000"
        },
        alignment: "center",
        position: { x: 960, y: 300 }
      },
      timerange: {
        start: 0,
        duration: 3 * this.fps
      },
      animations: [
        {
          type: "slide_in_top",
          start: 0,
          duration: 20,
          easing: "bounce"
        }
      ]
    });
    
    // Key points throughout video
    scriptData.sections.forEach((section, index) => {
      // Extract key phrases (words in ALL CAPS or between quotes)
      const keyPhrases = section.content.match(/"([^"]+)"|([A-Z]{4,})/g);
      
      if (keyPhrases && keyPhrases.length > 0) {
        keyPhrases.slice(0, 2).forEach((phrase, i) => {
          textSegments.push({
            id: `text_key_${index}_${i}`,
            content: phrase.replace(/"/g, ''),
            style: {
              font: "Arial Bold",
              size: 80,
              color: "#FFFFFF",
              stroke: {
                width: 4,
                color: "#FF1493"
              },
              alignment: "center",
              position: { x: 960, y: 800 }
            },
            timerange: {
              start: (section.totalSeconds + (i * 5)) * this.fps,
              duration: 4 * this.fps
            },
            animations: [
              {
                type: "zoom_in",
                start: 0,
                duration: 15,
                easing: "ease_out"
              }
            ]
          });
        });
      }
    });
    
    // Subscribe CTA
    textSegments.push({
      id: "text_cta",
      content: "SUBSCRIBE FOR MORE",
      style: {
        font: "Impact",
        size: 90,
        color: "#FF0000",
        stroke: {
          width: 5,
          color: "#FFFFFF"
        },
        alignment: "center",
        position: { x: 960, y: 900 }
      },
      timerange: {
        start: (scriptData.targetMinutes * 60 - 15) * this.fps,
        duration: 15 * this.fps
      },
      animations: [
        {
          type: "pulse",
          start: 0,
          duration: 900,
          easing: "linear",
          loop: true
        }
      ]
    });
    
    return textSegments;
  }

  /**
   * Generate effects timeline
   */
  generateEffects(scriptData) {
    const effects = [];
    
    // Zoom effects at key moments
    const zoomPoints = [0, 15, scriptData.targetMinutes * 30];
    zoomPoints.forEach((time, i) => {
      effects.push({
        id: `fx_zoom_${i}`,
        type: "zoom_in",
        intensity: 1.2,
        duration: 1.0,
        target_track: "track_screen",
        apply_at: time * this.fps
      });
    });
    
    // Glitch effects at ad break points
    scriptData.adBreaks.forEach((adBreak, i) => {
      effects.push({
        id: `fx_glitch_${i}`,
        type: "glitch",
        intensity: 0.5,
        duration: 0.3,
        target_track: "all_video",
        apply_at: adBreak.totalSeconds * this.fps
      });
    });
    
    // Explosion effect at hook
    effects.push({
      id: "fx_explosion_hook",
      type: "particle_explosion",
      particle_count: 100,
      duration: 2.0,
      target_track: "track_bg",
      apply_at: 0
    });
    
    return effects;
  }

  /**
   * Generate material placeholders
   */
  generateMaterialPlaceholders() {
    return {
      video: [
        { id: "mat_background", name: "Background.mp4", type: "video", placeholder: true },
        { id: "mat_anime_character", name: "Character_Main.png", type: "image", placeholder: true },
        { id: "mat_character_excited", name: "Character_Excited.png", type: "image", placeholder: true },
        { id: "mat_character_shocked", name: "Character_Shocked.png", type: "image", placeholder: true },
        { id: "mat_character_determined", name: "Character_Determined.png", type: "image", placeholder: true },
        { id: "mat_screen_recording_1", name: "Screen_Demo_1.mp4", type: "video", placeholder: true },
        { id: "mat_screen_recording_2", name: "Screen_Demo_2.mp4", type: "video", placeholder: true }
      ],
      audio: [
        { id: "mat_voiceover", name: "Voiceover.mp3", type: "audio", placeholder: true },
        { id: "mat_music_energetic", name: "BGM_Energetic.mp3", type: "audio", placeholder: true },
        { id: "mat_music_ambient", name: "BGM_Ambient.mp3", type: "audio", placeholder: true },
        { id: "mat_sfx_whoosh", name: "SFX_Whoosh.mp3", type: "audio", placeholder: true },
        { id: "mat_sfx_kawaii_squeal", name: "SFX_Kawaii.mp3", type: "audio", placeholder: true }
      ],
      images: [
        { id: "mat_icon_zapier", name: "Icon_Zapier.png", type: "image", placeholder: true },
        { id: "mat_icon_cursor", name: "Icon_Cursor.png", type: "image", placeholder: true },
        { id: "mat_icon_make", name: "Icon_Make.png", type: "image", placeholder: true }
      ]
    };
  }

  /**
   * Export settings for maximum quality
   */
  getExportSettings() {
    return {
      resolution: this.resolution,
      fps: this.fps,
      bitrate: 8000000, // 8 Mbps
      codec: "h264",
      preset: "high_quality",
      audio_bitrate: 320000, // 320 kbps
      format: "mp4"
    };
  }

  /**
   * Utility functions
   */
  generateId() {
    return 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
  }

  /**
   * Export template as JSON file
   */
  exportTemplate(template, filename) {
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '_capcut_template.json';
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

export default CapCutTemplateGenerator;

