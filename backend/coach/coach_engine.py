"""
Coach Engine - Learning engine that analyzes episodes and provides insights
Extracts patterns and generates recommendations
"""

from typing import Dict, Any, List, Optional
from backend.coach.episode_tracker import EpisodeTracker
from backend.core.idea_core import IdeaCore
from backend.core.trend_context import TrendContext


class CoachEngine:
    """
    Main coach engine that provides learning insights
    Analyzes episode history and generates actionable recommendations
    """
    
    def __init__(self, episode_tracker: Optional[EpisodeTracker] = None):
        """
        Initialize coach engine
        
        Args:
            episode_tracker: Episode tracker instance (creates new if None)
        """
        self.tracker = episode_tracker or EpisodeTracker()
    
    def predict_metrics(
        self,
        idea_core: IdeaCore,
        trend_context: TrendContext,
        decision_object: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Predict metrics for a new episode based on idea and trends
        
        Args:
            idea_core: IdeaCore for the episode
            trend_context: TrendContext for the episode
            decision_object: Optional decision object with choices made
        
        Returns:
            Predicted metrics:
                - ctr: Click-through rate (0-1)
                - retention: Average retention (0-1)
                - shares: Expected shares
                - views: Expected views range
        """
        # Base predictions from trend context
        base_ctr = 0.03  # 3% base CTR
        base_retention = 0.40  # 40% base retention
        
        # Adjust based on trend velocity (higher velocity = more views)
        velocity_multiplier = 1.0 + (trend_context.velocity * 0.5)
        
        # Adjust CTR based on hook pressure
        if trend_context.hook_pressure > 0.7:
            ctr_multiplier = 1.3  # High hook pressure → better CTR
        elif trend_context.hook_pressure > 0.5:
            ctr_multiplier = 1.1
        else:
            ctr_multiplier = 1.0
        
        # Adjust retention based on pacing pressure
        if trend_context.pacing_pressure > 0.7:
            retention_multiplier = 1.2  # Fast pacing → better retention
        else:
            retention_multiplier = 1.0
        
        # Adjust based on claim strength if provided
        if decision_object and decision_object.get('claim_strength'):
            claim_strength = decision_object['claim_strength']
            if claim_strength > 0.7:
                ctr_multiplier *= 1.15  # Bold claims → better CTR
        
        # Calculate final predictions
        predicted_ctr = min(0.15, base_ctr * ctr_multiplier)  # Cap at 15%
        predicted_retention = min(0.80, base_retention * retention_multiplier)  # Cap at 80%
        
        # Estimate views (base on trend and CTR)
        base_views = 1000 * velocity_multiplier
        views_min = int(base_views * 0.5)
        views_max = int(base_views * 2.0)
        
        # Estimate shares (based on retention and engagement)
        estimated_shares = int(predicted_retention * 100 * velocity_multiplier)
        
        return {
            'ctr': round(predicted_ctr, 4),
            'retention': round(predicted_retention, 4),
            'shares': estimated_shares,
            'views': {
                'min': views_min,
                'max': views_max,
                'expected': int(base_views)
            },
            'confidence': trend_context.trend_confidence
        }
    
    def analyze_episode(self, episode_num: int) -> Dict[str, Any]:
        """
        Analyze a specific episode and provide insights
        
        Args:
            episode_num: Episode number to analyze
        
        Returns:
            Analysis with insights and recommendations
        """
        episode = self.tracker.get_episode(episode_num)
        if not episode:
            return {'error': f'Episode {episode_num} not found'}
        
        insights = []
        
        # Analyze predicted metrics
        predicted = episode.get('predicted_metrics', {})
        if predicted:
            if predicted.get('ctr', 0) > 0.05:
                insights.append({
                    'type': 'strength',
                    'message': f"Strong CTR prediction ({predicted['ctr']*100:.1f}%) - thumbnail hook is effective"
                })
            elif predicted.get('ctr', 0) < 0.03:
                insights.append({
                    'type': 'weakness',
                    'message': f"Low CTR prediction ({predicted['ctr']*100:.1f}%) - consider bolder thumbnail claim"
                })
        
        # Compare predicted vs actual if available
        actual = episode.get('actual_metrics')
        if actual:
            if 'ctr' in predicted and 'ctr' in actual:
                ctr_diff = actual['ctr'] - predicted['ctr']
                if abs(ctr_diff) > 0.01:  # More than 1% difference
                    insights.append({
                        'type': 'learning',
                        'message': f"CTR was {ctr_diff*100:+.1f}% vs prediction - system learning from this"
                    })
        
        # Get primary insight (the ONE insight to show)
        primary_insight = self._get_primary_insight(episode, insights)
        
        return {
            'episode_num': episode_num,
            'insights': insights,
            'primary_insight': primary_insight,
            'predicted_metrics': predicted,
            'actual_metrics': actual
        }
    
    def _get_primary_insight(
        self,
        episode: Dict[str, Any],
        insights: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get the ONE primary actionable insight
        This is what shows in the simplified UI
        """
        # Priority: weaknesses > learning > strengths
        weakness = next((i for i in insights if i['type'] == 'weakness'), None)
        if weakness:
            return {
                'type': 'weakness',
                'message': weakness['message'],
                'action': 'Fix this first for maximum impact',
                'priority': 'high'
            }
        
        learning = next((i for i in insights if i['type'] == 'learning'), None)
        if learning:
            return {
                'type': 'learning',
                'message': learning['message'],
                'action': 'System is learning from this pattern',
                'priority': 'medium'
            }
        
        strength = next((i for i in insights if i['type'] == 'strength'), None)
        if strength:
            return {
                'type': 'strength',
                'message': strength['message'],
                'action': 'Continue using this approach',
                'priority': 'low'
            }
        
        # Default insight
        predicted = episode.get('predicted_metrics', {})
        if predicted.get('ctr', 0) > 0:
            return {
                'type': 'info',
                'message': f"Predicted CTR: {predicted['ctr']*100:.1f}%",
                'action': 'Monitor actual performance to validate prediction',
                'priority': 'medium'
            }
        
        return {
            'type': 'info',
            'message': 'Episode tracked - waiting for metrics',
            'action': 'Add actual metrics when available',
            'priority': 'low'
        }
    
    def get_learning_arc(self) -> Dict[str, Any]:
        """Get complete learning trajectory"""
        return self.tracker.get_learning_arc()
    
    def add_episode(self, episode_data: Dict[str, Any]) -> str:
        """Add a new episode"""
        return self.tracker.add_episode(episode_data)

