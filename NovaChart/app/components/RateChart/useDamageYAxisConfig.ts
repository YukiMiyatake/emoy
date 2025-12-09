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

    // Generate Y-axis ticks based on domain range
    const generateYTicks = () => {
      const tickSet = new Set<number>();
      const [domainMin, domainMax] = yAxisDomain;
      const domainRange = domainMax - domainMin;

      // Determine appropriate tick interval based on range
      let tickInterval: number;
      if (domainRange <= 200) {
        tickInterval = 25;
      } else if (domainRange <= 500) {
        tickInterval = 50;
      } else if (domainRange <= 1000) {
        tickInterval = 100;
      } else if (domainRange <= 2000) {
        tickInterval = 200;
      } else {
        tickInterval = 500;
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
        const roundedTick = Math.round(currentTick);
        // Only add ticks that are within or near the domain
        if (roundedTick >= domainMin - tickInterval && roundedTick <= domainMax + tickInterval) {
          tickSet.add(roundedTick);
        }
        currentTick += tickInterval;
      }

      // Always include domain boundaries
      const roundedMin = Math.round(domainMin);
      const roundedMax = Math.round(domainMax);
      tickSet.add(roundedMin);
      tickSet.add(roundedMax);

      // Convert Set to sorted array
      const ticks = Array.from(tickSet).sort((a, b) => a - b);

      // Ensure at least 3 ticks
      if (ticks.length < 3) {
        const midPoint = (domainMin + domainMax) / 2;
        const midTick = Math.round(Math.round(midPoint / tickInterval) * tickInterval);
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

