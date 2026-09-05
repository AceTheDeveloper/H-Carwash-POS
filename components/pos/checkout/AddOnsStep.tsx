"use client";

import { AddOnsData } from "@/types/AddOnsData";
import { CheckCircle2, Tag } from "lucide-react";

interface Props {
  addOns: AddOnsData[];
  selectedAddOns: AddOnsData[];
  isSubmitting: boolean;
  onToggle: (addon: AddOnsData) => void;
}

export default function AddOnsStep({
  addOns,
  selectedAddOns,
  isSubmitting,
  onToggle,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Tag className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Step 4: Add-Ons (Optional)
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {addOns.length > 0 ? (
          addOns.map((addon) => {
            const isSelected = selectedAddOns.some(
              (item) => item.id === addon.id,
            );
            return (
              <div
                key={addon.id}
                onClick={() => !isSubmitting && onToggle(addon)}
                className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                  isSelected
                    ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/10"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-foreground text-sm">
                    {addon.label}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">
                    ₱
                    {Number(addon.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-transparent"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No add-ons available.
          </div>
        )}
      </div>
    </div>
  );
}
