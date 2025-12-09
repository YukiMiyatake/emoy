import { useMemo } from 'react';
import { CSChartDataResult } from './useCSChartData';
import { YAxisZoom } from './useYAxisConfig';

export interface CSYAxisConfig {
  yAxisDomain: [number, number];
  yAxisTicks: number[];
}

export function useCSYAxisConfig(
  chartData: CSChartDataResult,
  brushStartIndex: number | undefined,
  brushEndIndex: number | undefined,
  yAxisZoom: YAxisZoom | null
): CSYAxisConfig {
  return useMemo(() => {
    if (!chartData.data || chartData.data.length === 0) {
      return {
        yAxisDomain: [0, 10] as [number, number],
        yAxisTicks: [0, 2, 4, 6, 8, 10],
      };
    }

    const effectiveStartIndex = brushStartIndex ?? chartData.brushStartIndex ?? 0;
    const effectiveEndIndex = brushEndIndex ?? chartData.brushEndIndex ?? chartData.data.length - 1;
    
    const displayedStart = Math.max(0, Math.min(effectiveStartIndex, chartData.data.length - 1));
    const displayedEnd = Math.max(displayedStart, Math.min(effectiveEndIndex, chartData.data.length - 1));
    const displayedData = chartData.data.slice(displayedStart, displayedEnd + 1);

    const csValues: number[] = [];
    displayedData.forEach((d) => {
      if (!isNaN(d.csPerMin) && d.csPerMin !== undefined) {
        csValues.push(d.csPerMin);
      }
      if (!isNaN(d.movingAverage) && d.movingAverage !== undefined) {
        csValues.push(d.movingAverage);
      }
    });

    if (csValues.length === 0) {
      return {
        yAxisDomain: [0, 10] as [number, number],
        yAxisTicks: [0, 2, 4, 6, 8, 10],
      };
    }

    const minValue = Math.min(...csValues);
    const maxValue = Math.max(...csValues);
    const range = maxValue - minValue;

    const padding = Math.max(0.5, range * 0.1);
    const roundedMin = Math.floor((minValue - padding) * 10) / 10;
    const roundedMax = Math.ceil((maxValue + padding) * 10) / 10;

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
      ticks.push(Math.round((domainMin + tickStep * i) * 10) / 10);
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

