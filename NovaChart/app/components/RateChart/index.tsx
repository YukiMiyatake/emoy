'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useChartData } from './useChartData';
import { useYAxisConfig, YAxisZoom } from './useYAxisConfig';
import { TimeRange } from './utils/timeRange';
import ChartControls from './ChartControls';
import ChartContainer from './ChartContainer';

export default function RateChart() {
  const rateHistory = useAppStore((state) => state.rateHistory);
  const goals = useAppStore((state) => state.goals);
  const loadRateHistory = useAppStore((state) => state.loadRateHistory);
  const loadGoals = useAppStore((state) => state.loadGoals);
  
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>(undefined);
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>(undefined);
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(7);
  const [yAxisZoom, setYAxisZoom] = useState<YAxisZoom | null>(null);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  // Load data on mount - only once
  useEffect(() => {
    console.log('RateChart: useEffect triggered, loading data from store...');
    const loadData = async () => {
      try {
        await loadRateHistory();
        console.log('RateChart: Rate history loaded');
      } catch (error) {
        console.error('RateChart: Error loading rate history:', error);
      }
      try {
        await loadGoals();
        console.log('RateChart: Goals loaded');
      } catch (error) {
        console.error('RateChart: Error loading goals:', error);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  console.log('RateChart render:', {
    rateHistoryLength: rateHistory.length,
    goalsLength: goals?.length || 0,
  });

  const chartData = useChartData(rateHistory, goals, timeRange, movingAverageWindow);
  const yAxisConfig = useYAxisConfig(chartData, brushStartIndex, brushEndIndex, yAxisZoom);

  console.log('RateChart after hooks:', {
    chartDataLength: chartData.data?.length || 0,
    yAxisDomain: yAxisConfig.yAxisDomain,
  });

  // Initialize brush indices from chartData when they are undefined
  useEffect(() => {
    if (brushStartIndex === undefined && chartData.brushStartIndex !== undefined) {
      setBrushStartIndex(chartData.brushStartIndex);
    }
    if (brushEndIndex === undefined && chartData.brushEndIndex !== undefined) {
      setBrushEndIndex(chartData.brushEndIndex);
    }
  }, [chartData.brushStartIndex, chartData.brushEndIndex, brushStartIndex, brushEndIndex]);

  // Reset brush when timeRange changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    setYAxisZoom(null); // Reset zoom when timeRange changes
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
    console.log('RateChart: No rate history data');
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">レート推移</h2>
        <p className="text-gray-500">データがありません。Riot APIからデータを取得するか、手動でデータを追加してください。</p>
      </div>
    );
  }

  console.log('RateChart: Rendering chart container');

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

