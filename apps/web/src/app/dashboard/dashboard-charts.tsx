'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function DashboardCharts({
  data,
  label,
}: {
  data: Array<{ status: string; count: number }>;
  label: string;
}) {
  if (!data.length) {
    return (
      <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No {label.toLowerCase()} status data yet.
      </p>
    );
  }

  return (
    <div className="h-56 w-full" role="img" aria-label={`${label} by status`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name={label} fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
