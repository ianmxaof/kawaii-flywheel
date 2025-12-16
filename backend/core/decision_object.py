"""
DecisionObject - Centralizes all pipeline decisions with override tracking
Tracks what the system recommended vs what the user actually did
"""

from dataclasses import dataclass, asdict, field
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class OverrideReason(str, Enum):
    """Reasons why user overrode system recommendation"""
    PREFERENCE = "preference"  # User preference/style
    CONFIDENCE = "confidence"  # User has higher confidence
    CONTEXT = "context"  # User has additional context
    TESTING = "testing"  # User testing different approach
    INTUITION = "intuition"  # User gut feeling


@dataclass
class DecisionOverride:
    """Tracks a single decision override"""
    decision_id: str
    system_recommendation: Any
    user_choice: Any
    reason: OverrideReason
    timestamp: str
    notes: Optional[str] = None


@dataclass
class DecisionObject:
    """
    Central object that tracks all decisions in the pipeline
    Used for learning and pattern extraction
    """
    # Core identifiers
    idea_core_id: str  # Reference to IdeaCore
    trend_context_id: str  # Reference to TrendContext
    project_id: Optional[str] = None
    
    # Decisions made
    thumbnail_style: Optional[str] = None  # e.g., "bold_claim", "curiosity_gap"
    thumbnail_claim: Optional[str] = None
    narration_hook: Optional[str] = None
    pacing_strategy: Optional[str] = None  # e.g., "fast", "medium", "slow"
    claim_strength: Optional[float] = None  # 0-1
    
    # Cognitive budget
    cognitive_budget: Optional[int] = None  # Number of decisions allowed
    decisions_made: int = 0
    
    # Override tracking
    overrides: List[DecisionOverride] = field(default_factory=list)
    
    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Convert enum to string
        for override in data.get('overrides', []):
            if 'reason' in override:
                override['reason'] = OverrideReason(override['reason']).value if isinstance(override['reason'], OverrideReason) else override['reason']
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DecisionObject':
        """Create from dictionary"""
        # Convert string enums back
        if 'overrides' in data:
            for override in data['overrides']:
                if 'reason' in override and isinstance(override['reason'], str):
                    override['reason'] = OverrideReason(override['reason'])
        return cls(**data)
    
    def add_override(
        self,
        decision_id: str,
        system_recommendation: Any,
        user_choice: Any,
        reason: OverrideReason,
        notes: Optional[str] = None
    ):
        """Record a user override"""
        override = DecisionOverride(
            decision_id=decision_id,
            system_recommendation=system_recommendation,
            user_choice=user_choice,
            reason=reason,
            timestamp=datetime.now().isoformat(),
            notes=notes
        )
        self.overrides.append(override)
        self.updated_at = datetime.now().isoformat()
    
    def get_override_count(self) -> int:
        """Get total number of overrides"""
        return len(self.overrides)
    
    def get_override_summary(self) -> Dict[str, int]:
        """Get summary of overrides by reason"""
        summary = {}
        for override in self.overrides:
            reason = override.reason.value if isinstance(override.reason, OverrideReason) else override.reason
            summary[reason] = summary.get(reason, 0) + 1
        return summary

