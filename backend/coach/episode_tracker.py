"""
Episode Tracker - Persistence layer for episode data
Stores predicted vs actual metrics for learning
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime


class EpisodeTracker:
    """
    Tracks episodes with predicted and actual metrics
    Stores data in JSON files for persistence
    """
    
    def __init__(self, storage_dir: str = "episode_data"):
        """
        Initialize episode tracker
        
        Args:
            storage_dir: Directory to store episode data
        """
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.episodes_file = self.storage_dir / "episodes.json"
        self._episodes = self._load_episodes()
    
    def _load_episodes(self) -> List[Dict[str, Any]]:
        """Load episodes from disk"""
        if not self.episodes_file.exists():
            return []
        
        try:
            with open(self.episodes_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading episodes: {e}")
            return []
    
    def _save_episodes(self):
        """Save episodes to disk"""
        try:
            with open(self.episodes_file, 'w') as f:
                json.dump(self._episodes, f, indent=2)
        except IOError as e:
            print(f"Error saving episodes: {e}")
    
    def add_episode(self, episode_data: Dict[str, Any]) -> str:
        """
        Add a new episode
        
        Args:
            episode_data: Episode data including:
                - episode_num: Episode number (1-10)
                - idea_core: IdeaCore data
                - trend_context: TrendContext data
                - predicted_metrics: Predicted metrics (CTR, retention, etc.)
                - actual_metrics: Actual metrics (optional, for Episode 10)
                - decisions: DecisionObject data
                - overrides: List of overrides
        
        Returns:
            Episode ID
        """
        episode_num = episode_data.get('episode_num', len(self._episodes) + 1)
        episode_id = f"episode_{episode_num}"
        
        episode = {
            'episode_id': episode_id,
            'episode_num': episode_num,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            **episode_data
        }
        
        # Update existing episode if it exists
        existing_idx = next(
            (i for i, ep in enumerate(self._episodes) if ep.get('episode_num') == episode_num),
            None
        )
        
        if existing_idx is not None:
            episode['created_at'] = self._episodes[existing_idx].get('created_at', episode['created_at'])
            self._episodes[existing_idx] = episode
        else:
            self._episodes.append(episode)
        
        self._save_episodes()
        return episode_id
    
    def get_episode(self, episode_num: int) -> Optional[Dict[str, Any]]:
        """Get episode by number"""
        return next(
            (ep for ep in self._episodes if ep.get('episode_num') == episode_num),
            None
        )
    
    def get_all_episodes(self) -> List[Dict[str, Any]]:
        """Get all episodes"""
        return sorted(self._episodes, key=lambda x: x.get('episode_num', 0))
    
    def update_episode_metrics(self, episode_num: int, actual_metrics: Dict[str, Any]):
        """
        Update episode with actual metrics (for Episode 10)
        
        Args:
            episode_num: Episode number
            actual_metrics: Actual metrics from YouTube Studio
                - views: int
                - ctr: float (0-1)
                - avg_view_duration: float (seconds)
                - shares: int
        """
        episode = self.get_episode(episode_num)
        if not episode:
            raise ValueError(f"Episode {episode_num} not found")
        
        episode['actual_metrics'] = actual_metrics
        episode['updated_at'] = datetime.now().isoformat()
        self._save_episodes()
    
    def get_learning_arc(self) -> Dict[str, Any]:
        """
        Get complete learning trajectory across all episodes
        
        Returns:
            Dictionary with:
                - episodes: List of episodes with predictions and actuals
                - patterns: Discovered patterns
                - accuracy: Prediction accuracy metrics
        """
        episodes = self.get_all_episodes()
        
        # Extract patterns
        patterns = self._extract_patterns(episodes)
        
        # Calculate accuracy (if we have actual metrics)
        accuracy = self._calculate_accuracy(episodes)
        
        return {
            'episodes': episodes,
            'patterns': patterns,
            'accuracy': accuracy,
            'total_episodes': len(episodes)
        }
    
    def _extract_patterns(self, episodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract patterns from episode history
        
        Examples:
            - "Bold claims → +15% CTR"
            - "High hook pressure → better retention"
        """
        patterns = []
        
        if len(episodes) < 2:
            return patterns
        
        # Simple pattern extraction (can be enhanced with ML)
        # Look for correlations between decisions and outcomes
        
        # Example: Check if bold claims correlate with higher CTR
        bold_claim_episodes = [
            ep for ep in episodes
            if ep.get('decisions', {}).get('claim_strength', 0) > 0.7
        ]
        
        if bold_claim_episodes:
            avg_ctr = sum(
                ep.get('predicted_metrics', {}).get('ctr', 0)
                for ep in bold_claim_episodes
            ) / len(bold_claim_episodes)
            
            if avg_ctr > 0.05:  # 5% CTR threshold
                patterns.append({
                    'pattern': 'Bold claims → Higher CTR',
                    'description': f'Episodes with bold claims averaged {avg_ctr*100:.1f}% CTR',
                    'confidence': 'medium',
                    'episodes_analyzed': len(bold_claim_episodes)
                })
        
        return patterns
    
    def _calculate_accuracy(self, episodes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate prediction accuracy for episodes with actual metrics"""
        episodes_with_actuals = [
            ep for ep in episodes
            if ep.get('actual_metrics') is not None
        ]
        
        if not episodes_with_actuals:
            return {
                'has_actuals': False,
                'message': 'No episodes with actual metrics yet'
            }
        
        # Calculate accuracy for each metric
        ctr_errors = []
        retention_errors = []
        
        for ep in episodes_with_actuals:
            predicted = ep.get('predicted_metrics', {})
            actual = ep.get('actual_metrics', {})
            
            if 'ctr' in predicted and 'ctr' in actual:
                error = abs(predicted['ctr'] - actual['ctr'])
                ctr_errors.append(error)
            
            if 'retention' in predicted and 'retention' in actual:
                error = abs(predicted['retention'] - actual['retention'])
                retention_errors.append(error)
        
        accuracy = {
            'has_actuals': True,
            'episodes_with_actuals': len(episodes_with_actuals),
            'ctr_mae': sum(ctr_errors) / len(ctr_errors) if ctr_errors else None,
            'retention_mae': sum(retention_errors) / len(retention_errors) if retention_errors else None
        }
        
        return accuracy

