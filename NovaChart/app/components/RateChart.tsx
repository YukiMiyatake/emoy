'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import { useAppStore } from '@/lib/store/useAppStore';
import { tierRankToLP, lpToTierRank } from '@/lib/riot/client';
import { calculateMovingAverage, generatePredictionPoints } from '@/lib/analytics/prediction';
import { Goal, RateHistory } from '@/types';

interface ChartDataPoint {
  date: string;
  dateValue: number; // Numeric date value for X-axis domain control
  lp: number;
  movingAverage?: number;
  predictedLP?: number;
  goalLP?: number;
  originalEntry?: RateHistory;
}

type TimeRange = 'all' | '5years' | '1year' | '1month' | '1week';

export default function RateChart() {
  const { rateHistory, goals, clearRateHistory } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isResetting, setIsResetting] = useState(false);
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>(undefined);
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>(undefined);
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(7);
  const [yAxisZoom, setYAxisZoom] = useState<{ min: number; max: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset brush when timeRange changes
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
  };

  // Chart data should use ALL data, not filtered data
  // The time range filter only affects the initial brush position
  const chartData = useMemo(() => {
    if (rateHistory.length === 0) {
      return { 
        data: [], 
        yAxisDomain: [0, 2800], 
        yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
        xAxisDomain: [0, Date.now()],
        brushStartIndex: undefined,
        brushEndIndex: undefined,
      };
    }

    // Sort by date (oldest first) - use ALL data
    const sorted = [...rateHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('[RateChart] Processing rate history:', sorted.length, 'entries');
    console.log('[RateChart] First entry:', sorted[0]);
    console.log('[RateChart] Last entry:', sorted[sorted.length - 1]);

    // Create data points with full date info for sorting
    const dataPoints: (ChartDataPoint & { dateTime: number; originalEntry: RateHistory })[] = sorted.map((entry) => {
      const dateTime = new Date(entry.date).getTime();
      const totalLP = tierRankToLP(entry.tier, entry.rank, entry.lp);
      const date = new Date(entry.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${month}/${day}`;
      console.log(`[RateChart] Entry: ${dateStr} - ${entry.tier} ${entry.rank} ${entry.lp}LP = Total LP: ${totalLP}`);
      return {
        date: dateStr,
        dateValue: dateTime,
        dateTime,
        lp: totalLP,
        originalEntry: entry,
      };
    });

    // Add moving average
    const movingAvg = calculateMovingAverage(sorted, movingAverageWindow);
    movingAvg.forEach((avg, index) => {
      if (dataPoints[index]) {
        dataPoints[index].movingAverage = avg.value;
      }
    });

    // Add prediction points
    const predictions = generatePredictionPoints(sorted, 30);
    const predictionPoints: (ChartDataPoint & { dateTime: number })[] = predictions.map((pred) => {
      const dateTime = new Date(pred.date).getTime();
      const date = new Date(pred.date);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${month}/${day}`;
      return {
        date: dateStr,
        dateValue: dateTime,
        dateTime,
        lp: NaN,
        predictedLP: pred.predictedLP,
      };
    });

    // Add goal lines for all goals
    // Store goal data separately for rendering multiple goal lines
    const goalData = (Array.isArray(goals) ? goals : []).map(goal => ({
      goal,
      goalLP: tierRankToLP(goal.targetTier, goal.targetRank, goal.targetLP),
      targetDate: new Date(goal.targetDate).getTime(),
    })).sort((a, b) => a.targetDate - b.targetDate);

    // Add goal date points to ensure X-axis extends to goal dates
    const goalDatePoints: (ChartDataPoint & { dateTime: number })[] = Array.isArray(goalData) ? goalData.map((goalItem) => {
      const goalDate = new Date(goalItem.targetDate);
      const month = goalDate.getMonth() + 1;
      const day = goalDate.getDate();
      const dateStr = `${month}/${day}`;
      return {
        date: dateStr,
        dateValue: goalItem.targetDate,
        dateTime: goalItem.targetDate,
        lp: NaN, // No LP value, just for X-axis extension
      };
    }) : [];

    // Combine and sort by dateTime
    const combined = [...(Array.isArray(dataPoints) ? dataPoints : []), ...(Array.isArray(predictionPoints) ? predictionPoints : []), ...goalDatePoints].sort((a, b) => a.dateTime - b.dateTime);
    
    // Remove dateTime before returning (not needed for chart, but keep dateValue)
    const finalData = combined.map(({ dateTime, originalEntry, ...rest }) => rest);
    
    // Calculate X-axis domain based on time range
    const now = Date.now();
    let xAxisDomain: [number, number];
    
    // Find the latest goal date
    const latestGoalDate = goalData.length > 0 
      ? Math.max(...goalData.map(g => g.targetDate))
      : null;
    
    if (timeRange === 'all') {
      // Show all data, extending to latest goal date if it exists
      const minDate = finalData.length > 0 ? Math.min(...finalData.map(d => d.dateValue)) : now;
      const maxDate = finalData.length > 0 ? Math.max(...finalData.map(d => d.dateValue)) : now;
      // Extend to latest goal date if it's later than maxDate
      const extendedMaxDate = latestGoalDate && latestGoalDate > maxDate ? latestGoalDate : maxDate;
      xAxisDomain = [minDate, extendedMaxDate];
    } else {
      // Calculate start date based on time range
      let startDate: number;
      switch (timeRange) {
        case '5years':
          startDate = new Date(now).setFullYear(new Date(now).getFullYear() - 5);
          break;
        case '1year':
          startDate = new Date(now).setFullYear(new Date(now).getFullYear() - 1);
          break;
        case '1month':
          startDate = new Date(now).setMonth(new Date(now).getMonth() - 1);
          break;
        case '1week':
          startDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          startDate = now;
      }
      
      // Find the actual data range within the filtered data
      const dataMinDate = finalData.length > 0 ? Math.min(...finalData.map(d => d.dateValue)) : now;
      const dataMaxDate = finalData.length > 0 ? Math.max(...finalData.map(d => d.dateValue)) : now;
      
      // Set domain to show from startDate to now (or data max, whichever is later)
      // But ensure we show at least the filtered data range
      // Also extend to latest goal date if it exists
      const domainStart = Math.min(startDate, dataMinDate);
      let domainEnd = Math.max(now, dataMaxDate);
      if (latestGoalDate && latestGoalDate > domainEnd) {
        domainEnd = latestGoalDate;
      }
      
      xAxisDomain = [domainStart, domainEnd];
    }
    
    // Calculate Y-axis domain (min and max LP values)
    const lpValues = finalData
      .map(d => d.lp)
      .filter(lp => !isNaN(lp));
    
    if (lpValues.length === 0) {
      return { 
        data: finalData, 
        yAxisDomain: [0, 2800], 
        yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
        xAxisDomain,
      };
    }
    
    const minLP = Math.min(...lpValues);
    const maxLP = Math.max(...lpValues);
    const range = maxLP - minLP;
    
    // Calculate appropriate padding (5% of range, minimum 20) - reduced padding for tighter fit
    const padding = Math.max(20, range * 0.05);
    
    // Round down min and round up max to nearest 25 for cleaner display
    const roundedMin = Math.floor((minLP - padding) / 25) * 25;
    const roundedMax = Math.ceil((maxLP + padding) / 25) * 25;
    
    // Use zoom state if available, otherwise use calculated domain
    const baseYAxisDomain = [Math.max(0, roundedMin), roundedMax];
    const yAxisDomain = yAxisZoom 
      ? [Math.max(0, yAxisZoom.min), yAxisZoom.max]
      : baseYAxisDomain;
    
    // Generate Y-axis ticks based on data range
    const generateYTicks = () => {
      const ticks: number[] = [];
      const domainRange = roundedMax - roundedMin;
      
      // Determine tick interval based on range
      let tickInterval: number;
      if (domainRange <= 200) {
        tickInterval = 25; // Small range: every 25 LP
      } else if (domainRange <= 500) {
        tickInterval = 50; // Medium range: every 50 LP
      } else if (domainRange <= 1000) {
        tickInterval = 100; // Large range: every 100 LP (rank boundaries)
      } else {
        tickInterval = 200; // Very large range: every 200 LP
      }
      
      // Generate ticks at appropriate intervals
      let currentTick = Math.ceil(roundedMin / tickInterval) * tickInterval;
      while (currentTick <= roundedMax) {
        ticks.push(currentTick);
        currentTick += tickInterval;
      }
      
      // Ensure we have at least 3 ticks
      if (ticks.length < 3) {
        const midPoint = (roundedMin + roundedMax) / 2;
        ticks.push(Math.round(midPoint / tickInterval) * tickInterval);
        ticks.sort((a, b) => a - b);
      }
      
      return ticks;
    };
    
    const yAxisTicks = generateYTicks();
    
    // Calculate brush start/end indices based on time range
    // When time range is not 'all', show the most recent data (right side)
    // Brush can scroll through ALL data, but initial position is set by time range
    let brushStart: number | undefined = undefined;
    let brushEnd: number | undefined = undefined;
    
    if (timeRange !== 'all' && finalData.length > 0) {
      const now = Date.now();
      let targetStartDate: number;
      
      switch (timeRange) {
        case '5years':
          targetStartDate = new Date(now).setFullYear(new Date(now).getFullYear() - 5);
          break;
        case '1year':
          targetStartDate = new Date(now).setFullYear(new Date(now).getFullYear() - 1);
          break;
        case '1month':
          targetStartDate = new Date(now).setMonth(new Date(now).getMonth() - 1);
          break;
        case '1week':
          targetStartDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          targetStartDate = now;
      }
      
      // Find the index of the first data point >= targetStartDate
      let startIdx = finalData.findIndex(d => d.dateValue >= targetStartDate);
      if (startIdx === -1) {
        // If no data point is >= targetStartDate, show all data from the beginning
        startIdx = 0;
      }
      
      // Always end at the last data point (most recent)
      brushStart = startIdx;
      brushEnd = finalData.length - 1;
      
      // Ensure we have at least some data visible
      if (brushEnd - brushStart < 2 && finalData.length > 0) {
        // If the range is too small, show at least the last 10% of data
        const minVisiblePoints = Math.max(2, Math.floor(finalData.length * 0.1));
        brushStart = Math.max(0, finalData.length - minVisiblePoints);
        brushEnd = finalData.length - 1;
      }
    }
    
    console.log('[RateChart] Final chart data points:', finalData.length);
    console.log('[RateChart] Y-axis domain:', yAxisDomain);
    console.log('[RateChart] Y-axis ticks:', yAxisTicks);
    console.log('[RateChart] X-axis domain:', xAxisDomain);
    console.log('[RateChart] Brush start:', brushStart, 'end:', brushEnd);
    console.log('[RateChart] Sample data:', finalData.slice(0, 3));
    
    return { 
      data: finalData, 
      yAxisDomain, 
      yAxisTicks, 
      xAxisDomain,
      brushStartIndex: brushStart,
      brushEndIndex: brushEnd,
      goalData,
    };
  }, [rateHistory, goals, timeRange, movingAverageWindow, yAxisZoom]);

  // Handle Y-axis zoom (defined after chartData)
  const handleYAxisZoom = useCallback((zoomIn: boolean) => {
    if (!chartData.yAxisDomain || !Array.isArray(chartData.yAxisDomain)) return;
    
    // Get current domain: use yAxisZoom if set, otherwise use chartData.yAxisDomain
    let currentMin: number;
    let currentMax: number;
    if (yAxisZoom) {
      currentMin = yAxisZoom.min;
      currentMax = yAxisZoom.max;
    } else {
      [currentMin, currentMax] = chartData.yAxisDomain;
    }
    
    const currentRange = currentMax - currentMin;
    const center = (currentMin + currentMax) / 2;
    const zoomFactor = 0.1; // 10% zoom per action
    
    let newRange: number;
    if (zoomIn) {
      // Zoom in
      newRange = currentRange * (1 - zoomFactor);
    } else {
      // Zoom out
      newRange = currentRange * (1 + zoomFactor);
    }
    
    // Limit zoom range (min 50 LP, max 5000 LP)
    const minRange = 50;
    const maxRange = 5000;
    newRange = Math.max(minRange, Math.min(maxRange, newRange));
    
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = center + newRange / 2;
    
    setYAxisZoom({ min: newMin, max: newMax });
  }, [chartData.yAxisDomain, yAxisZoom]);

  // Handle keyboard events for numpad +/-
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if numpad + or - is pressed
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        // Zoom in
        handleYAxisZoom(true);
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        // Zoom out
        handleYAxisZoom(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleYAxisZoom]);

  // Handle mouse wheel on chart container
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle if mouse is over the chart area
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      const zoomIn = delta < 0; // Scroll up = zoom in
      handleYAxisZoom(zoomIn);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">レート推移</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">移動平均:</label>
            <input
              type="number"
              min="1"
              max="30"
              value={movingAverageWindow}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= 1 && value <= 30) {
                  setMovingAverageWindow(value);
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">日</span>
          </div>
          <button
            onClick={() => setYAxisZoom(null)}
            disabled={!yAxisZoom}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Y軸のズームをリセット"
          >
            Y軸リセット
          </button>
          <select
            value={timeRange}
            onChange={(e) => {
              handleTimeRangeChange(e.target.value as TimeRange);
              setYAxisZoom(null); // Reset zoom when time range changes
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">無限</option>
            <option value="5years">5年</option>
            <option value="1year">1年</option>
            <option value="1month">1か月</option>
            <option value="1week">1週間</option>
          </select>
          <button
            onClick={async () => {
              if (confirm('レート推移データをすべて削除しますか？この操作は取り消せません。')) {
                setIsResetting(true);
                try {
                  await clearRateHistory();
                  alert('レート推移データをリセットしました。');
                } catch (error) {
                  alert('リセットに失敗しました。');
                  console.error('Failed to reset rate history:', error);
                } finally {
                  setIsResetting(false);
                }
              }
            }}
            disabled={isResetting || rateHistory.length === 0}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isResetting ? 'リセット中...' : 'データリセット'}
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full">
        <ResponsiveContainer width="100%" height={600}>
        <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 80, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            type="category"
            allowDuplicatedCategory={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            domain={yAxisZoom ? [yAxisZoom.min, yAxisZoom.max] : chartData.yAxisDomain}
            ticks={chartData.yAxisTicks}
            tickFormatter={(value: number) => {
              if (isNaN(value)) return '';
              const tierRank = lpToTierRank(value);
              
              // Master tier and above - show as is
              if (tierRank.tier === 'MASTER' || tierRank.tier === 'GRANDMASTER' || tierRank.tier === 'CHALLENGER') {
                return tierRank.tier;
              }
              
              // Convert tier names to English
              const tierNames: Record<string, string> = {
                'IRON': 'Iron',
                'BRONZE': 'Bronze',
                'SILVER': 'Silver',
                'GOLD': 'Gold',
                'PLATINUM': 'Platinum',
                'EMERALD': 'Emerald',
                'DIAMOND': 'Diamond',
              };
              
              const tierName = tierNames[tierRank.tier] || tierRank.tier;
              
              // Convert rank numbers (IV=4, III=3, II=2, I=1)
              const rankNumbers: Record<string, string> = {
                'IV': '4',
                'III': '3',
                'II': '2',
                'I': '1',
              };
              
              const rankNumber = rankNumbers[tierRank.rank] || '';
              
              // Only show if rank exists (don't show tier only)
              if (rankNumber && tierRank.lp < 5) {
                return `${tierName} ${rankNumber}`;
              }
              
              // If no rank, return empty string to hide the tick
              return '';
            }}
            width={90}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              if (isNaN(value)) return 'N/A';
              if (name === 'Total LP' && props.payload.originalEntry) {
                const entry = props.payload.originalEntry;
                return `${entry.tier} ${entry.rank} ${entry.lp}LP (Total LP: ${Math.round(value)})`;
              }
              return Math.round(value);
            }}
            labelFormatter={(label) => `日付: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="lp"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Total LP"
            dot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name={`移動平均 (${movingAverageWindow}日)`}
            dot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predictedLP"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="3 3"
            name="予測"
            dot={false}
            connectNulls={false}
          />
          {Array.isArray(chartData.goalData) && chartData.goalData.map((goalItem, index) => {
            // Find the data point closest to the goal date
            let closestDateStr = '';
            let minDiff = Infinity;
            
            chartData.data.forEach(d => {
              const diff = Math.abs(d.dateValue - goalItem.targetDate);
              if (diff < minDiff) {
                minDiff = diff;
                closestDateStr = d.date;
              }
            });
            
            // If no data point found, create a date string from goal date
            if (!closestDateStr) {
              const goalDate = new Date(goalItem.targetDate);
              closestDateStr = `${goalDate.getMonth() + 1}/${goalDate.getDate()}`;
            }
            
            return (
              <ReferenceLine
                key={goalItem.goal.id || index}
                x={closestDateStr}
                y={goalItem.goalLP}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="10 5"
                label={{
                  value: `${goalItem.goal.targetTier} ${goalItem.goal.targetRank} ${goalItem.goal.targetLP}LP`,
                  position: 'top',
                  fill: '#ef4444',
                  fontSize: 12,
                }}
              />
            );
          })}
          <Brush
            dataKey="date"
            height={30}
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
            travellerWidth={12}
            startIndex={brushStartIndex ?? chartData.brushStartIndex}
            endIndex={brushEndIndex ?? chartData.brushEndIndex}
            onChange={(brushData: any) => {
              if (brushData && typeof brushData.startIndex === 'number' && typeof brushData.endIndex === 'number') {
                setBrushStartIndex(brushData.startIndex);
                setBrushEndIndex(brushData.endIndex);
              }
            }}
            traveller={(props: any) => {
              const { x, y, width, height } = props;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill="#1e40af"
                  stroke="#1e3a8a"
                  strokeWidth={2}
                  rx={2}
                />
              );
            }}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

