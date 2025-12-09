import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChartContainer from '../app/components/RateChart/ChartContainer';
import { ChartDataResult } from '../app/components/RateChart/useChartData';
import { YAxisConfig, YAxisZoom } from '../app/components/RateChart/useYAxisConfig';

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name, dataKey, connectNulls, hide }: any) => (
    <div data-testid={`line-${dataKey}`} data-connect-nulls={connectNulls} data-hide={hide}>
      {name}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Brush: () => <div data-testid="brush" />,
}));

// Mock lpToTierRank
vi.mock('../lib/riot/client', async () => {
  const actual = await vi.importActual('../lib/riot/client');
  return {
    ...actual,
    lpToTierRank: vi.fn((lp: number) => {
      if (lp < 400) return { tier: 'IRON', rank: 'IV', lp: lp };
      if (lp < 800) return { tier: 'BRONZE', rank: 'IV', lp: lp - 400 };
      if (lp < 1200) return { tier: 'SILVER', rank: 'IV', lp: lp - 800 };
      if (lp < 1600) return { tier: 'GOLD', rank: 'IV', lp: lp - 1200 };
      if (lp < 2000) return { tier: 'PLATINUM', rank: 'IV', lp: lp - 1600 };
      if (lp < 2400) return { tier: 'EMERALD', rank: 'IV', lp: lp - 2000 };
      if (lp < 2800) return { tier: 'DIAMOND', rank: 'IV', lp: lp - 2400 };
      return { tier: 'MASTER', rank: '', lp: lp - 2800 };
    }),
  };
});

describe('ChartContainer', () => {
  const createChartData = (overrides?: Partial<ChartDataResult>): ChartDataResult => ({
    data: [
      { date: '1/1', dateValue: 1000, lp: 1200 },
      { date: '1/2', dateValue: 2000, lp: 1300 },
    ],
    yAxisDomain: [0, 2800],
    yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
    xAxisDomain: [0, Date.now()],
    brushStartIndex: undefined,
    brushEndIndex: undefined,
    goalData: [],
    ...overrides,
  });

  const createYAxisConfig = (overrides?: Partial<YAxisConfig>): YAxisConfig => ({
    yAxisDomain: [0, 2800],
    yAxisTicks: [0, 400, 800, 1200, 1600, 2000, 2400, 2800],
    ...overrides,
  });

  const defaultProps = {
    chartData: createChartData(),
    yAxisConfig: createYAxisConfig(),
    movingAverageWindow: 7,
    brushStartIndex: undefined,
    brushEndIndex: undefined,
    hiddenLines: new Set<string>(),
    yAxisZoom: null,
    onBrushChange: vi.fn(),
    onLegendClick: vi.fn(),
    onYAxisZoom: vi.fn(),
  };

  it('renders chart container', () => {
    render(<ChartContainer {...defaultProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders all required chart elements', () => {
    render(<ChartContainer {...defaultProps} />);
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getByTestId('brush')).toBeInTheDocument();
  });

  it('renders LP line with connectNulls=true', () => {
    render(<ChartContainer {...defaultProps} />);
    const lpLine = screen.getByTestId('line-lp');
    expect(lpLine).toBeInTheDocument();
    expect(lpLine.getAttribute('data-connect-nulls')).toBe('true');
  });

  it('renders moving average line with connectNulls=true', () => {
    render(<ChartContainer {...defaultProps} />);
    const maLine = screen.getByTestId('line-movingAverage');
    expect(maLine).toBeInTheDocument();
    expect(maLine.getAttribute('data-connect-nulls')).toBe('true');
  });

  it('renders predicted LP line with connectNulls=true', () => {
    const chartData = createChartData({
      data: [
        { date: '1/1', dateValue: 1000, lp: 1200 },
        { date: '1/2', dateValue: 2000, lp: NaN, predictedLP: 1300 },
      ],
    });

    render(<ChartContainer {...defaultProps} chartData={chartData} />);
    const predictedLine = screen.getByTestId('line-predictedLP');
    expect(predictedLine).toBeInTheDocument();
    expect(predictedLine.getAttribute('data-connect-nulls')).toBe('true');
  });

  it('hides lines when they are in hiddenLines set', () => {
    const hiddenLines = new Set(['lp', 'movingAverage']);
    render(<ChartContainer {...defaultProps} hiddenLines={hiddenLines} />);
    
    const lpLine = screen.getByTestId('line-lp');
    const maLine = screen.getByTestId('line-movingAverage');
    
    expect(lpLine.getAttribute('data-hide')).toBe('true');
    expect(maLine.getAttribute('data-hide')).toBe('true');
  });

  it('renders goal lines when goalData is provided', () => {
    const chartData = createChartData({
      goalData: [
        {
          goal: {
            id: 1,
            targetDate: new Date('2024-02-01'),
            createdAt: new Date('2024-01-01'),
            targetTier: 'PLATINUM',
            targetRank: 'IV',
            targetLP: 0,
            isActive: true,
          },
          goalLP: 1600,
          targetDate: 1000,
          startDate: 500,
          startLP: 1200,
        },
      ],
      data: [
        { date: '1/1', dateValue: 1000, lp: 1200, goalLineLP_0: 1600 },
      ],
    });

    render(<ChartContainer {...defaultProps} chartData={chartData} />);
    const goalLine = screen.getByTestId('line-goalLineLP_0');
    expect(goalLine).toBeInTheDocument();
    expect(goalLine.getAttribute('data-connect-nulls')).toBe('true');
  });

  it('renders multiple goal lines', () => {
    const chartData = createChartData({
      goalData: [
        {
          goal: {
            id: 1,
            targetDate: new Date('2024-02-01'),
            createdAt: new Date('2024-01-01'),
            targetTier: 'PLATINUM',
            targetRank: 'IV',
            targetLP: 0,
            isActive: true,
          },
          goalLP: 1600,
          targetDate: 1000,
          startDate: 500,
          startLP: 1200,
        },
        {
          goal: {
            id: 2,
            targetDate: new Date('2024-03-01'),
            createdAt: new Date('2024-02-01'),
            targetTier: 'DIAMOND',
            targetRank: 'IV',
            targetLP: 0,
            isActive: true,
          },
          goalLP: 2400,
          targetDate: 2000,
          startDate: 1000,
          startLP: 1600,
        },
      ],
      data: [
        { date: '1/1', dateValue: 1000, lp: 1200, goalLineLP_0: 1600, goalLineLP_1: 2000 },
      ],
    });

    render(<ChartContainer {...defaultProps} chartData={chartData} />);
    expect(screen.getByTestId('line-goalLineLP_0')).toBeInTheDocument();
    expect(screen.getByTestId('line-goalLineLP_1')).toBeInTheDocument();
  });

  it('handles empty goalData array', () => {
    const chartData = createChartData({ goalData: [] });
    render(<ChartContainer {...defaultProps} chartData={chartData} />);
    // Should not throw and should render basic lines
    expect(screen.getByTestId('line-lp')).toBeInTheDocument();
  });

  it('displays correct moving average window in line name', () => {
    render(<ChartContainer {...defaultProps} movingAverageWindow={14} />);
    const maLine = screen.getByTestId('line-movingAverage');
    expect(maLine.textContent).toContain('14日');
  });
});

