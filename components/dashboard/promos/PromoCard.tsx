"use client";

import { useState } from "react";
import { PromoData } from "@/types/PromoData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tag,
  Percent,
  Banknote,
  Gift,
  PackagePlus,
  QrCode,
  Eye,
} from "lucide-react";
import PromoQRCode from "./PromoQrCode";
import PromoViewDialog from "./PromoViewDialog";

interface Props {
  data: PromoData;
  onToggle: () => void;
}

function PromoBadge({ promo }: { promo: PromoData }) {
  if (promo.promo_type === "free_add_on") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
        <Gift className="w-3.5 h-3.5" />
        Free: {promo.reward_add_on?.label ?? "Add-on"}
      </span>
    );
  }

  if (promo.promo_type === "special_add_on_price") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
        <PackagePlus className="w-3.5 h-3.5" />
        {promo.reward_add_on?.label ?? "Add-on"} for ₱{promo.reward_price ?? 0}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
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

export default function PromoCard({ data, onToggle }: Props) {
  // Only one of View / QR can be open at a time — sharing this single bit
  // of state instead of two separate useState booleans is what prevents
  // them from ever stacking on top of each other.
  const [activeModal, setActiveModal] = useState<"view" | "qr" | null>(null);

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

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <PromoBadge promo={data} />

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModal("view");
            }}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setActiveModal("qr");
            }}
          >
            <QrCode className="w-3.5 h-3.5 mr-1" />
            QR Code
          </Button>
        </div>
      </div>

      <PromoViewDialog
        promo={data}
        open={activeModal === "view"}
        onOpenChange={(open) => setActiveModal(open ? "view" : null)}
      />

      <PromoQRCode
        promo={data}
        open={activeModal === "qr"}
        onOpenChange={(open) => setActiveModal(open ? "qr" : null)}
      />
    </div>
  );
}
