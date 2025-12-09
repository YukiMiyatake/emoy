'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useChartData } from './useChartData';
import { useCSChartData } from './useCSChartData';
import { useDamageChartData } from './useDamageChartData';
import { useYAxisConfig, YAxisZoom } from './useYAxisConfig';
import { useCSYAxisConfig } from './useCSYAxisConfig';
import { useDamageYAxisConfig } from './useDamageYAxisConfig';
import { TimeRange } from './utils/timeRange';
import ChartControls from './ChartControls';
import ChartContainer from './ChartContainer';
import CSChartContainer from './CSChartContainer';
import DamageChartContainer from './DamageChartContainer';

export type ChartType = 'lp' | 'cs' | 'damage';

export default function RateChart() {
  const rateHistory = useAppStore((state) => state.rateHistory);
  const goals = useAppStore((state) => state.goals);
  const matches = useAppStore((state) => state.matches);
  const loadRateHistory = useAppStore((state) => state.loadRateHistory);
  const loadGoals = useAppStore((state) => state.loadGoals);
  
  const [chartType, setChartType] = useState<ChartType>('lp');
  const [timeRange, setTimeRange] = useState<TimeRange>('1month');
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
  const csChartData = useCSChartData(matches, timeRange, movingAverageWindow);
  const damageChartData = useDamageChartData(matches, timeRange, movingAverageWindow);
  
  const yAxisConfig = useYAxisConfig(chartData, brushStartIndex, brushEndIndex, yAxisZoom);
  const csYAxisConfig = useCSYAxisConfig(csChartData, brushStartIndex, brushEndIndex, yAxisZoom);
  const damageYAxisConfig = useDamageYAxisConfig(damageChartData, brushStartIndex, brushEndIndex, yAxisZoom);

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
  // 1. Not yet initialized for current timeRange and chartType
  // 2. brushStartIndex/brushEndIndex are undefined (not set by user)
  // 3. chartData has valid brush indices
  useEffect(() => {
    const currentChartData = chartType === 'lp' 
      ? chartData 
      : chartType === 'cs'
      ? csChartData
      : damageChartData;
    
    // Include brushStartIndex and brushEndIndex in key to detect data reloads
    // This ensures reinitialization when data is cleared and reloaded with same length
    const timeRangeKey = `${chartType}-${timeRange}-${currentChartData.data?.length || 0}-${currentChartData.brushStartIndex ?? 'null'}-${currentChartData.brushEndIndex ?? 'null'}`;
    
    // Only initialize if not yet initialized for this timeRange/chartType and brush indices are not set by user
    if (brushInitializedRef.current !== timeRangeKey && brushStartIndexRef.current === undefined && brushEndIndexRef.current === undefined) {
      if (currentChartData.brushStartIndex !== undefined && currentChartData.brushEndIndex !== undefined) {
        setBrushStartIndex(currentChartData.brushStartIndex);
        setBrushEndIndex(currentChartData.brushEndIndex);
        brushInitializedRef.current = timeRangeKey;
      }
    }
  }, [chartType, chartData.brushStartIndex, chartData.brushEndIndex, chartData.data?.length, csChartData.brushStartIndex, csChartData.brushEndIndex, csChartData.data?.length, damageChartData.brushStartIndex, damageChartData.brushEndIndex, damageChartData.data?.length, timeRange]);

  // Reset brush when timeRange or chartType changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    brushStartIndexRef.current = undefined;
    brushEndIndexRef.current = undefined;
    setYAxisZoom(null); // Reset zoom when timeRange changes
    brushInitializedRef.current = null; // Reset initialization flag
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    brushStartIndexRef.current = undefined;
    brushEndIndexRef.current = undefined;
    setYAxisZoom(null);
    brushInitializedRef.current = null;
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
    const currentDomain =
      chartType === 'lp'
        ? yAxisConfig.yAxisDomain
        : chartType === 'cs'
        ? csYAxisConfig.yAxisDomain
        : damageYAxisConfig.yAxisDomain;

    if (!currentDomain || !Array.isArray(currentDomain)) return;
    
    let currentMin: number;
    let currentMax: number;
    if (yAxisZoom) {
      currentMin = yAxisZoom.min;
      currentMax = yAxisZoom.max;
    } else {
      [currentMin, currentMax] = currentDomain;
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
    
    // グラフタイプごとに適切なズーム幅を設定
    const minRange =
      chartType === 'lp'
        ? 50
        : chartType === 'cs'
        ? 0.5
        : 50; // damage

    const maxRange =
      chartType === 'lp'
        ? 5000
        : chartType === 'cs'
        ? 100
        : 5000;
    newRange = Math.max(minRange, Math.min(maxRange, newRange));
    
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = center + newRange / 2;
    
    setYAxisZoom({ min: newMin, max: newMax });
  }, [chartType, yAxisConfig.yAxisDomain, csYAxisConfig.yAxisDomain, damageYAxisConfig.yAxisDomain, yAxisZoom]);

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

  const hasData = chartType === 'lp' 
    ? rateHistory.length > 0 
    : chartType === 'cs'
    ? matches.filter(m => m.csPerMin !== undefined).length > 0
    : matches.filter(m => m.damageToChampions !== undefined && m.gameDuration !== undefined).length > 0;

  const title =
    chartType === 'lp'
      ? 'LP推移'
      : chartType === 'cs'
      ? 'CS推移'
      : 'ダメージ推移';

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">
          {chartType === 'lp' 
            ? 'データがありません。Riot APIからデータを取得するか、手動でデータを追加してください。'
            : chartType === 'cs'
            ? 'CS/分のデータがありません。試合詳細データを取得してください。'
            : 'ダメージ/分のデータがありません。試合詳細データを取得してください。'}
        </p>
      </div>
    );
  }

  const getCurrentChartData = () => {
    switch (chartType) {
      case 'lp':
        return chartData;
      case 'cs':
        return csChartData;
      case 'damage':
        return damageChartData;
    }
  };

  const currentChartData = getCurrentChartData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* タブ */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleChartTypeChange('lp')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            chartType === 'lp'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          LP推移
        </button>
        <button
          onClick={() => handleChartTypeChange('cs')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            chartType === 'cs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          CS推移
        </button>
        <button
          onClick={() => handleChartTypeChange('damage')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            chartType === 'damage'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ダメージ推移
        </button>
      </div>

      <ChartControls
        timeRange={timeRange}
        movingAverageWindow={movingAverageWindow}
        yAxisZoom={yAxisZoom}
        onTimeRangeChange={handleTimeRangeChange}
        onMovingAverageWindowChange={setMovingAverageWindow}
        onYAxisZoomReset={() => setYAxisZoom(null)}
      />
      
      {chartType === 'lp' && (
        <ChartContainer
          chartData={chartData}
          yAxisConfig={yAxisConfig}
          movingAverageWindow={movingAverageWindow}
          brushStartIndex={brushStartIndex}
          brushEndIndex={brushEndIndex}
          hiddenLines={hiddenLines}
          yAxisZoom={yAxisZoom}
          timeRange={timeRange}
          onBrushChange={(start, end) => {
            setBrushStartIndex(start);
            setBrushEndIndex(end);
            brushStartIndexRef.current = start;
            brushEndIndexRef.current = end;
            setYAxisZoom(null);
            const timeRangeKey = `${chartType}-${timeRange}-${chartData.data?.length || 0}-${chartData.brushStartIndex ?? 'null'}-${chartData.brushEndIndex ?? 'null'}`;
            brushInitializedRef.current = timeRangeKey;
          }}
          onLegendClick={handleLegendClick}
          onYAxisZoom={handleYAxisZoom}
        />
      )}
      
      {chartType === 'cs' && (
        <CSChartContainer
          chartData={csChartData}
          yAxisConfig={csYAxisConfig}
          movingAverageWindow={movingAverageWindow}
          brushStartIndex={brushStartIndex}
          brushEndIndex={brushEndIndex}
          hiddenLines={hiddenLines}
          yAxisZoom={yAxisZoom}
          timeRange={timeRange}
          onBrushChange={(start, end) => {
            setBrushStartIndex(start);
            setBrushEndIndex(end);
            brushStartIndexRef.current = start;
            brushEndIndexRef.current = end;
            setYAxisZoom(null);
            const timeRangeKey = `${chartType}-${timeRange}-${csChartData.data?.length || 0}-${csChartData.brushStartIndex ?? 'null'}-${csChartData.brushEndIndex ?? 'null'}`;
            brushInitializedRef.current = timeRangeKey;
          }}
          onLegendClick={handleLegendClick}
          onYAxisZoom={handleYAxisZoom}
        />
      )}
      
      {chartType === 'damage' && (
        <DamageChartContainer
          chartData={damageChartData}
          yAxisConfig={damageYAxisConfig}
          movingAverageWindow={movingAverageWindow}
          brushStartIndex={brushStartIndex}
          brushEndIndex={brushEndIndex}
          hiddenLines={hiddenLines}
          yAxisZoom={yAxisZoom}
          timeRange={timeRange}
          onBrushChange={(start, end) => {
            setBrushStartIndex(start);
            setBrushEndIndex(end);
            brushStartIndexRef.current = start;
            brushEndIndexRef.current = end;
            setYAxisZoom(null);
            const timeRangeKey = `${chartType}-${timeRange}-${damageChartData.data?.length || 0}-${damageChartData.brushStartIndex ?? 'null'}-${damageChartData.brushEndIndex ?? 'null'}`;
            brushInitializedRef.current = timeRangeKey;
          }}
          onLegendClick={handleLegendClick}
          onYAxisZoom={handleYAxisZoom}
        />
      )}
    </div>
  );
}

