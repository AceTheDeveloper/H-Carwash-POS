"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const defaultChartData = [
  { day: "Mon", revenue: 11200 },
  { day: "Tue", revenue: 9800 },
  { day: "Wed", revenue: 14500 },
  { day: "Thu", revenue: 12100 },
  { day: "Fri", revenue: 18200 },
  { day: "Sat", revenue: 22400 },
  { day: "Sun", revenue: 19800 },
];

const chartConfig = {
  revenue: {
    label: "Daily Revenue",
    color: "var(--color-primary)",
  },
};

interface RevenueBarChartProps {
  chartData?: { day: string; revenue: number }[];
}

export function RevenueBarChart({
  chartData = defaultChartData,
}: RevenueBarChartProps) {
  // Find the highest revenue value to dynamically highlight it
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 0);

  return (
    <Card className="rounded-md border border-border bg-surface shadow-sm overflow-hidden p-0 h-full flex flex-col">
      <CardHeader className="p-6 border-b border-border/40 bg-background/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-text-primary tracking-tight">
              Weekly Revenue Trends
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Daily performance overview with peak sales highlighted
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <span className="size-2.5 rounded-sm bg-primary" /> Peak Earning Day
            Highlighted
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-5 flex-1 flex flex-col justify-center">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.4}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs font-semibold fill-text-secondary"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs font-medium fill-text-secondary"
              tickFormatter={(val) => `₱${val / 1000}k`}
            />
            <ChartTooltip
              cursor={{ fill: "var(--color-border)", opacity: 0.15 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => {
                const isPeak =
                  entry.revenue === maxRevenue && entry.revenue > 0;
                return (
                  <Cell
                    key={`cell-${index}`}
                    // Highlight peak day with full primary color, others with a slightly subdued primary or border opacity
                    fill={
                      isPeak ? "var(--color-primary)" : "var(--color-primary)"
                    }
                    opacity={isPeak ? 1 : 0.55}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
