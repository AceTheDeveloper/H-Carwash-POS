// components/dashboard/ServicesPieChart.tsx
"use client";

import { Pie, PieChart, Label, Cell } from "recharts";
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

const chartConfig = {
  count: { label: "Availed Tickets" },
};

interface ServicesPieChartProps {
  chartData?: { service: string; count: number; fill: string }[];
  totalCount?: number;
}

export function ServicesPieChart({
  chartData = [],
  totalCount = 0,
}: ServicesPieChartProps) {
  return (
    <Card className="rounded-md border border-border bg-surface shadow-sm flex flex-col h-full overflow-hidden p-0">
      <CardHeader className="p-6 border-b border-border/40 bg-background/30">
        <CardTitle className="text-lg font-bold text-text-primary tracking-tight">
          Popular Services
        </CardTitle>
        <CardDescription className="text-xs text-text-secondary mt-0.5">
          Most availed packages this month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[220px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="service"
              innerRadius={68}
              outerRadius={85}
              stroke="var(--color-surface)"
              strokeWidth={4}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-text-primary text-3xl font-extrabold tracking-tight"
                        >
                          {totalCount}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 22}
                          className="fill-text-secondary text-[11px] font-bold tracking-wider uppercase"
                        >
                          Total Washes
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
