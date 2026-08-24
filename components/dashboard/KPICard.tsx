import { Card, CardContent } from "../ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  isHighlight?: boolean;
  badgeColor?: string;
}

export default function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isHighlight = false,
  badgeColor = "bg-muted text-text-secondary",
}: KPICardProps) {
  return (
    <Card
      className={`rounded-md shadow-sm border border-border/40 ${isHighlight ? "bg-surface ring-1 ring-primary/20" : "bg-surface"}`}
    >
      <CardContent className="flex flex-col justify-between h-full space-y-4">
        {/* Top Meta row */}
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium text-text-secondary tracking-tight">
            {title}
          </span>
          <div
            className={`p-2 rounded-md ${isHighlight ? "bg-primary/10 text-primary" : "bg-border/40 text-text-secondary"}`}
          >
            <Icon className="size-4" />
          </div>
        </div>

        {/* Core numbers */}
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-text-primary">
            {value}
          </h3>
          <p className="text-xs text-text-secondary leading-normal">
            {description}
          </p>
        </div>

        {/* Contextual Trend Footer */}
        {trend && (
          <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 text-xs">
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${badgeColor}`}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
