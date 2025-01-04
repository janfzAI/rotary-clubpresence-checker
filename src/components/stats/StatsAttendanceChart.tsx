import React from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  attendance: number;
}

interface StatsAttendanceChartProps {
  chartData: ChartDataPoint[];
}

export const StatsAttendanceChart = ({ chartData }: StatsAttendanceChartProps) => {
  return (
    <Card className="p-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis unit="%" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};