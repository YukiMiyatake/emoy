'use client';

import { useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { DamageChartDataResult } from './useDamageChartData';
import { YAxisConfig, YAxisZoom } from './useYAxisConfig';

interface DamageChartContainerProps {
  chartData: DamageChartDataResult;
  yAxisConfig: YAxisConfig;
  movingAverageWindow: number;
  brushStartIndex: number | undefined;
  brushEndIndex: number | undefined;
  hiddenLines: Set<string>;
  yAxisZoom: YAxisZoom | null;
  onBrushChange: (startIndex: number, endIndex: number) => void;
  onLegendClick: (dataKey: string) => void;
  onYAxisZoom: (zoomIn: boolean) => void;
}

export default function DamageChartContainer({
  chartData,
  yAxisConfig,
  movingAverageWindow,
  brushStartIndex,
  brushEndIndex,
  hiddenLines,
  yAxisZoom,
  onBrushChange,
  onLegendClick,
  onYAxisZoom,
}: DamageChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      const zoomIn = delta < 0;
      onYAxisZoom(zoomIn);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [onYAxisZoom]);

  return (
    <div ref={chartContainerRef} className="w-full">
      <ResponsiveContainer width="100%" height={600}>
        <LineChart data={chartData.data} margin={{ top: 5, right: 30, left: 80, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            type="category"
            allowDuplicatedCategory={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            domain={yAxisConfig.yAxisDomain}
            ticks={yAxisConfig.yAxisTicks}
            tickFormatter={(value: number) => {
              if (isNaN(value)) return '';
              return value.toLocaleString();
            }}
            width={90}
            allowDecimals={false}
            label={{ value: 'ダメージ/分', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (isNaN(value)) return 'N/A';
              return value.toLocaleString();
            }}
            labelFormatter={(label) => `日付: ${label}`}
          />
          <Legend onClick={(e: any) => onLegendClick(e.dataKey)} />
          <Line
            type="monotone"
            dataKey="damagePerMin"
            stroke="#ef4444"
            strokeWidth={2}
            name="ダメージ/分"
            dot={{ r: 4 }}
            connectNulls={true}
            hide={hiddenLines.has('damagePerMin')}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name={`移動平均 (${movingAverageWindow}試合)`}
            dot={false}
            connectNulls={true}
            hide={hiddenLines.has('movingAverage')}
          />
          <Brush
            dataKey="date"
            height={30}
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.3}
            strokeWidth={2}
            travellerWidth={12}
            startIndex={brushStartIndex ?? chartData.brushStartIndex}
            endIndex={brushEndIndex ?? chartData.brushEndIndex}
            onChange={(brushData: any) => {
              if (brushData && typeof brushData.startIndex === 'number' && typeof brushData.endIndex === 'number') {
                onBrushChange(brushData.startIndex, brushData.endIndex);
              }
            }}
            traveller={(props: any) => {
              const { x, y, width, height } = props;
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill="#991b1b"
                  stroke="#7f1d1d"
                  strokeWidth={2}
                  rx={2}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

