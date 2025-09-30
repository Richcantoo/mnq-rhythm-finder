// Technical Indicators Library for Chart Analysis
// These functions extract quantitative metrics from AI-analyzed chart data

export interface TechnicalIndicators {
  rsi: number;
  atr: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  volumeVsAverage: number;
  distanceFromVWAP: number;
}

export interface MarketRegime {
  regime: 'strong_bull' | 'weak_bull' | 'neutral' | 'weak_bear' | 'strong_bear';
  volatility: 'high' | 'normal' | 'low';
  volume: 'above_average' | 'average' | 'below_average';
  confidence: number;
}

export interface TimeframeAlignment {
  tf_5min: string;
  tf_15min: string;
  tf_60min: string;
  alignment_score: number;
  all_aligned: boolean;
}

/**
 * Calculate RSI from AI description of price momentum
 * RSI = 100 - (100 / (1 + RS))
 * RS = Average Gain / Average Loss
 */
export function calculateRSI(priceDirection: string, momentum: string, volatility: string): number {
  let baseRSI = 50;
  
  // Adjust based on price direction
  if (priceDirection.toLowerCase().includes('bullish') || priceDirection.toLowerCase().includes('up')) {
    baseRSI = 65;
  } else if (priceDirection.toLowerCase().includes('bearish') || priceDirection.toLowerCase().includes('down')) {
    baseRSI = 35;
  }
  
  // Adjust based on momentum strength
  if (momentum.toLowerCase().includes('strong')) {
    baseRSI += priceDirection.toLowerCase().includes('bullish') ? 10 : -10;
  } else if (momentum.toLowerCase().includes('weak')) {
    baseRSI += priceDirection.toLowerCase().includes('bullish') ? -5 : 5;
  }
  
  // Adjust based on volatility (high volatility can push RSI to extremes)
  if (volatility.toLowerCase().includes('high')) {
    if (baseRSI > 50) baseRSI += 5;
    else baseRSI -= 5;
  }
  
  // Clamp to valid RSI range [0-100]
  return Math.max(0, Math.min(100, baseRSI));
}

/**
 * Estimate ATR (Average True Range) from volatility description
 * ATR is typically measured in points for MNQ
 */
export function calculateATR(volatility: string, priceLevel: number = 16000): number {
  const baseATR = priceLevel * 0.002; // 0.2% of price as baseline
  
  if (volatility.toLowerCase().includes('high')) {
    return baseATR * 2.5; // ~40 points for MNQ
  } else if (volatility.toLowerCase().includes('low')) {
    return baseATR * 0.5; // ~8 points for MNQ
  } else {
    return baseATR; // ~16 points for MNQ
  }
}

/**
 * Calculate MACD values from trend and momentum
 * MACD = 12-period EMA - 26-period EMA
 * Signal = 9-period EMA of MACD
 * Histogram = MACD - Signal
 */
export function calculateMACD(priceDirection: string, momentum: string): { value: number; signal: number; histogram: number } {
  let macdValue = 0;
  
  // Estimate MACD based on trend
  if (priceDirection.toLowerCase().includes('bullish') || priceDirection.toLowerCase().includes('up')) {
    macdValue = momentum.toLowerCase().includes('strong') ? 25 : 
                momentum.toLowerCase().includes('weak') ? 5 : 15;
  } else if (priceDirection.toLowerCase().includes('bearish') || priceDirection.toLowerCase().includes('down')) {
    macdValue = momentum.toLowerCase().includes('strong') ? -25 : 
                momentum.toLowerCase().includes('weak') ? -5 : -15;
  }
  
  // Signal line typically lags MACD
  const signalValue = macdValue * 0.7;
  const histogram = macdValue - signalValue;
  
  return {
    value: macdValue,
    signal: signalValue,
    histogram: histogram
  };
}

/**
 * Calculate volume compared to average from volume profile description
 */
export function calculateVolumeVsAverage(volumeProfile: string): number {
  if (volumeProfile.toLowerCase().includes('high') || volumeProfile.toLowerCase().includes('heavy')) {
    return 1.5; // 150% of average
  } else if (volumeProfile.toLowerCase().includes('low') || volumeProfile.toLowerCase().includes('light')) {
    return 0.6; // 60% of average
  } else {
    return 1.0; // Average
  }
}

/**
 * Estimate distance from VWAP based on price action
 * Returns percentage distance (positive = above VWAP, negative = below)
 */
export function calculateDistanceFromVWAP(priceDirection: string, position: string = 'middle'): number {
  let distance = 0;
  
  if (priceDirection.toLowerCase().includes('bullish')) {
    distance = 0.3; // 0.3% above VWAP
  } else if (priceDirection.toLowerCase().includes('bearish')) {
    distance = -0.3; // 0.3% below VWAP
  }
  
  // Adjust based on position description if available
  if (position.toLowerCase().includes('extended')) {
    distance *= 2;
  }
  
  return distance;
}

/**
 * Determine market regime based on multiple factors
 */
