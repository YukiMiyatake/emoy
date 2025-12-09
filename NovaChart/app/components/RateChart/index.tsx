'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useChartData } from './useChartData';
import { useYAxisConfig, YAxisZoom } from './useYAxisConfig';
import ChartControls from './ChartControls';
import ChartContainer from './ChartContainer';

type TimeRange = 'all' | '5years' | '1year' | '1month' | '1week';

export default function RateChart() {
  const { rateHistory, goals } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>(undefined);
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>(undefined);
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(7);
  const [yAxisZoom, setYAxisZoom] = useState<YAxisZoom | null>(null);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const chartData = useChartData(rateHistory, goals, timeRange, movingAverageWindow);
  const yAxisConfig = useYAxisConfig(chartData, brushStartIndex, brushEndIndex, yAxisZoom);

  // Reset brush when timeRange changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
  };

  // Handle legend click to toggle line visibility
  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  }, []);

  // Handle Y-axis zoom
  const handleYAxisZoom = useCallback((zoomIn: boolean) => {
    if (!yAxisConfig.yAxisDomain || !Array.isArray(yAxisConfig.yAxisDomain)) return;
    
    let currentMin: number;
    let currentMax: number;
    if (yAxisZoom) {
      currentMin = yAxisZoom.min;
      currentMax = yAxisZoom.max;
    } else {
      [currentMin, currentMax] = yAxisConfig.yAxisDomain;
    }
    
    const currentRange = currentMax - currentMin;
    const center = (currentMin + currentMax) / 2;
    const zoomFactor = 0.1;
    
    let newRange: number;
    if (zoomIn) {
      newRange = currentRange * (1 - zoomFactor);
    } else {
      newRange = currentRange * (1 + zoomFactor);
    }
    
    const minRange = 50;
    const maxRange = 5000;
    newRange = Math.max(minRange, Math.min(maxRange, newRange));
    
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = center + newRange / 2;
    
    setYAxisZoom({ min: newMin, max: newMax });
  }, [yAxisConfig.yAxisDomain, yAxisZoom]);

  // Handle keyboard events for numpad +/-
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        handleYAxisZoom(true);
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        handleYAxisZoom(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleYAxisZoom]);

  if (rateHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">レート推移</h2>
        <p className="text-gray-500">データがありません。Riot APIからデータを取得するか、手動でデータを追加してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <ChartControls
        timeRange={timeRange}
        movingAverageWindow={movingAverageWindow}
        yAxisZoom={yAxisZoom}
        onTimeRangeChange={handleTimeRangeChange}
        onMovingAverageWindowChange={setMovingAverageWindow}
        onYAxisZoomReset={() => setYAxisZoom(null)}
      />
      <ChartContainer
        chartData={chartData}
        yAxisConfig={yAxisConfig}
        movingAverageWindow={movingAverageWindow}
        brushStartIndex={brushStartIndex}
        brushEndIndex={brushEndIndex}
        hiddenLines={hiddenLines}
        yAxisZoom={yAxisZoom}
        onBrushChange={(start, end) => {
          setBrushStartIndex(start);
          setBrushEndIndex(end);
        }}
        onLegendClick={handleLegendClick}
        onYAxisZoom={handleYAxisZoom}
      />
    </div>
  );
}

