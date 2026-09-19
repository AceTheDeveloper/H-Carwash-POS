"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PromoData } from "@/types/PromoData";
import { Tag, Percent, Banknote, Gift, PackagePlus, Eye } from "lucide-react";

interface Props {
  promo: PromoData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PromoTypeSummary({ promo }: { promo: PromoData }) {
  if (promo.promo_type === "free_add_on") {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Gift className="w-4 h-4 shrink-0" />
        {promo.reward_add_on?.label ?? "Add-on"} given free
      </div>
    );
  }

  if (promo.promo_type === "special_add_on_price") {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <PackagePlus className="w-4 h-4 shrink-0" />
        {promo.reward_add_on?.label ?? "Add-on"} for ₱{promo.reward_price ?? 0}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
      {promo.discount_type === "percentage" ? (
        <Percent className="w-4 h-4 shrink-0" />
      ) : (
        <Banknote className="w-4 h-4 shrink-0" />
      )}
      {promo.discount_type === "percentage"
        ? `${promo.value}% off total`
        : `₱${promo.value} off total`}
    </div>
  );
}

export default function PromoViewDialog({ promo, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Promo Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Tag className="w-4 h-4" />
              </div>
              <p className="font-semibold text-sm text-foreground">
                {promo.name}
              </p>
            </div>
            <Badge
              className={
                promo.is_active
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-muted text-muted-foreground"
              }
            >
              {promo.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {promo.description && (
            <p className="text-xs text-muted-foreground">{promo.description}</p>
          )}

          <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
            <PromoTypeSummary promo={promo} />
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
            <span className="text-muted-foreground">QR Code</span>
            <span className="font-mono tracking-widest text-foreground">
              {promo.code}
            </span>
          </div>

          {promo.created_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">
                {new Date(promo.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
