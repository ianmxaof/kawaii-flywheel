"""
Trend Prior Engine - Main trend fetching and prior application
Coordinates trend data fetching and creates TrendContext
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from core.trend_context import TrendContext
from .google_trends import GoogleTrendsFetcher


class TrendPriorEngine:
    """
    Main engine for fetching trends and creating TrendContext
    Acts as Bayesian prior that reshapes idea interpretation
    """
    
    def __init__(self):
        """Initialize trend prior engine"""
        self.google_trends = GoogleTrendsFetcher()
        self._cache: Dict[str, tuple] = {}  # Cache: {key: (TrendContext, timestamp)}
        self.cache_ttl = timedelta(minutes=5)  # 5-minute cache TTL
    
    def _get_cache_key(self, core_claim: str) -> str:
        """Generate cache key from core claim"""
        # Simple key - in production, use hash
        return core_claim.lower().strip()[:100]
    
    def _is_cache_valid(self, timestamp: datetime) -> bool:
        """Check if cached entry is still valid"""
        return datetime.now() - timestamp < self.cache_ttl
    
    def compute_trend_prior(
        self,
        core_claim: str,
        use_cache: bool = True
    ) -> TrendContext:
        """
        Compute trend prior for a core claim
        
        Args:
            core_claim: The main claim/value proposition
            use_cache: Whether to use cached results
        
        Returns:
            TrendContext with trend data and pressure metrics
        """
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key(core_claim)
            if cache_key in self._cache:
                cached_context, cached_time = self._cache[cache_key]
                if self._is_cache_valid(cached_time):
                    return cached_context
        
        # Extract keywords from core claim for trend search
        # Simple extraction - take first few significant words
        keywords = self._extract_keywords(core_claim)
        primary_keyword = keywords[0] if keywords else core_claim.split()[0] if core_claim else "trending"
        
        # Fetch trend data from Google Trends
        trend_data = self.google_trends.fetch_trend_data(primary_keyword)
        
        # Estimate competition
        competition_count = self.google_trends.estimate_competition_count(primary_keyword)
        
        # Create TrendContext from trend data
        trend_context = TrendContext.compute_from_trend_data(
            current_volume=trend_data.get('current_volume', 50.0),
            volume_7d_ago=trend_data.get('volume_7d_ago', 50.0),
            volume_30d_ago=trend_data.get('volume_30d_ago', 50.0),
            competition_count=competition_count,
            data_sources=['google_trends']
        )
        
        # Store raw trend data in context
        trend_context.raw_data = {
            **trend_data,
            'primary_keyword': primary_keyword,
            'competition_count': competition_count
        }
        
        # Cache the result
        if use_cache:
            cache_key = self._get_cache_key(core_claim)
            self._cache[cache_key] = (trend_context, datetime.now())
        
        return trend_context
    
    def _extract_keywords(self, text: str) -> list:
        """
        Extract keywords from text for trend search
        Simple implementation - takes first significant words
        """
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        
        # Split and filter
        words = text.lower().split()
        keywords = [w for w in words if len(w) > 3 and w not in stop_words]
        
        # Return first 3 keywords
        return keywords[:3] if keywords else [text.split()[0]] if text.split() else ['trending']
    
    def clear_cache(self):
        """Clear the trend cache"""
        self._cache.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        valid_entries = sum(
            1 for _, (_, timestamp) in self._cache.items()
            if self._is_cache_valid(timestamp)
        )
        return {
            'total_entries': len(self._cache),
            'valid_entries': valid_entries,
            'cache_ttl_minutes': self.cache_ttl.total_seconds() / 60
        }

