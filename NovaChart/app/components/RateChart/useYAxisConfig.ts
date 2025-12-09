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
  yAxisZoom: YAxisZoom | null
): YAxisConfig {
  const config = useMemo(() => {
    if (!chartData.data || chartData.data.length === 0) {
      return {
        yAxisDomain: [0, 2800] as [number, number],
        yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
      };
    }

    // Determine displayed data range based on Brush selection
    const displayedStart = brushStartIndex !== undefined 
      ? brushStartIndex 
      : (chartData.brushStartIndex !== undefined ? chartData.brushStartIndex : 0);
    const displayedEnd = brushEndIndex !== undefined 
      ? brushEndIndex 
      : (chartData.brushEndIndex !== undefined ? chartData.brushEndIndex : chartData.data.length - 1);
    const displayedData = chartData.data.slice(displayedStart, displayedEnd + 1);

    // Get LP values from displayed data
    const lpValues = displayedData
      .map(d => (d as any).lp)
      .filter((lp: any) => !isNaN(lp) && lp !== undefined);

    // Add goal LP values that fall within the displayed date range
    const goalLPValues: number[] = [];
    if (displayedData.length > 0 && chartData.goalData) {
      const displayedStartDate = (displayedData[0] as any).dateValue;
      const displayedEndDate = (displayedData[displayedData.length - 1] as any).dateValue;

      chartData.goalData.forEach((goalItem: any) => {
        const goalStartDate = goalItem.startDate;
        const goalTargetDate = goalItem.targetDate;

        const goalLineIntersects = 
          (goalStartDate >= displayedStartDate && goalStartDate <= displayedEndDate) ||
          (goalTargetDate >= displayedStartDate && goalTargetDate <= displayedEndDate) ||
          (goalStartDate <= displayedStartDate && goalTargetDate >= displayedEndDate);

        if (goalLineIntersects) {
          const goalDateRange = goalTargetDate - goalStartDate;
          
          if (goalDateRange === 0) {
            if (goalStartDate >= displayedStartDate && goalStartDate <= displayedEndDate) {
              goalLPValues.push(goalItem.startLP);
              goalLPValues.push(goalItem.goalLP);
            }
          } else {
            const lpAtDisplayedStart = goalStartDate <= displayedStartDate && goalTargetDate >= displayedStartDate
              ? goalItem.startLP + (goalItem.goalLP - goalItem.startLP) * (displayedStartDate - goalStartDate) / goalDateRange
              : null;
            const lpAtDisplayedEnd = goalStartDate <= displayedEndDate && goalTargetDate >= displayedEndDate
              ? goalItem.startLP + (goalItem.goalLP - goalItem.startLP) * (displayedEndDate - goalStartDate) / goalDateRange
              : null;
            
            if (goalStartDate >= displayedStartDate && goalStartDate <= displayedEndDate) {
              goalLPValues.push(goalItem.startLP);
            }
            if (goalTargetDate >= displayedStartDate && goalTargetDate <= displayedEndDate) {
              goalLPValues.push(goalItem.goalLP);
            }
            if (lpAtDisplayedStart !== null) {
              goalLPValues.push(lpAtDisplayedStart);
            }
            if (lpAtDisplayedEnd !== null) {
              goalLPValues.push(lpAtDisplayedEnd);
            }
          }
        }
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
    const yAxisDomain = yAxisZoom 
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
  }, [chartData, brushStartIndex, brushEndIndex, yAxisZoom]);

  return config;
}

