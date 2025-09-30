import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, BarChart3, Gauge } from "lucide-react";

interface TechnicalIndicators {
  rsi: number;
  atr: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  volume_vs_average: number;
  distance_from_vwap: number;
}

interface MarketRegime {
  regime: 'strong_bull' | 'weak_bull' | 'neutral' | 'weak_bear' | 'strong_bear';
  volatility: 'high' | 'normal' | 'low';
  volume: 'above_average' | 'average' | 'below_average';
}

interface TimeframeAlignment {
  tf_5min: string;
  tf_15min: string;
  tf_60min: string;
  alignment_score: number;
  all_aligned: boolean;
}

interface TechnicalIndicatorsDisplayProps {
  indicators?: TechnicalIndicators;
  marketRegime?: MarketRegime;
  timeframeAlignment?: TimeframeAlignment;
}

export const TechnicalIndicatorsDisplay: React.FC<TechnicalIndicatorsDisplayProps> = ({
  indicators,
  marketRegime,
  timeframeAlignment
}) => {
  if (!indicators) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Technical Indicators
          </CardTitle>
          <CardDescription>No indicator data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-500';
    if (rsi >= 60) return 'text-orange-500';
    if (rsi >= 40) return 'text-blue-500';
    if (rsi >= 30) return 'text-green-500';
    return 'text-emerald-500';
  };

  const getRSILabel = (rsi: number) => {
    if (rsi >= 70) return 'Overbought';
    if (rsi >= 60) return 'Bullish';
    if (rsi >= 40) return 'Neutral';
    if (rsi >= 30) return 'Bearish';
    return 'Oversold';
  };

  const getMACDColor = (value: number) => {
    if (value > 10) return 'text-emerald-500';
    if (value > 0) return 'text-green-500';
    if (value > -10) return 'text-red-500';
    return 'text-red-600';
  };

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'strong_bull': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'weak_bull': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'neutral': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'weak_bear': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'strong_bear': return 'bg-red-600/10 text-red-600 border-red-600/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeframeColor = (sentiment: string) => {
    if (sentiment.includes('bullish')) return 'text-emerald-500';
    if (sentiment.includes('bearish')) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Technical Indicators
          </CardTitle>
          <CardDescription>Quantitative market analysis metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RSI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                RSI (Relative Strength Index)
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getRSIColor(indicators.rsi)}`}>
                  {indicators.rsi.toFixed(1)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {getRSILabel(indicators.rsi)}
                </Badge>
              </div>
            </div>
            <Progress value={indicators.rsi} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {indicators.rsi > 70 && "Potentially overbought - watch for reversal"}
              {indicators.rsi < 30 && "Potentially oversold - watch for bounce"}
              {indicators.rsi >= 30 && indicators.rsi <= 70 && "Within normal range"}
            </p>
          </div>

          {/* MACD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                MACD
              </span>
              <div className="text-right">
                <div className={`text-lg font-bold ${getMACDColor(indicators.macd.value)}`}>
                  {indicators.macd.value > 0 ? '+' : ''}{indicators.macd.value.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Histogram: {indicators.macd.histogram > 0 ? '+' : ''}{indicators.macd.histogram.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Signal:</span>
              <span className={getMACDColor(indicators.macd.signal)}>
                {indicators.macd.signal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {indicators.macd.value > 0 ? "Bullish momentum" : "Bearish momentum"}
              {Math.abs(indicators.macd.histogram) > 5 && " - Strong signal"}
            </p>
          </div>

          {/* ATR (Volatility) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                ATR (Average True Range)
              </span>
              <span className="text-lg font-bold">{indicators.atr.toFixed(2)} pts</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {indicators.atr > 30 && "High volatility - larger stops recommended"}
              {indicators.atr <= 30 && indicators.atr >= 15 && "Normal volatility"}
              {indicators.atr < 15 && "Low volatility - tighter stops possible"}
            </p>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume vs Average</span>
              <Badge variant={indicators.volume_vs_average > 1.2 ? "default" : "outline"}>
                {(indicators.volume_vs_average * 100).toFixed(0)}%
              </Badge>
            </div>
            <Progress value={Math.min(indicators.volume_vs_average * 50, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {indicators.volume_vs_average > 1.3 && "High volume - strong conviction"}
              {indicators.volume_vs_average < 0.8 && "Low volume - weak conviction"}
              {indicators.volume_vs_average >= 0.8 && indicators.volume_vs_average <= 1.3 && "Average volume"}
            </p>
          </div>

          {/* VWAP Distance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Distance from VWAP</span>
              <span className={`font-bold ${indicators.distance_from_vwap > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {indicators.distance_from_vwap > 0 ? '+' : ''}{(indicators.distance_from_vwap * 100).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {indicators.distance_from_vwap > 0 ? "Above VWAP - bullish position" : "Below VWAP - bearish position"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Market Regime */}
      {marketRegime && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Regime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trend</span>
              <Badge className={getRegimeColor(marketRegime.regime)}>
                {marketRegime.regime.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volatility</span>
              <Badge variant="outline" className="capitalize">
                {marketRegime.volatility}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <Badge variant="outline" className="capitalize">
                {marketRegime.volume.replace('_', ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeframe Alignment */}
      {timeframeAlignment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Multi-Timeframe Alignment
              {timeframeAlignment.all_aligned && (
                <Badge variant="default" className="ml-2">
                  ALIGNED ✓
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Alignment Score: {(timeframeAlignment.alignment_score * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">5-Minute</span>
              <div className="flex items-center gap-2">
                {timeframeAlignment.tf_5min.includes('bullish') && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {timeframeAlignment.tf_5min.includes('bearish') && <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`font-medium capitalize ${getTimeframeColor(timeframeAlignment.tf_5min)}`}>
                  {timeframeAlignment.tf_5min}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">15-Minute</span>
              <div className="flex items-center gap-2">
                {timeframeAlignment.tf_15min.includes('bullish') && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {timeframeAlignment.tf_15min.includes('bearish') && <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`font-medium capitalize ${getTimeframeColor(timeframeAlignment.tf_15min)}`}>
                  {timeframeAlignment.tf_15min}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">60-Minute</span>
              <div className="flex items-center gap-2">
                {timeframeAlignment.tf_60min.includes('bullish') && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {timeframeAlignment.tf_60min.includes('bearish') && <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`font-medium capitalize ${getTimeframeColor(timeframeAlignment.tf_60min)}`}>
                  {timeframeAlignment.tf_60min}
                </span>
              </div>
            </div>
            <Progress value={timeframeAlignment.alignment_score * 100} className="h-2 mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {timeframeAlignment.all_aligned 
                ? "All timeframes agree - high conviction setup" 
                : "Mixed signals across timeframes - wait for alignment"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
