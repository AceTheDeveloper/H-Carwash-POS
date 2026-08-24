"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

const chartData = [
  { day: "Mon", washSales: 11200, barSales: 3200 },
  { day: "Tue", washSales: 9800, barSales: 2900 },
  { day: "Wed", washSales: 14500, barSales: 4100 },
  { day: "Thu", washSales: 12100, barSales: 3800 },
  { day: "Fri", washSales: 18200, barSales: 6500 },
  { day: "Sat", washSales: 22400, barSales: 8900 },
  { day: "Sun", washSales: 19800, barSales: 7200 },
];

const chartConfig = {
  washSales: {
    label: "Carwash Service",
    color: "var(--color-primary)", // Your bold primary red #B3261E
  },
  barSales: {
    label: "Breakfast & Bar",
    color: "var(--color-secondary)", // Your warm brand coffee brown #6B4226
  },
};

export function RevenueBarChart() {
  return (
    <Card className="rounded-md border border-border bg-surface shadow-sm overflow-hidden p-0">
      <CardHeader className="p-6 border-b border-border/40 bg-background/30">
        <div className="flex items-center justify-between">
          <div className="">
            <CardTitle className="text-lg font-bold text-text-primary tracking-tight">
              Weekly Revenue Streams
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Comparing carwash operations and F&B sales
            </CardDescription>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-text-primary">
              <span className="size-2.5 rounded-sm bg-primary" /> Carwash
            </div>
            <div className="flex items-center gap-1.5 text-text-primary">
              <span className="size-2.5 rounded-sm bg-secondary" />{" "}
              Breakfast/Bar
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-5">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={chartData} barGap={4}>
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
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="washSales"
              fill="var(--color-primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="barSales"
              fill="var(--color-secondary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
