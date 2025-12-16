"""
TrendContext - Bayesian prior that reshapes idea interpretation
Fetches trend data and calculates pressure metrics for content decisions
"""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from datetime import datetime, timedelta


@dataclass
class TrendContext:
    """
    Trend context that acts as Bayesian prior for content decisions
    Reshapes how IdeaCore interprets raw input
    """
    # Core trend metrics
    velocity: float  # 0-1, how fast trend is growing
    saturation: float  # 0-1, how saturated the topic is
    competition_density: float  # 0-1, how many creators are covering this
    
    # Calculated pressure metrics
    hook_pressure: float  # 0-1, how aggressive hooks should be
    pacing_pressure: float  # 0-1, how fast pacing should be
    claim_strength_required: float  # 0-1, how bold claims need to be
    
    # Trend data source info
    trend_confidence: float  # 0-1, confidence in trend data
    data_sources: list  # List of sources used (e.g., ['google_trends'])
    fetched_at: str  # ISO timestamp
    
    # Raw trend data (for debugging/analysis)
    raw_data: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TrendContext':
        """Create from dictionary"""
        return cls(**data)
    
    @classmethod
    def compute_from_trend_data(
        cls,
        current_volume: float,
        volume_7d_ago: float,
        volume_30d_ago: float,
        competition_count: int,
        data_sources: list = None
    ) -> 'TrendContext':
        """
        Compute TrendContext from raw trend data
        
        Args:
            current_volume: Current search/interest volume
            volume_7d_ago: Volume 7 days ago
            volume_30d_ago: Volume 30 days ago
            competition_count: Number of competing videos/content
            data_sources: List of data sources used
        """
        # Calculate velocity (growth rate)
        if volume_7d_ago > 0:
            velocity = min(1.0, max(0.0, (current_volume - volume_7d_ago) / volume_7d_ago))
        else:
            velocity = 0.5  # Default if no historical data
        
        # Calculate saturation (how much content exists)
        # Normalize competition count to 0-1 scale (assuming 0-1000 is reasonable range)
        saturation = min(1.0, max(0.0, competition_count / 1000.0))
        
        # Calculate competition density (similar to saturation but different scale)
        competition_density = min(1.0, max(0.0, competition_count / 500.0))
        
        # Calculate hook pressure
        # High velocity + low saturation = high hook pressure (need to stand out)
        # Low velocity + high saturation = low hook pressure (can be more subtle)
        hook_pressure = (velocity * 0.6) + ((1 - saturation) * 0.4)
        hook_pressure = min(1.0, max(0.0, hook_pressure))
        
        # Calculate pacing pressure
        # High velocity = fast pacing needed (trend is moving fast)
        # Low velocity = slower pacing allowed (more time to build narrative)
        pacing_pressure = velocity * 0.7 + (1 - saturation) * 0.3
        pacing_pressure = min(1.0, max(0.0, pacing_pressure))
        
        # Calculate claim strength required
        # High competition = need bolder claims to stand out
        # Low competition = can be more subtle
        claim_strength_required = competition_density * 0.7 + (1 - saturation) * 0.3
        claim_strength_required = min(1.0, max(0.0, claim_strength_required))
        
        # Trend confidence (based on data quality)
        # Higher if we have good historical data
        if volume_7d_ago > 0 and volume_30d_ago > 0:
            trend_confidence = 0.9
        elif volume_7d_ago > 0:
            trend_confidence = 0.7
        else:
            trend_confidence = 0.5
        
        return cls(
            velocity=velocity,
            saturation=saturation,
            competition_density=competition_density,
            hook_pressure=hook_pressure,
            pacing_pressure=pacing_pressure,
            claim_strength_required=claim_strength_required,
            trend_confidence=trend_confidence,
            data_sources=data_sources or ['google_trends'],
            fetched_at=datetime.now().isoformat(),
            raw_data={
                'current_volume': current_volume,
                'volume_7d_ago': volume_7d_ago,
                'volume_30d_ago': volume_30d_ago,
                'competition_count': competition_count
            }
        )
    
    @classmethod
    def default(cls) -> 'TrendContext':
        """Create default TrendContext when no trend data available"""
        return cls(
            velocity=0.5,
            saturation=0.5,
            competition_density=0.5,
            hook_pressure=0.5,
            pacing_pressure=0.5,
            claim_strength_required=0.5,
            trend_confidence=0.3,  # Low confidence for default
            data_sources=[],
            fetched_at=datetime.now().isoformat()
        )

