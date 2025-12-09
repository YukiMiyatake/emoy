import { useMemo, useCallback } from 'react';
import { ChartDataResult } from './useChartData';

export interface YAxisConfig {
  yAxisDomain: [number, number];
  yAxisTicks: number[];
}

export interface YAxisZoom {
  min: number;
  max: number;
}

export function useYAxisConfig(
  chartData: ChartDataResult,
  brushStartIndex: number | undefined,
  brushEndIndex: number | undefined,
  yAxisZoom: YAxisZoom | null,
  ignoreYAxisZoom?: boolean // When true, ignore yAxisZoom and use baseYAxisDomain
): YAxisConfig {
  const config = useMemo(() => {
    if (!chartData.data || chartData.data.length === 0) {
      return {
        yAxisDomain: [0, 2800] as [number, number],
        yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
      };
    }

    // Determine displayed data range based on Brush selection
    // Use the same logic as ChartContainer: brushStartIndex ?? chartData.brushStartIndex
    // This ensures we use the actual displayed range, regardless of timeRange
    const effectiveStartIndex = brushStartIndex ?? chartData.brushStartIndex ?? 0;
    const effectiveEndIndex = brushEndIndex ?? chartData.brushEndIndex ?? chartData.data.length - 1;
    
    // Ensure valid range
    const displayedStart = Math.max(0, Math.min(effectiveStartIndex, chartData.data.length - 1));
    const displayedEnd = Math.max(displayedStart, Math.min(effectiveEndIndex, chartData.data.length - 1));
    const displayedData = chartData.data.slice(displayedStart, displayedEnd + 1);

    // Get LP values from displayed data (including lp, movingAverage, predictedLP)
    const lpValues: number[] = [];
    displayedData.forEach((d: any) => {
      if (!isNaN(d.lp) && d.lp !== undefined) {
        lpValues.push(d.lp);
      }
      if (!isNaN(d.movingAverage) && d.movingAverage !== undefined) {
        lpValues.push(d.movingAverage);
      }
      if (!isNaN(d.predictedLP) && d.predictedLP !== undefined) {
        lpValues.push(d.predictedLP);
      }
    });

    // Get goal LP values from displayed data (goalLineLP_${index} values)
    const goalLPValues: number[] = [];
    if (displayedData.length > 0 && chartData.goalData) {
      chartData.goalData.forEach((goalItem: any, index: number) => {
        const goalDataKey = `goalLineLP_${index}`;
        displayedData.forEach((d: any) => {
          const goalLP = d[goalDataKey];
          if (!isNaN(goalLP) && goalLP !== undefined) {
            goalLPValues.push(goalLP);
            }
        });
      });
    }

    // Combine all LP values
    const allLPValues = [...lpValues, ...goalLPValues];

    if (allLPValues.length === 0) {
      return {
        yAxisDomain: [0, 2800] as [number, number],
        yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
      };
    }

    const minLP = Math.min(...allLPValues);
    const maxLP = Math.max(...allLPValues);
    const range = maxLP - minLP;

    const padding = Math.max(20, range * 0.05);
    const roundedMin = Math.floor((minLP - padding) / 25) * 25;
    const roundedMax = Math.ceil((maxLP + padding) / 25) * 25;

    const baseYAxisDomain: [number, number] = [Math.max(0, roundedMin), roundedMax];
    
    // If ignoreYAxisZoom is true or brush indices have changed, use baseYAxisDomain
    // This ensures Y-axis updates when brush changes, even if yAxisZoom is set
    const yAxisDomain = (yAxisZoom && !ignoreYAxisZoom)
      ? [Math.max(0, yAxisZoom.min), yAxisZoom.max] as [number, number]
      : baseYAxisDomain;

    // Generate Y-axis ticks
    const generateYTicks = () => {
      const ticks: number[] = [];
      const [domainMin, domainMax] = yAxisDomain;
      const domainRange = domainMax - domainMin;

      let tickInterval: number;
      if (domainRange <= 200) {
        tickInterval = 25;
      } else if (domainRange <= 500) {
        tickInterval = 50;
      } else if (domainRange <= 1000) {
        tickInterval = 100;
      } else {
        tickInterval = 200;
      }

      let currentTick = Math.ceil(domainMin / tickInterval) * tickInterval;
      while (currentTick <= domainMax) {
        ticks.push(currentTick);
        currentTick += tickInterval;
      }

      if (ticks.length < 3) {
        const midPoint = (domainMin + domainMax) / 2;
        ticks.push(Math.round(midPoint / tickInterval) * tickInterval);
        ticks.sort((a, b) => a - b);
      }

      return ticks;
    };

    const yAxisTicks = generateYTicks();

    return {
      yAxisDomain,
      yAxisTicks,
    };
  }, [
    chartData.data, // Keep full array reference - useMemo will detect reference changes
    chartData.data?.length, // Also track length changes
    chartData.brushStartIndex,
    chartData.brushEndIndex,
    chartData.goalData, // Keep full array reference
    chartData.goalData?.length, // Also track length changes
    brushStartIndex, // This should trigger recalculation when brush changes
    brushEndIndex, // This should trigger recalculation when brush changes
    yAxisZoom,
    ignoreYAxisZoom, // Track ignoreYAxisZoom flag
  ]);

  return config;
}

