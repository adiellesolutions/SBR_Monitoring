'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { ChartDataPoint } from '@/types';

interface SensorChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  dataKey: keyof Omit<ChartDataPoint, 'time'>;
  label: string;
  unit: string;
  color: string;
  domain: [number, number];
  normalMin: number;
  normalMax: number;
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  unit: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
  color,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const value = payload[0]?.value;

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg border border-border"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <p className="text-muted-foreground mb-1">{label}</p>

      <p className="font-bold font-mono-data" style={{ color }}>
        {value}
        {unit}
      </p>
    </div>
  );
}

export default function SensorChart({
  data,
  isLoading,
  dataKey,
  label,
  unit,
  color,
  domain,
  normalMin,
  normalMax,
}: SensorChartProps) {
  const chartDataKey = String(dataKey);

  const lastPoint = data[data.length - 1];
  const currentValue = lastPoint ? lastPoint[dataKey] : null;

  const values = data
    .map((item) => item[dataKey])
    .filter((value): value is number => typeof value === 'number');

  const minVal = values.length ? Math.min(...values).toFixed(1) : '--';
  const maxVal = values.length ? Math.max(...values).toFixed(1) : '--';
  const avgVal = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    : '--';

  const hasData = data.length > 0;

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{ backgroundColor: 'var(--card)' }}
    >
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>

          <div className="flex items-baseline gap-1 mt-0.5">
            {isLoading ? (
              <div className="h-7 w-20 rounded bg-secondary animate-pulse" />
            ) : (
              <>
                <span
                  className="text-2xl font-bold font-mono-data"
                  style={{ color }}
                >
                  {currentValue !== null && currentValue !== undefined
                    ? currentValue
                    : '--'}
                </span>

                <span className="text-xs text-muted-foreground">{unit}</span>
              </>
            )}
          </div>
        </div>

        {!isLoading && (
          <div className="flex gap-3 text-right">
            {[
              { label: 'Min', value: minVal },
              { label: 'Avg', value: avgVal },
              { label: 'Max', value: maxVal },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[10px] text-muted-foreground">
                  {stat.label}
                </p>

                <p className="text-xs font-semibold font-mono-data text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-1 pb-3">
        {isLoading ? (
          <div className="h-36 mx-3 rounded-lg bg-secondary animate-pulse" />
        ) : !hasData ? (
          <div className="h-36 mx-3 rounded-lg bg-secondary/40 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              No data available yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={148}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`grad-${chartDataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={domain}
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickCount={4}
              />

              <Tooltip
                content={<CustomTooltip unit={unit} color={color} />}
                cursor={{
                  stroke: color,
                  strokeWidth: 1,
                  strokeDasharray: '4 2',
                  strokeOpacity: 0.5,
                }}
              />

              <ReferenceLine
                y={normalMax}
                stroke={color}
                strokeDasharray="4 3"
                strokeOpacity={0.3}
                strokeWidth={1}
              />

              <ReferenceLine
                y={normalMin}
                stroke={color}
                strokeDasharray="4 3"
                strokeOpacity={0.3}
                strokeWidth={1}
              />

              <Area
                type="monotone"
                dataKey={chartDataKey}
                stroke={color}
                strokeWidth={1.8}
                fill={`url(#grad-${chartDataKey})`}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="px-4 pb-3 flex items-center gap-1.5">
        <div
          className="w-6 h-px"
          style={{ borderTop: `1px dashed ${color}`, opacity: 0.4 }}
        />

        <span className="text-[10px] text-muted-foreground">
          Normal range: {normalMin}–{normalMax}
          {unit}
        </span>
      </div>
    </div>
  );
}