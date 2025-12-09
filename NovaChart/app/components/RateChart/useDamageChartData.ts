import { useMemo } from 'react';
import { Match } from '@/types';
import { formatDateShort } from '@/lib/utils/date';
import { TimeRange } from './utils/timeRange';

export interface DamageChartDataPoint {
  date: string;
  dateValue: number;
  damagePerMin: number;
  movingAverage?: number;
}

export interface DamageChartDataResult {
  data: DamageChartDataPoint[];
  yAxisDomain: [number, number];
  yAxisTicks: number[];
  brushStartIndex: number | undefined;
  brushEndIndex: number | undefined;
}

function filterByTimeRange(matches: Match[], timeRange: TimeRange): Match[] {
  const now = new Date();
  let cutoffDate: Date;

  switch (timeRange) {
    case '1week':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '1month':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '1year':
      cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '5years':
      cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return matches;
  }

  return matches.filter(m => new Date(m.date) >= cutoffDate);
}

function calculateMovingAverage(data: number[], window: number): number[] {
  if (data.length === 0) return [];
  
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    result.push(sum / slice.length);
  }
  return result;
}

export function useDamageChartData(
  matches: Match[],
  timeRange: TimeRange,
  movingAverageWindow: number
): DamageChartDataResult {
  return useMemo(() => {
    const filteredMatches = filterByTimeRange(matches, timeRange);
    
    if (filteredMatches.length === 0) {
      return {
        data: [],
        yAxisDomain: [0, 1000],
        yAxisTicks: [0, 200, 400, 600, 800, 1000],
        brushStartIndex: undefined,
        brushEndIndex: undefined,
      };
    }

    // 日付順にソート
    const sorted = [...filteredMatches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ダメージ/分のデータポイントを作成
    const dataPoints: DamageChartDataPoint[] = sorted
      .filter(m => m.damageToChampions !== undefined && m.gameDuration !== undefined)
      .map((match) => {
        const dateTime = new Date(match.date).getTime();
        const date = new Date(match.date);
        const dateStr = formatDateShort(date);
        const minutes = match.gameDuration! / 60;
        const damagePerMin = match.damageToChampions! / minutes;
        return {
          date: dateStr,
          dateValue: dateTime,
          damagePerMin: Math.round(damagePerMin),
        };
      });

    if (dataPoints.length === 0) {
      return {
        data: [],
        yAxisDomain: [0, 1000],
        yAxisTicks: [0, 200, 400, 600, 800, 1000],
        brushStartIndex: undefined,
        brushEndIndex: undefined,
      };
    }

    // 移動平均を計算
    const damageValues = dataPoints.map(d => d.damagePerMin);
    const movingAvg = calculateMovingAverage(damageValues, movingAverageWindow);
    movingAvg.forEach((avg, index) => {
      if (dataPoints[index]) {
        dataPoints[index].movingAverage = Math.round(avg);
      }
    });

    // Y軸の範囲を計算
    const allValues = [...damageValues, ...movingAvg.filter(v => !isNaN(v))];
    const minValue = Math.max(0, Math.min(...allValues) - 100);
    const maxValue = Math.max(...allValues) + 100;
    
    // Y軸のティックを生成
    const range = maxValue - minValue;
    const tickCount = 6;
    const tickStep = range / (tickCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(minValue + tickStep * i));
    }

    // Brushの初期範囲（全体の80%）
    const brushStart = Math.floor(dataPoints.length * 0.1);
    const brushEnd = Math.floor(dataPoints.length * 0.9);

    return {
      data: dataPoints,
      yAxisDomain: [minValue, maxValue],
      yAxisTicks: ticks,
      brushStartIndex: dataPoints.length > 10 ? brushStart : undefined,
      brushEndIndex: dataPoints.length > 10 ? brushEnd : undefined,
    };
  }, [matches, timeRange, movingAverageWindow]);
}

