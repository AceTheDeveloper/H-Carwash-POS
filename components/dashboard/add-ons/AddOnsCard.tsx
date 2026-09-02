import { AddOnsData } from "@/types/AddOnsData";
import { Plus, Tag, Eye } from "lucide-react";

interface Props {
  data: AddOnsData;
  isSelected?: boolean;
  onToggle?: (addOn: AddOnsData) => void;
}

export default function AddOnsCard({
  data,
  isSelected = false,
  onToggle,
}: Props) {
  const formattedPrice = Number(data.price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      onClick={() => onToggle?.(data)}
      className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? "border-primary bg-primary/[0.04] shadow-sm shadow-primary/10"
          : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          }`}
        >
          <Tag className="w-4 h-4" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-foreground truncate">
            {data.label}
          </span>
          <span className="text-xs font-bold text-primary">
            + ₱{formattedPrice}
          </span>
        </div>
      </div>

      <div
        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/80 bg-background group-hover:border-primary/50 text-muted-foreground"
        }`}
      >
        <Eye className="w-4 h-4 opacity-70 group-hover:opacity-100" />
      </div>
    </div>
  );
}
