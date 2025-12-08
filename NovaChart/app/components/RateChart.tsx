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
import { tierRankToLP } from '@/lib/riot/client';
import { calculateMovingAverage, generatePredictionPoints } from '@/lib/analytics/prediction';
import { Goal, RateHistory } from '@/types';

interface ChartDataPoint {
  date: string;
  lp: number;
  movingAverage?: number;
  predictedLP?: number;
  goalLP?: number;
}

type TimeRange = 'all' | '5years' | '1year' | '1month' | '1week';

export default function RateChart() {
  const { rateHistory, goals } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

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
      return [];
    }

    const sorted = [...filteredRateHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dataPoints: ChartDataPoint[] = sorted.map((entry) => ({
      date: new Date(entry.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      lp: tierRankToLP(entry.tier, entry.rank, entry.lp),
    }));

    // Add moving average
    const movingAvg = calculateMovingAverage(sorted, 7);
    movingAvg.forEach((avg, index) => {
      if (dataPoints[index]) {
        dataPoints[index].movingAverage = avg.value;
      }
    });

    // Add prediction points
    const predictions = generatePredictionPoints(sorted, 30);
    const predictionPoints: ChartDataPoint[] = predictions.map((pred) => ({
      date: new Date(pred.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      lp: NaN,
      predictedLP: pred.predictedLP,
    }));

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

    // Combine data points with prediction points
    return [...dataPoints, ...predictionPoints];
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
        </div>
      </div>
      {filteredRateHistory.length === 0 && rateHistory.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          選択した期間にデータがありません。期間を変更してください。
        </p>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => {
              if (isNaN(value)) return 'N/A';
              return Math.round(value);
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="lp"
            stroke="#3b82f6"
            strokeWidth={2}
            name="LP"
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

