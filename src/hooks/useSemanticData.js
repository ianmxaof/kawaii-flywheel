import { useState, useCallback } from 'react';

/**
 * Hook for managing semantic analysis data across pipeline stages
 * Shares semantic data between components without prop drilling
 */
export function useSemanticData() {
  const [semanticData, setSemanticData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Set semantic analysis data
   */
  const setAnalysis = useCallback((data) => {
    setSemanticData(data);
    setError(null);
  }, []);

  /**
   * Clear semantic data
   */
  const clearAnalysis = useCallback(() => {
    setSemanticData(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  /**
   * Get emotional arc data
   */
  const getEmotionalArc = useCallback(() => {
    return semanticData?.emotional_arc || null;
  }, [semanticData]);

  /**
   * Get key moments
   */
  const getKeyMoments = useCallback(() => {
    return semanticData?.key_moments || [];
  }, [semanticData]);

  /**
   * Get voiceover guide
   */
  const getVoiceoverGuide = useCallback(() => {
    return semanticData?.voiceover_guide || null;
  }, [semanticData]);

  /**
   * Get pattern interrupts
   */
  const getPatternInterrupts = useCallback(() => {
    return semanticData?.pattern_interrupts || [];
  }, [semanticData]);

  /**
   * Get visual suggestions
   */
  const getVisualSuggestions = useCallback(() => {
    return semanticData?.visual_suggestions || [];
  }, [semanticData]);

  /**
   * Get pacing analysis
   */
  const getPacingAnalysis = useCallback(() => {
    return semanticData?.pacing_analysis || null;
  }, [semanticData]);

  /**
   * Check if semantic data is available
   */
  const hasData = useCallback(() => {
    return semanticData !== null;
  }, [semanticData]);

  return {
    semanticData,
    isAnalyzing,
    error,
    setAnalysis,
    clearAnalysis,
    setError,
    setIsAnalyzing,
    getEmotionalArc,
    getKeyMoments,
    getVoiceoverGuide,
    getPatternInterrupts,
    getVisualSuggestions,
    getPacingAnalysis,
    hasData
  };
}

export default useSemanticData;
