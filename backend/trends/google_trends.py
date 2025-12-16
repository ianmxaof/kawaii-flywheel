"""
Google Trends API integration using pytrends
Fetches trend data for content ideas
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import time


class GoogleTrendsFetcher:
    """
    Fetches Google Trends data for a given query
    Uses pytrends library
    """
    
    def __init__(self):
        """Initialize Google Trends fetcher"""
        self.pytrends = None
        self._init_pytrends()
    
    def _init_pytrends(self):
        """Initialize pytrends library"""
        try:
            from pytrends.request import TrendReq
            self.pytrends = TrendReq(hl='en-US', tz=360)
            self.available = True
        except ImportError:
            print("⚠️  pytrends not installed. Install with: pip install pytrends")
            self.available = False
        except Exception as e:
            print(f"⚠️  Failed to initialize pytrends: {e}")
            self.available = False
    
    def fetch_trend_data(
        self,
        keyword: str,
        timeframe: str = 'today 3-m'  # Last 3 months
    ) -> Dict[str, Any]:
        """
        Fetch trend data for a keyword
        
        Args:
            keyword: Search keyword/query
            timeframe: Timeframe for trends (e.g., 'today 3-m', 'today 1-y')
        
        Returns:
            Dictionary with trend data including:
            - current_volume: Current search volume (normalized 0-100)
            - volume_7d_ago: Volume 7 days ago
            - volume_30d_ago: Volume 30 days ago
            - trend_direction: 'rising', 'stable', 'falling'
            - related_queries: Related search queries
        """
        if not self.available:
            return self._default_trend_data()
        
        try:
            # Build payload
            self.pytrends.build_payload([keyword], timeframe=timeframe)
            
            # Get interest over time
            interest_over_time = self.pytrends.interest_over_time()
            
            if interest_over_time.empty:
                return self._default_trend_data()
            
            # Calculate volumes
            # pytrends returns normalized values 0-100
            current_volume = float(interest_over_time[keyword].iloc[-1]) if len(interest_over_time) > 0 else 50.0
            
            # Get 7 days ago (if available)
            if len(interest_over_time) >= 7:
                volume_7d_ago = float(interest_over_time[keyword].iloc[-7])
            else:
                volume_7d_ago = current_volume * 0.9  # Estimate
            
            # Get 30 days ago (if available)
            if len(interest_over_time) >= 30:
                volume_30d_ago = float(interest_over_time[keyword].iloc[-30])
            else:
                volume_30d_ago = current_volume * 0.8  # Estimate
            
            # Get related queries
            try:
                related_queries = self.pytrends.related_queries()
                top_queries = []
                if keyword in related_queries and related_queries[keyword]['top'] is not None:
                    top_queries = related_queries[keyword]['top']['query'].head(5).tolist()
            except Exception:
                top_queries = []
            
            # Determine trend direction
            if volume_7d_ago > 0:
                change_7d = (current_volume - volume_7d_ago) / volume_7d_ago
                if change_7d > 0.1:
                    trend_direction = 'rising'
                elif change_7d < -0.1:
                    trend_direction = 'falling'
                else:
                    trend_direction = 'stable'
            else:
                trend_direction = 'stable'
            
            # Rate limiting - pytrends recommends delays
            time.sleep(1)
            
            return {
                'current_volume': current_volume,
                'volume_7d_ago': volume_7d_ago,
                'volume_30d_ago': volume_30d_ago,
                'trend_direction': trend_direction,
                'related_queries': top_queries,
                'timeframe': timeframe,
                'fetched_at': datetime.now().isoformat()
            }
        
        except Exception as e:
            print(f"Error fetching Google Trends data: {e}")
            return self._default_trend_data()
    
    def _default_trend_data(self) -> Dict[str, Any]:
        """Return default trend data when fetch fails"""
        return {
            'current_volume': 50.0,
            'volume_7d_ago': 50.0,
            'volume_30d_ago': 50.0,
            'trend_direction': 'stable',
            'related_queries': [],
            'timeframe': 'today 3-m',
            'fetched_at': datetime.now().isoformat(),
            'error': 'Failed to fetch trend data'
        }
    
    def estimate_competition_count(self, keyword: str) -> int:
        """
        Estimate competition count based on trend data
        This is a heuristic - actual competition would require YouTube API
        
        Args:
            keyword: Search keyword
        
        Returns:
            Estimated competition count (0-1000)
        """
        if not self.available:
            return 500  # Default medium competition
        
        try:
            # Get related queries to estimate competition
            self.pytrends.build_payload([keyword], timeframe='today 3-m')
            related_queries = self.pytrends.related_queries()
            
            # More related queries = more competition
            if keyword in related_queries and related_queries[keyword]['top'] is not None:
                query_count = len(related_queries[keyword]['top'])
                # Scale to 0-1000 range
                competition = min(1000, query_count * 50)
            else:
                competition = 500  # Default
            
            time.sleep(1)  # Rate limiting
            return int(competition)
        
        except Exception as e:
            print(f"Error estimating competition: {e}")
            return 500  # Default medium competition

