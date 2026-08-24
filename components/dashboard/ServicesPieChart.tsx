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

const chartData = [
  { service: "Premium Medium", count: 142, fill: "var(--color-primary)" },
  { service: "Basic Eco", count: 88, fill: "var(--color-primary-light)" },
  { service: "Interior Detailing", count: 45, fill: "var(--color-secondary)" },
  { service: "Wax & Shine", count: 32, fill: "var(--color-secondary-light)" },
];

const chartConfig = {
  count: { label: "Availed Tickets" },
  "Premium Medium": { label: "Premium Medium", color: "var(--color-primary)" },
  "Basic Eco": { label: "Basic Eco", color: "var(--color-primary-light)" },
  "Interior Detailing": {
    label: "Interior Detailing",
    color: "var(--color-secondary)",
  },
  "Wax & Shine": {
    label: "Wax & Shine",
    color: "var(--color-secondary-light)",
  },
};

export function ServicesPieChart() {
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
                          307
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
