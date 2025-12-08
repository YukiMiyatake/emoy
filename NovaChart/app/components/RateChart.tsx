'use client';

import { useMemo, useState } from 'react';
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
} from 'recharts';
import { useAppStore } from '@/lib/store/useAppStore';
import { tierRankToLP, lpToTierRank } from '@/lib/riot/client';
import { calculateMovingAverage, generatePredictionPoints } from '@/lib/analytics/prediction';
import { Goal, RateHistory } from '@/types';

interface ChartDataPoint {
  date: string;
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

  // Filter rate history by time range
  const filteredRateHistory = useMemo(() => {
    if (rateHistory.length === 0) {
      return [];
    }

    if (timeRange === 'all') {
      return rateHistory;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '5years':
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '1week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        return rateHistory;
    }

    return rateHistory.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });
  }, [rateHistory, timeRange]);

  const chartData = useMemo(() => {
    if (filteredRateHistory.length === 0) {
      return { data: [], yAxisDomain: [0, 2800], yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800] };
    }

    // Sort by date (oldest first)
    const sorted = [...filteredRateHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('[RateChart] Processing rate history:', sorted.length, 'entries');
    console.log('[RateChart] First entry:', sorted[0]);
    console.log('[RateChart] Last entry:', sorted[sorted.length - 1]);

    // Create data points with full date info for sorting
    const dataPoints: (ChartDataPoint & { dateTime: number; originalEntry: RateHistory })[] = sorted.map((entry) => {
      const dateTime = new Date(entry.date).getTime();
      const totalLP = tierRankToLP(entry.tier, entry.rank, entry.lp);
      console.log(`[RateChart] Entry: ${new Date(entry.date).toLocaleDateString('ja-JP')} - ${entry.tier} ${entry.rank} ${entry.lp}LP = Total LP: ${totalLP}`);
      return {
        date: new Date(entry.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        dateTime,
        lp: totalLP,
        originalEntry: entry,
      };
    });

    // Add moving average
    const movingAvg = calculateMovingAverage(sorted, 7);
    movingAvg.forEach((avg, index) => {
      if (dataPoints[index]) {
        dataPoints[index].movingAverage = avg.value;
      }
    });

    // Add prediction points
    const predictions = generatePredictionPoints(sorted, 30);
    const predictionPoints: (ChartDataPoint & { dateTime: number })[] = predictions.map((pred) => {
      const dateTime = new Date(pred.date).getTime();
      return {
        date: new Date(pred.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        dateTime,
        lp: NaN,
        predictedLP: pred.predictedLP,
      };
    });

    // Add goal line
    const activeGoal = goals.find((g) => g.isActive);
    if (activeGoal) {
      const goalLP = tierRankToLP(activeGoal.targetTier, activeGoal.targetRank, activeGoal.targetLP);
      dataPoints.forEach((point) => {
        point.goalLP = goalLP;
      });
      predictionPoints.forEach((point) => {
        point.goalLP = goalLP;
      });
    }

    // Combine and sort by dateTime
    const combined = [...dataPoints, ...predictionPoints].sort((a, b) => a.dateTime - b.dateTime);
    
    // Remove dateTime before returning (not needed for chart)
    const finalData = combined.map(({ dateTime, originalEntry, ...rest }) => rest);
    
    // Calculate Y-axis domain (min and max LP values)
    const lpValues = finalData
      .map(d => d.lp)
      .filter(lp => !isNaN(lp));
    
    if (lpValues.length === 0) {
      return { data: finalData, yAxisDomain: [0, 2800], yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800] };
    }
    
    const minLP = Math.min(...lpValues);
    const maxLP = Math.max(...lpValues);
    const range = maxLP - minLP;
    
    // Calculate appropriate padding (10% of range, minimum 50)
    const padding = Math.max(50, range * 0.1);
    
    // Round down min and round up max to nearest 50 for cleaner display
    const roundedMin = Math.floor((minLP - padding) / 50) * 50;
    const roundedMax = Math.ceil((maxLP + padding) / 50) * 50;
    
    const yAxisDomain = [Math.max(0, roundedMin), roundedMax];
    
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
    
    console.log('[RateChart] Final chart data points:', finalData.length);
    console.log('[RateChart] Y-axis domain:', yAxisDomain);
    console.log('[RateChart] Y-axis ticks:', yAxisTicks);
    console.log('[RateChart] Sample data:', finalData.slice(0, 3));
    
    return { data: finalData, yAxisDomain, yAxisTicks };
  }, [filteredRateHistory, goals]);

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
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
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
      {filteredRateHistory.length === 0 && rateHistory.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          選択した期間にデータがありません。期間を変更してください。
        </p>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            domain={chartData.yAxisDomain}
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
            name="移動平均 (7日)"
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
          <Line
            type="monotone"
            dataKey="goalLP"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="10 5"
            name="目標"
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

