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

    // Generate Y-axis ticks based on domain range
    const generateYTicks = () => {
      const tickSet = new Set<number>();
      const [domainMin, domainMax] = yAxisDomain;
      const domainRange = domainMax - domainMin;

      // Determine appropriate tick interval based on range
      let tickInterval: number;
      if (domainRange <= 1) {
        tickInterval = 0.1;
      } else if (domainRange <= 3) {
        tickInterval = 0.5;
      } else if (domainRange <= 10) {
        tickInterval = 1;
      } else if (domainRange <= 20) {
        tickInterval = 2;
      } else {
        tickInterval = 5;
      }

      // Generate ticks starting from the first interval at or below domainMin
      // and ending at the first interval at or above domainMax
      let startTick = Math.floor(domainMin / tickInterval) * tickInterval;
      let endTick = Math.ceil(domainMax / tickInterval) * tickInterval;
      
      // Ensure we have at least one tick below domainMin and one above domainMax
      if (startTick >= domainMin) {
        startTick -= tickInterval;
      }
      if (endTick <= domainMax) {
        endTick += tickInterval;
      }
      
      let currentTick = startTick;
      while (currentTick <= endTick) {
        const roundedTick = Math.round(currentTick * 10) / 10;
        // Only add ticks that are within or near the domain
        if (roundedTick >= domainMin - tickInterval && roundedTick <= domainMax + tickInterval) {
          tickSet.add(roundedTick);
        }
        currentTick += tickInterval;
      }

      // Always include domain boundaries
      const roundedMin = Math.round(domainMin * 10) / 10;
      const roundedMax = Math.round(domainMax * 10) / 10;
      tickSet.add(roundedMin);
      tickSet.add(roundedMax);

      // Convert Set to sorted array
      const ticks = Array.from(tickSet).sort((a, b) => a - b);

      // Ensure at least 3 ticks
      if (ticks.length < 3) {
        const midPoint = (domainMin + domainMax) / 2;
        const midTick = Math.round((Math.round(midPoint / tickInterval) * tickInterval) * 10) / 10;
        if (!tickSet.has(midTick)) {
          ticks.push(midTick);
          ticks.sort((a, b) => a - b);
        }
      }

      return ticks;
    };

    const yAxisTicks = generateYTicks();

    return {
      yAxisDomain,
      yAxisTicks,
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

