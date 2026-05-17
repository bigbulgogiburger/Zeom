'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS_STROKE,
  CHART_COLORS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  ChartColorIndex,
} from './colors';

export type LineSeries = {
  key: string;
  label: string;
  colorIndex: ChartColorIndex;
};

type LineChartCardProps = {
  data: ReadonlyArray<Record<string, string | number>>;
  xKey: string;
  series: ReadonlyArray<LineSeries>;
  height?: number;
};

export default function LineChartCardImpl({
  data,
  xKey,
  series,
  height = 240,
}: LineChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={[...data]} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={CHART_AXIS_STROKE}
          tick={{ fill: CHART_AXIS_STROKE, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_AXIS_STROKE}
          tick={{ fill: CHART_AXIS_STROKE, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: CHART_AXIS_STROKE }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={CHART_COLORS[s.colorIndex]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
