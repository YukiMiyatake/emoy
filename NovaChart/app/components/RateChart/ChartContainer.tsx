'use client';

import { useRef } from 'react';
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
import { lpToTierRank } from '@/lib/riot/client';
import { ChartDataResult } from './useChartData';
import { YAxisConfig, YAxisZoom } from './useYAxisConfig';

interface ChartContainerProps {
  chartData: ChartDataResult;
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

export default function ChartContainer({
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
}: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Handle mouse wheel on chart container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY;
    const zoomIn = delta < 0;
    onYAxisZoom(zoomIn);
  };

  return (
    <div ref={chartContainerRef} className="w-full" onWheel={handleWheel}>
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
              const tierRank = lpToTierRank(value);
              
              if (tierRank.tier === 'MASTER' || tierRank.tier === 'GRANDMASTER' || tierRank.tier === 'CHALLENGER') {
                return tierRank.tier;
              }
              
              const tierNames: Record<string, string> = {
                'IRON': 'Iron',
                'BRONZE': 'Bronze',
                'SILVER': 'Silver',
                'GOLD': 'Gold',
                'PLATINUM': 'Platinum',
                'EMERALD': 'Emerald',
                'DIAMOND': 'Diamond',
              };
              
              const tierName = tierNames[tierRank.tier] || tierRank.tier;
              
              const rankNumbers: Record<string, string> = {
                'IV': '4',
                'III': '3',
                'II': '2',
                'I': '1',
              };
              
              const rankNumber = rankNumbers[tierRank.rank] || '';
              
              if (rankNumber && tierRank.lp < 5) {
                return `${tierName} ${rankNumber}`;
              }
              
              return '';
            }}
            width={90}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              if (isNaN(value)) return 'N/A';
              if (name === 'Total LP' && props.payload.originalEntry) {
                const entry = props.payload.originalEntry;
                return `${entry.tier} ${entry.rank} ${entry.lp}LP (Total LP: ${Math.round(value)})`;
              }
              return Math.round(value);
            }}
            labelFormatter={(label) => `日付: ${label}`}
          />
          <Legend onClick={(e: any) => onLegendClick(e.dataKey)} />
          <Line
            type="monotone"
            dataKey="lp"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Total LP"
            dot={{ r: 4 }}
            connectNulls={true}
            hide={hiddenLines.has('lp')}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name={`移動平均 (${movingAverageWindow}日)`}
            dot={false}
            connectNulls={true}
            hide={hiddenLines.has('movingAverage')}
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
            hide={hiddenLines.has('predictedLP')}
          />
          {Array.isArray(chartData.goalData) && chartData.goalData.map((goalItem, index) => {
            const goalDataKey = `goalLineLP_${index}`;
            return (
              <Line
                key={goalItem.goal.id || index}
                type="linear"
                dataKey={goalDataKey}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="10 5"
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls={true}
                isAnimationActive={false}
                name={`目標${index + 1}: ${goalItem.goal.targetTier} ${goalItem.goal.targetRank} ${goalItem.goal.targetLP}LP`}
                hide={hiddenLines.has(goalDataKey)}
              />
            );
          })}
          <Brush
            dataKey="date"
            height={30}
            stroke="#3b82f6"
            fill="#3b82f6"
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
                  fill="#1e40af"
                  stroke="#1e3a8a"
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

