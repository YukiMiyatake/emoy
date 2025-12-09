import { useMemo } from 'react';
import { DamageChartDataResult } from './useDamageChartData';
import { YAxisZoom } from './useYAxisConfig';

export interface DamageYAxisConfig {
  yAxisDomain: [number, number];
  yAxisTicks: number[];
}

export function useDamageYAxisConfig(
  chartData: DamageChartDataResult,
  brushStartIndex: number | undefined,
  brushEndIndex: number | undefined,
  yAxisZoom: YAxisZoom | null
): DamageYAxisConfig {
  return useMemo(() => {
    if (!chartData.data || chartData.data.length === 0) {
      return {
        yAxisDomain: [0, 1000] as [number, number],
        yAxisTicks: [0, 200, 400, 600, 800, 1000],
      };
    }

    const effectiveStartIndex = brushStartIndex ?? chartData.brushStartIndex ?? 0;
    const effectiveEndIndex = brushEndIndex ?? chartData.brushEndIndex ?? chartData.data.length - 1;
    
    const displayedStart = Math.max(0, Math.min(effectiveStartIndex, chartData.data.length - 1));
    const displayedEnd = Math.max(displayedStart, Math.min(effectiveEndIndex, chartData.data.length - 1));
    const displayedData = chartData.data.slice(displayedStart, displayedEnd + 1);

    const damageValues: number[] = [];
    displayedData.forEach((d) => {
      if (!isNaN(d.damagePerMin) && d.damagePerMin !== undefined) {
        damageValues.push(d.damagePerMin);
      }
      if (!isNaN(d.movingAverage) && d.movingAverage !== undefined) {
        damageValues.push(d.movingAverage);
      }
    });

    if (damageValues.length === 0) {
      return {
        yAxisDomain: [0, 1000] as [number, number],
        yAxisTicks: [0, 200, 400, 600, 800, 1000],
      };
    }

    const minValue = Math.min(...damageValues);
    const maxValue = Math.max(...damageValues);
    const range = maxValue - minValue;

    const padding = Math.max(50, range * 0.1);
    const roundedMin = Math.floor((minValue - padding) / 50) * 50;
    const roundedMax = Math.ceil((maxValue + padding) / 50) * 50;

    const baseYAxisDomain: [number, number] = [Math.max(0, roundedMin), roundedMax];
    
    const yAxisDomain = yAxisZoom
      ? [Math.max(0, yAxisZoom.min), yAxisZoom.max] as [number, number]
      : baseYAxisDomain;

    // Generate Y-axis ticks
    const [domainMin, domainMax] = yAxisDomain;
    const domainRange = domainMax - domainMin;
    const tickCount = 6;
    const tickStep = domainRange / (tickCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(domainMin + tickStep * i));
    }

    return {
      yAxisDomain,
      yAxisTicks: ticks,
    };
  }, [
    chartData.data,
    chartData.data?.length,
    chartData.brushStartIndex,
    chartData.brushEndIndex,
    brushStartIndex,
    brushEndIndex,
    yAxisZoom,
  ]);
}