export function determineMarketRegime(
  priceDirection: string,
  momentum: string,
  volatility: string,
  rsi: number
): MarketRegime {
  let regime: MarketRegime['regime'] = 'neutral';
  
  // Classify trend strength
  const isBullish = priceDirection.toLowerCase().includes('bullish') || priceDirection.toLowerCase().includes('up');
  const isBearish = priceDirection.toLowerCase().includes('bearish') || priceDirection.toLowerCase().includes('down');
  const isStrong = momentum.toLowerCase().includes('strong');
  const isWeak = momentum.toLowerCase().includes('weak');
  
  if (isBullish && isStrong && rsi > 60) {
    regime = 'strong_bull';
  } else if (isBullish && !isWeak) {
    regime = 'weak_bull';
  } else if (isBearish && isStrong && rsi < 40) {
    regime = 'strong_bear';
  } else if (isBearish && !isWeak) {
    regime = 'weak_bear';
  } else {
    regime = 'neutral';
  }
  
  // Classify volatility
  let volatilityRegime: MarketRegime['volatility'] = 'normal';
  if (volatility.toLowerCase().includes('high')) {
    volatilityRegime = 'high';
  } else if (volatility.toLowerCase().includes('low')) {
    volatilityRegime = 'low';
  }
  
  // Volume is determined separately
  const volumeRegime: MarketRegime['volume'] = 'average';
  
  return {
    regime,
    volatility: volatilityRegime,
    volume: volumeRegime,
    confidence: 0.75
  };
}

/**
 * Calculate similarity score between two chart analyses
 */
export function calculateSimilarityScore(
  current: any,
  historical: any,
  weights: {
    dayOfWeek: number;
    sessionTime: number;
    pricePattern: number;
    volatility: number;
    volumeProfile: number;
    momentum: number;
  } = {
    dayOfWeek: 0.15,
    sessionTime: 0.20,
    pricePattern: 0.25,
    volatility: 0.15,
    volumeProfile: 0.10,
    momentum: 0.15
  }
): number {
  let score = 0;
  
  // Day of week match
  if (current.day_of_week?.toLowerCase() === historical.day_of_week?.toLowerCase()) {
    score += weights.dayOfWeek;
  }
  
  // Session time match
  if (current.session_type?.toLowerCase() === historical.session_type?.toLowerCase() ||
      current.temporal_patterns?.session_type?.toLowerCase() === historical.temporal_patterns?.session_type?.toLowerCase()) {
    score += weights.sessionTime;
  }
  
  // Price pattern match (sentiment/direction)
  const currentDirection = current.sentiment_label || current.price_direction || 'neutral';
  const historicalDirection = historical.sentiment_label || historical.price_direction || 'neutral';
  if (currentDirection.toLowerCase() === historicalDirection.toLowerCase()) {
    score += weights.pricePattern;
  }
  
  // Volatility match
  const currentVol = current.volatility_regime || current.pattern_features?.volatility || 'medium';
  const historicalVol = historical.volatility_regime || historical.pattern_features?.volatility || 'medium';
  if (currentVol.toLowerCase() === historicalVol.toLowerCase()) {
    score += weights.volatility;
  }
  
  // Volume profile match
  const currentVolume = current.volume_regime || current.pattern_features?.volume_profile || 'normal';
  const historicalVolume = historical.volume_regime || historical.pattern_features?.volume_profile || 'normal';
  if (currentVolume.toLowerCase().includes(historicalVolume.toLowerCase()) ||
      historicalVolume.toLowerCase().includes(currentVolume.toLowerCase())) {
    score += weights.volumeProfile;
  }
  
  // Momentum match
  const currentMomentum = current.momentum || current.pattern_features?.momentum || 'moderate';
  const historicalMomentum = historical.momentum || historical.pattern_features?.momentum || 'moderate';
  if (currentMomentum.toLowerCase() === historicalMomentum.toLowerCase()) {
    score += weights.momentum;
  }
  
  // RSI proximity (if available)
  if (current.rsi_value && historical.rsi_value) {
    const rsiDiff = Math.abs(current.rsi_value - historical.rsi_value);
    if (rsiDiff < 10) {
      score += 0.10; // Bonus for similar RSI
    }
  }
  
  return Math.min(1.0, score);
}

/**
 * Analyze multi-timeframe alignment
 */
export function analyzeTimeframeAlignment(
  tf5min: string,
  tf15min: string,
  tf60min: string
): TimeframeAlignment {
  const normalizedTF = {
    tf_5min: tf5min.toLowerCase(),
    tf_15min: tf15min.toLowerCase(),
    tf_60min: tf60min.toLowerCase()
  };
  
  // Check for alignment
  const allBullish = [normalizedTF.tf_5min, normalizedTF.tf_15min, normalizedTF.tf_60min]
    .every(tf => tf.includes('bullish') || tf.includes('up'));
  
  const allBearish = [normalizedTF.tf_5min, normalizedTF.tf_15min, normalizedTF.tf_60min]
    .every(tf => tf.includes('bearish') || tf.includes('down'));
  
  const all_aligned = allBullish || allBearish;
  
  // Calculate alignment score
  let alignment_score = 0;
  if (normalizedTF.tf_5min === normalizedTF.tf_15min) alignment_score += 0.33;
  if (normalizedTF.tf_15min === normalizedTF.tf_60min) alignment_score += 0.33;
  if (normalizedTF.tf_5min === normalizedTF.tf_60min) alignment_score += 0.34;
  
  return {
    tf_5min: normalizedTF.tf_5min,
    tf_15min: normalizedTF.tf_15min,
    tf_60min: normalizedTF.tf_60min,
    alignment_score,
    all_aligned
  };
}
