"use client";

import { PromoData } from "@/types/PromoData";
import { Badge } from "@/components/ui/badge";
import { Tag, Percent, Banknote } from "lucide-react";

interface Props {
  data: PromoData;
  onToggle: () => void;
}

export default function PromoCard({ data, onToggle }: Props) {
  return (
    <div
      onClick={onToggle}
      className="relative cursor-pointer p-4 rounded-xl border-2 border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Tag className="w-4 h-4" />
          </div>
          <p className="font-semibold text-sm text-foreground">{data.name}</p>
        </div>

        <Badge
          className={
            data.is_active
              ? "bg-success/15 text-success border border-success/30"
              : "bg-muted text-muted-foreground"
          }
        >
          {data.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      {data.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.description}
        </p>
      )}

      <div className="flex items-center pt-2 border-t border-border/40">
        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
          {data.discount_type === "percentage" ? (
            <Percent className="w-3.5 h-3.5" />
          ) : (
            <Banknote className="w-3.5 h-3.5" />
          )}
          {data.discount_type === "percentage"
            ? `${data.value}% off`
            : `₱${data.value} off`}
        </span>
      </div>
    </div>
  );
}
