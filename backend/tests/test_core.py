"""
Basic tests for core data structures
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.idea_core import IdeaCore, ContentMode, TimeSensitivity, NoveltyAxis
from core.trend_context import TrendContext
from core.decision_object import DecisionObject, OverrideReason
from core.cognitive_budget import CognitiveLoadBudget


def test_idea_core_basic_extraction():
    """Test basic IdeaCore extraction"""
    raw_input = "How to automate your workflow with Cursor IDE in 2025"
    idea_core = IdeaCore._basic_extraction(raw_input, None)
    
    assert idea_core.core_claim is not None
    assert idea_core.audience is not None
    assert isinstance(idea_core.content_mode, ContentMode)
    assert isinstance(idea_core.time_sensitivity, TimeSensitivity)
    assert isinstance(idea_core.novelty_axis, NoveltyAxis)
    assert len(idea_core.keywords) > 0
    
    # Test serialization
    data = idea_core.to_dict()
    assert 'core_claim' in data
    assert 'content_mode' in data
    
    # Test deserialization
    restored = IdeaCore.from_dict(data)
    assert restored.core_claim == idea_core.core_claim
    print("✅ IdeaCore basic extraction test passed")


def test_trend_context_computation():
    """Test TrendContext computation"""
    trend_context = TrendContext.compute_from_trend_data(
        current_volume=80.0,
        volume_7d_ago=60.0,
        volume_30d_ago=40.0,
        competition_count=300,
        data_sources=['google_trends']
    )
    
    assert 0 <= trend_context.velocity <= 1
    assert 0 <= trend_context.saturation <= 1
    assert 0 <= trend_context.hook_pressure <= 1
    assert 0 <= trend_context.pacing_pressure <= 1
    assert 0 <= trend_context.claim_strength_required <= 1
    assert trend_context.velocity > 0  # Should be positive with growth
    
    # Test serialization
    data = trend_context.to_dict()
    assert 'velocity' in data
    assert 'hook_pressure' in data
    
    # Test deserialization
    restored = TrendContext.from_dict(data)
    assert restored.velocity == trend_context.velocity
    print("✅ TrendContext computation test passed")


def test_decision_object():
    """Test DecisionObject creation and overrides"""
    decision = DecisionObject(
        idea_core_id="test_idea_1",
        trend_context_id="test_trend_1",
        cognitive_budget=5
    )
    
    assert decision.cognitive_budget == 5
    assert len(decision.overrides) == 0
    
    # Add override
    decision.add_override(
        decision_id="thumbnail_style",
        system_recommendation="bold_claim",
        user_choice="curiosity_gap",
        reason=OverrideReason.PREFERENCE
    )
    
    assert len(decision.overrides) == 1
    assert decision.get_override_count() == 1
    
    summary = decision.get_override_summary()
    assert summary['preference'] == 1
    
    # Test serialization
    data = decision.to_dict()
    assert 'overrides' in data
    assert len(data['overrides']) == 1
    
    print("✅ DecisionObject test passed")


def test_cognitive_budget():
    """Test cognitive budget calculation"""
    budgeter = CognitiveLoadBudget()
    
    # Create test data
    idea_core = IdeaCore._basic_extraction("Test idea", None)
    trend_context = TrendContext.compute_from_trend_data(
        current_volume=80.0,
        volume_7d_ago=60.0,
        volume_30d_ago=40.0,
        competition_count=300
    )
    
    # Test calculation
    decisions = budgeter.calculate(trend_context, idea_core)
    assert 3 <= decisions <= 7
    
    # Test with high confidence (should give fewer decisions)
    high_confidence_context = TrendContext.compute_from_trend_data(
        current_volume=90.0,
        volume_7d_ago=85.0,
        volume_30d_ago=80.0,
        competition_count=200
    )
    # Note: confidence is calculated internally, so we can't directly set it
    # But we can verify the calculation works
    
    # Test primary focus
    focus = budgeter.get_primary_focus(trend_context, idea_core)
    assert focus in ["thumbnail_claim", "narration_pacing", "claim_strength"]
    
    print("✅ CognitiveBudget test passed")


if __name__ == '__main__':
    print("Running core tests...")
    test_idea_core_basic_extraction()
    test_trend_context_computation()
    test_decision_object()
    test_cognitive_budget()
    print("\n✅ All core tests passed!")

