'use client';

import { useMemo } from 'react';
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
import { Goal } from '@/types';

interface ChartDataPoint {
  date: string;
  lp: number;
  movingAverage?: number;
  predictedLP?: number;
  goalLP?: number;
}

export default function RateChart() {
  const { rateHistory, goals } = useAppStore();

  const chartData = useMemo(() => {
    if (rateHistory.length === 0) {
      return [];
    }

    const sorted = [...rateHistory].sort(
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
  }, [rateHistory, goals]);

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
      <h2 className="text-2xl font-bold mb-4">レート推移</h2>
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

