"""
CognitiveLoadBudget - Calculates optimal number of decisions to present
Based on trend confidence, urgency, and user experience level
"""

from dataclasses import dataclass
from typing import Optional
from .trend_context import TrendContext
from .idea_core import IdeaCore, TimeSensitivity


@dataclass
class CognitiveLoadBudget:
    """
    Calculates how many decisions/recommendations to show user
    Prevents cognitive overload while maintaining decision quality
    """
    base_decisions: int = 3  # Minimum decisions
    max_decisions: int = 7  # Maximum decisions
    
    def calculate(
        self,
        trend_context: TrendContext,
        idea_core: IdeaCore,
        user_experience_level: str = "intermediate"  # "beginner", "intermediate", "expert"
    ) -> int:
        """
        Calculate optimal number of decisions to present
        
        Args:
            trend_context: Trend context with confidence metrics
            idea_core: Idea core with time sensitivity
            user_experience_level: User's experience level
        
        Returns:
            Number of decisions (3-7)
        """
        # Start with base
        decisions = self.base_decisions
        
        # Adjust based on trend confidence
        # High confidence → fewer decisions (system is more certain)
        # Low confidence → more decisions (need more exploration)
        if trend_context.trend_confidence > 0.9:
            confidence_multiplier = 1.0  # Keep at base
        elif trend_context.trend_confidence > 0.7:
            confidence_multiplier = 1.1  # Slight increase
        elif trend_context.trend_confidence > 0.5:
            confidence_multiplier = 1.3  # More exploration needed
        else:
            confidence_multiplier = 1.5  # Maximum exploration
        
        # Adjust based on urgency
        # Immediate → fewer decisions (need fast action)
        # Evergreen → more decisions (can explore)
        if idea_core.time_sensitivity == TimeSensitivity.IMMEDIATE:
            urgency_multiplier = 0.5  # Cut decisions in half
        elif idea_core.time_sensitivity == TimeSensitivity.URGENT:
            urgency_multiplier = 0.7
        elif idea_core.time_sensitivity == TimeSensitivity.TIMELY:
            urgency_multiplier = 0.9
        else:  # EVERGREEN
            urgency_multiplier = 1.0  # Full exploration
        
        # Adjust based on user experience
        # Beginner → fewer decisions (overwhelming)
        # Expert → more decisions (can handle complexity)
        if user_experience_level == "beginner":
            experience_multiplier = 0.8
        elif user_experience_level == "expert":
            experience_multiplier = 1.2
        else:  # intermediate
            experience_multiplier = 1.0
        
        # Calculate final decision count
        final_decisions = int(
            decisions * confidence_multiplier * urgency_multiplier * experience_multiplier
        )
        
        # Clamp to valid range
        final_decisions = max(self.base_decisions, min(self.max_decisions, final_decisions))
        
        return final_decisions
    
    def get_primary_focus(
        self,
        trend_context: TrendContext,
        idea_core: IdeaCore
    ) -> str:
        """
        Determine the single primary focus area
        Used when cognitive budget is low (3 decisions)
        """
        # High hook pressure → focus on thumbnail/hook
        if trend_context.hook_pressure > 0.7:
            return "thumbnail_claim"
        
        # High pacing pressure → focus on narration pacing
        if trend_context.pacing_pressure > 0.7:
            return "narration_pacing"
        
        # High claim strength required → focus on claim boldness
        if trend_context.claim_strength_required > 0.7:
            return "claim_strength"
        
        # Default to thumbnail (most impactful)
        return "thumbnail_claim"

