"""
IdeaCore - Normalizes raw user input into structured representation
Acts as the foundation for all content generation decisions
"""

from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from enum import Enum


class ContentMode(str, Enum):
    """Content format types"""
    SHORT = "short"  # YouTube Shorts
    LONG_FORM = "long_form"  # Regular YouTube videos
    TUTORIAL = "tutorial"
    REACTION = "reaction"
    PODCAST_CLIP = "podcast_clip"
    COMMENTARY = "commentary"


class TimeSensitivity(str, Enum):
    """How time-sensitive the content is"""
    IMMEDIATE = "immediate"  # Must publish ASAP
    URGENT = "urgent"  # Within 24-48 hours
    TIMELY = "timely"  # Within a week
    EVERGREEN = "evergreen"  # No time pressure


class NoveltyAxis(str, Enum):
    """Type of novelty the content offers"""
    NEW_ANGLE = "new_angle"  # Fresh perspective on known topic
    NEW_TOOL = "new_tool"  # New tool/technology
    NEW_DATA = "new_data"  # New research/findings
    NEW_FORMAT = "new_format"  # New way of presenting
    CONTRARIAN = "contrarian"  # Goes against common wisdom


@dataclass
class IdeaCore:
    """
    Core structured representation of a content idea
    Normalized from raw user input with trend context reshaping
    """
    # Core claim - the main point/value proposition
    core_claim: str
    
    # Target audience description
    audience: str
    
    # Emotional hooks that resonate with audience
    emotional_hooks: List[str]
    
    # Content format
    content_mode: ContentMode
    
    # Time sensitivity
    time_sensitivity: TimeSensitivity
    
    # Type of novelty
    novelty_axis: NoveltyAxis
    
    # Additional metadata
    keywords: List[str]
    pain_points: List[str]  # Problems this solves
    value_propositions: List[str]  # Benefits offered
    
    # Trend-influenced interpretations (set after trend analysis)
    hook_pressure: Optional[float] = None  # 0-1, how aggressive hooks should be
    pacing_pressure: Optional[float] = None  # 0-1, how fast pacing should be
    claim_strength_required: Optional[float] = None  # 0-1, how bold claims need to be
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Convert enums to strings
        data['content_mode'] = self.content_mode.value
        data['time_sensitivity'] = self.time_sensitivity.value
        data['novelty_axis'] = self.novelty_axis.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'IdeaCore':
        """Create from dictionary"""
        # Convert string enums back
        if isinstance(data.get('content_mode'), str):
            data['content_mode'] = ContentMode(data['content_mode'])
        if isinstance(data.get('time_sensitivity'), str):
            data['time_sensitivity'] = TimeSensitivity(data['time_sensitivity'])
        if isinstance(data.get('novelty_axis'), str):
            data['novelty_axis'] = NoveltyAxis(data['novelty_axis'])
        return cls(**data)
    
    @classmethod
    async def from_raw_input(
        cls,
        raw_input: str,
        model_router=None,
        trend_context: Optional['TrendContext'] = None
    ) -> 'IdeaCore':
        """
        Normalize raw user input into IdeaCore
        Uses LLM to extract structured information
        
        Args:
            raw_input: Raw idea text from user
            model_router: Optional model router for LLM calls (if None, uses basic extraction)
            trend_context: Optional trend context to reshape interpretation
        """
        # If no model router, do basic extraction
        if model_router is None:
            return cls._basic_extraction(raw_input, trend_context)
        
        # Use LLM for intelligent extraction
        return await cls._llm_extraction(raw_input, model_router, trend_context)
    
    @classmethod
    def _basic_extraction(cls, raw_input: str, trend_context: Optional['TrendContext']) -> 'IdeaCore':
        """Basic extraction without LLM (fallback)"""
        # Simple keyword extraction
        keywords = [word for word in raw_input.lower().split() if len(word) > 4]
        
        # Infer content mode from keywords
        content_mode = ContentMode.LONG_FORM
        if any(kw in raw_input.lower() for kw in ['short', 'shorts', 'quick', '60 seconds']):
            content_mode = ContentMode.SHORT
        elif any(kw in raw_input.lower() for kw in ['tutorial', 'how to', 'guide', 'step']):
            content_mode = ContentMode.TUTORIAL
        elif any(kw in raw_input.lower() for kw in ['react', 'reaction', 'watching']):
            content_mode = ContentMode.REACTION
        
        # Infer time sensitivity
        time_sensitivity = TimeSensitivity.EVERGREEN
        if any(kw in raw_input.lower() for kw in ['now', 'urgent', 'breaking', 'today']):
            time_sensitivity = TimeSensitivity.IMMEDIATE
        elif any(kw in raw_input.lower() for kw in ['soon', 'this week', 'trending']):
            time_sensitivity = TimeSensitivity.TIMELY
        
        # Infer novelty
        novelty_axis = NoveltyAxis.NEW_ANGLE
        if any(kw in raw_input.lower() for kw in ['new tool', 'new app', 'new software']):
            novelty_axis = NoveltyAxis.NEW_TOOL
        elif any(kw in raw_input.lower() for kw in ['nobody talks', 'unpopular', 'contrarian']):
            novelty_axis = NoveltyAxis.CONTRARIAN
        
        return cls(
            core_claim=raw_input[:200],  # First 200 chars as claim
            audience="Productivity-obsessed millennials/Gen Z",
            emotional_hooks=["curiosity", "fear of missing out"],
            content_mode=content_mode,
            time_sensitivity=time_sensitivity,
            novelty_axis=novelty_axis,
            keywords=keywords[:10],
            pain_points=["Time waste", "Inefficiency"],
            value_propositions=["Save time", "Increase productivity"]
        )
    
    @classmethod
    async def _llm_extraction(
        cls,
        raw_input: str,
        model_router,
        trend_context: Optional['TrendContext']
    ) -> 'IdeaCore':
        """Use LLM for intelligent extraction"""
        # Build prompt with trend context if available
        trend_guidance = ""
        if trend_context:
            trend_guidance = f"""
TREND CONTEXT (use this to reshape interpretation):
- Trend velocity: {trend_context.velocity:.2f} (high = aggressive hooks needed)
- Saturation: {trend_context.saturation:.2f} (high = need stronger differentiation)
- Hook pressure: {trend_context.hook_pressure:.2f} (high = claim-based, low = curiosity-based)
- Competition density: {trend_context.competition_density:.2f}
"""
        
        prompt = f"""Extract structured information from this content idea:

{raw_input}

{trend_guidance}

Return a JSON object with these exact keys:
{{
  "core_claim": "One sentence main value proposition",
  "audience": "Target audience description",
  "emotional_hooks": ["hook1", "hook2", "hook3"],
  "content_mode": "short|long_form|tutorial|reaction|podcast_clip|commentary",
  "time_sensitivity": "immediate|urgent|timely|evergreen",
  "novelty_axis": "new_angle|new_tool|new_data|new_format|contrarian",
  "keywords": ["keyword1", "keyword2", ...],
  "pain_points": ["problem1", "problem2", ...],
  "value_propositions": ["benefit1", "benefit2", ...]
}}

Return ONLY valid JSON, no extra text."""
        
        # Call model router (assuming it has a chat method)
        try:
            if hasattr(model_router, 'chat'):
                response = await model_router.chat({
                    'task': 'idea_normalization',
                    'messages': [{'role': 'user', 'content': prompt}]
                })
            else:
                # Fallback if model_router doesn't have expected interface
                response = ""
        except Exception as e:
            print(f"LLM extraction failed: {e}, using basic extraction")
            return cls._basic_extraction(raw_input, trend_context)
        
        # Parse JSON from response
        import json
        import re
        
        try:
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parsing failed: {e}, using basic extraction")
            return cls._basic_extraction(raw_input, trend_context)
        
        # Map string values to enums
        try:
            return cls(
                core_claim=data.get('core_claim', raw_input[:200]),
                audience=data.get('audience', 'Productivity-obsessed millennials/Gen Z'),
                emotional_hooks=data.get('emotional_hooks', ['curiosity']),
                content_mode=ContentMode(data.get('content_mode', 'long_form')),
                time_sensitivity=TimeSensitivity(data.get('time_sensitivity', 'evergreen')),
                novelty_axis=NoveltyAxis(data.get('novelty_axis', 'new_angle')),
                keywords=data.get('keywords', []),
                pain_points=data.get('pain_points', []),
                value_propositions=data.get('value_propositions', [])
            )
        except (ValueError, KeyError) as e:
            print(f"Enum conversion failed: {e}, using basic extraction")
            return cls._basic_extraction(raw_input, trend_context)

