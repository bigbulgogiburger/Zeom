'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  CHART_COLORS,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  CHART_AXIS_STROKE,
} from './colors';

export type PieSlice = {
  name: string;
  value: number;
};

type PieChartCardProps = {
  data: ReadonlyArray<PieSlice>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
};

export default function PieChartCardImpl({
  data,
  height = 240,
  innerRadius = 48,
  outerRadius = 84,
}: PieChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={[...data]}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          stroke="hsl(var(--card))"
          strokeWidth={2}
        >
          {data.map((slice, idx) => (
            <Cell
              key={slice.name}
              fill={CHART_COLORS[(idx % CHART_COLORS.length) as 0 | 1 | 2 | 3 | 4]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: CHART_AXIS_STROKE }}
        />
        <Legend
          verticalAlign="bottom"
          height={24}
          wrapperStyle={{ fontSize: 12, color: CHART_AXIS_STROKE }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
