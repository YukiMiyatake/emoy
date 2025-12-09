'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    const loadData = async () => {
      try {
        await loadRateHistory();
      } catch (error) {
        console.error('RateChart: Error loading rate history:', error);
      }
      try {
        await loadGoals();
      } catch (error) {
        console.error('RateChart: Error loading goals:', error);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  const chartData = useChartData(rateHistory, goals, timeRange, movingAverageWindow);
  const yAxisConfig = useYAxisConfig(chartData, brushStartIndex, brushEndIndex, yAxisZoom);

  // Track if brush has been initialized or manually set by user
  const brushInitializedRef = useRef<string | null>(null); // Store timeRange key to track initialization per timeRange
  const brushStartIndexRef = useRef<number | undefined>(brushStartIndex);
  const brushEndIndexRef = useRef<number | undefined>(brushEndIndex);
  
  // Keep refs in sync with state
  useEffect(() => {
    brushStartIndexRef.current = brushStartIndex;
    brushEndIndexRef.current = brushEndIndex;
  }, [brushStartIndex, brushEndIndex]);
  
  // Initialize brush indices from chartData only when:
  // 1. Not yet initialized for current timeRange
  // 2. brushStartIndex/brushEndIndex are undefined (not set by user)
  // 3. chartData has valid brush indices
  useEffect(() => {
    // Include brushStartIndex and brushEndIndex in key to detect data reloads
    // This ensures reinitialization when data is cleared and reloaded with same length
    const timeRangeKey = `${timeRange}-${chartData.data?.length || 0}-${chartData.brushStartIndex ?? 'null'}-${chartData.brushEndIndex ?? 'null'}`;
    
    // Only initialize if not yet initialized for this timeRange and brush indices are not set by user
    if (brushInitializedRef.current !== timeRangeKey && brushStartIndexRef.current === undefined && brushEndIndexRef.current === undefined) {
      if (chartData.brushStartIndex !== undefined && chartData.brushEndIndex !== undefined) {
        setBrushStartIndex(chartData.brushStartIndex);
        setBrushEndIndex(chartData.brushEndIndex);
        brushInitializedRef.current = timeRangeKey;
      }
    }
  }, [chartData.brushStartIndex, chartData.brushEndIndex, chartData.data?.length, timeRange]); // Remove brushStartIndex/brushEndIndex from deps to avoid race conditions

  // Reset brush when timeRange changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    brushStartIndexRef.current = undefined;
    brushEndIndexRef.current = undefined;
    setYAxisZoom(null); // Reset zoom when timeRange changes
    brushInitializedRef.current = null; // Reset initialization flag
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
          brushStartIndexRef.current = start;
          brushEndIndexRef.current = end;
          // When brush changes, we want Y-axis to update to the new range
          // If yAxisZoom is set, we reset it to allow automatic adjustment
          // Alternatively, we could update yAxisZoom to match the new range, but resetting is simpler
          setYAxisZoom(null);
          // Mark as initialized when user moves brush to prevent auto-initialization from overriding
          // Use same key format as initialization check
          const timeRangeKey = `${timeRange}-${chartData.data?.length || 0}-${chartData.brushStartIndex ?? 'null'}-${chartData.brushEndIndex ?? 'null'}`;
          brushInitializedRef.current = timeRangeKey;
        }}
        onLegendClick={handleLegendClick}
        onYAxisZoom={handleYAxisZoom}
      />
    </div>
  );
}

