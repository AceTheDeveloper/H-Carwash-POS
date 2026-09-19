"use client";

import { useState } from "react";
import { PromoData } from "@/types/PromoData";
import {
  Tag,
  Percent,
  Banknote,
  Gift,
  PackagePlus,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PromoQRScanner from "./PromoQRScanner";

interface Props {
  promos: PromoData[];
  selectedPromo: PromoData | null;
  isSubmitting: boolean;
  onSelect: (promo: PromoData | null) => void;
}

function PromoBadge({ promo }: { promo: PromoData }) {
  if (promo.promo_type === "free_add_on") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-primary">
        <Gift className="w-3.5 h-3.5" />
        Free: {promo.reward_add_on?.label ?? "Add-on"}
      </span>
    );
  }

  if (promo.promo_type === "special_add_on_price") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-primary">
        <PackagePlus className="w-3.5 h-3.5" />
        {promo.reward_add_on?.label ?? "Add-on"} for ₱{promo.reward_price ?? 0}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-bold text-primary">
      {promo.discount_type === "percentage" ? (
        <Percent className="w-3.5 h-3.5" />
      ) : (
        <Banknote className="w-3.5 h-3.5" />
      )}
      {promo.discount_type === "percentage"
        ? `${promo.value}% off`
        : `₱${promo.value} off`}
    </span>
  );
}

export default function PromosStep({
  promos,
  selectedPromo,
  isSubmitting,
  onSelect,
}: Props) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  if (!promos || promos.length === 0) return null;

  return (
    <div className="space-y-3 bg-card p-4 md:p-5 rounded-2xl border border-border/50 shadow-sm">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Apply Promo</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSubmitting}
          onClick={() => setIsScannerOpen(true)}
        >
          <ScanLine className="w-3.5 h-3.5 mr-1.5" />
          Scan QR
        </Button>
      </div>

      <PromoQRScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScanned={(promo) => onSelect(promo)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {promos.map((promo) => {
          const isSelected = selectedPromo?.id === promo.id;

          return (
            <div
              key={promo.id}
              onClick={() =>
                !isSubmitting && onSelect(isSelected ? null : promo)
              }
              className={cn(
                "relative cursor-pointer p-4 rounded-xl border-2 transition-all space-y-2",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/60 hover:border-primary/40 bg-background",
                isSubmitting && "opacity-50 cursor-not-allowed",
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-primary">
                  <CheckCircle2 className="w-5 h-5 fill-primary text-primary-foreground" />
                </div>
              )}

              <div className="pr-8">
                <p className="font-semibold text-sm text-foreground">
                  {promo.name}
                </p>
                {promo.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {promo.description}
                  </p>
                )}
              </div>

              <div className="flex items-center pt-2 border-t border-border/40">
                <PromoBadge promo={promo} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
