"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Gift, Percent, PackagePlus } from "lucide-react";
import { PromoPayload } from "@/types/PromoPayload";
import { PromoData, PromoType } from "@/types/PromoData";
import { AddOnsData } from "@/types/AddOnsData";
import useAddOns from "@/hooks/useAddOns";

interface Props {
  onSubmit: (payload: PromoPayload) => Promise<void>;
  selectedPromo?: PromoData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROMO_TYPE_OPTIONS: {
  value: PromoType;
  label: string;
  icon: typeof Percent;
}[] = [
  { value: "discount", label: "Discount", icon: Percent },
  { value: "free_add_on", label: "Free Add-On", icon: Gift },
  { value: "special_add_on_price", label: "Bundle Price", icon: PackagePlus },
];

export default function PromoDialog({
  onSubmit,
  selectedPromo,
  open,
  onOpenChange,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: addOnsData } = useAddOns();

  const addOnsList: AddOnsData[] =
    addOnsData?.json?.data ||
    addOnsData?.data ||
    (Array.isArray(addOnsData) ? addOnsData : []);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promoType, setPromoType] = useState<PromoType>("discount");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [value, setValue] = useState("");
  const [rewardAddOnId, setRewardAddOnId] = useState("");
  const [rewardPrice, setRewardPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPromoType("discount");
    setDiscountType("percentage");
    setValue("");
    setRewardAddOnId("");
    setRewardPrice("");
    setIsActive(true);
  };

  useEffect(() => {
    if (open && selectedPromo) {
      queueMicrotask(() => {
        setName(selectedPromo.name);
        setDescription(selectedPromo.description || "");
        setPromoType(selectedPromo.promo_type || "discount");
        setDiscountType(selectedPromo.discount_type || "percentage");
        setValue(
          selectedPromo.promo_type === "discount"
            ? selectedPromo.value.toString()
            : "",
        );
        setRewardAddOnId(selectedPromo.reward_add_on_id || "");
        setRewardPrice(
          selectedPromo.reward_price != null
            ? selectedPromo.reward_price.toString()
            : "",
        );
        setIsActive(selectedPromo.is_active);
      });
    } else if (open && !selectedPromo) {
      queueMicrotask(resetForm);
    }
  }, [open, selectedPromo]);

  const isRewardType =
    promoType === "free_add_on" || promoType === "special_add_on_price";

  const canSubmit =
    !!name.trim() &&
    (promoType === "discount"
      ? !!value
      : !!rewardAddOnId &&
        (promoType !== "special_add_on_price" || !!rewardPrice));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const payload: PromoPayload = {
        name,
        description,
        promo_type: promoType,
        is_active: isActive,
        discount_type: promoType === "discount" ? discountType : "fixed_amount",
        value: promoType === "discount" ? Number(value) : 0,
        reward_add_on_id: isRewardType ? rewardAddOnId : null,
        reward_price:
          promoType === "special_add_on_price"
            ? Number(rewardPrice)
            : promoType === "free_add_on"
              ? 0
              : null,
      };

      await onSubmit(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save promo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          onClick={() => resetForm()}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Promo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md scrollbar-none">
        <DialogHeader>
          <DialogTitle>{selectedPromo ? "Update" : "Create"} Promo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 pr-1">
          <div className="space-y-1.5">
            <Label>Promo Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Wash Blowout"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown to staff at checkout"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Promo Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {PROMO_TYPE_OPTIONS.map(({ value: type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPromoType(type)}
                  className={`py-2 px-1 rounded-lg border-2 text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                    promoType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {promoType === "discount" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType("percentage")}
                    className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                      discountType === "percentage"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("fixed_amount")}
                    className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                      discountType === "fixed_amount"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground"
                    }`}
                  >
                    Fixed ₱
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Value {discountType === "percentage" ? "(%)" : "(₱)"}
                </Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "20" : "100"}
                />
              </div>
            </div>
          )}

          {isRewardType && (
            <div className="space-y-3 p-3 rounded-xl border border-border/60 bg-muted/20">
              <div className="space-y-1.5">
                <Label>
                  {promoType === "free_add_on"
                    ? "Add-On Given Free"
                    : "Add-On At Bundle Price"}
                </Label>
                <select
                  value={rewardAddOnId}
                  onChange={(e) => setRewardAddOnId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background text-foreground font-medium focus:outline-primary"
                >
                  <option value="">Select an add-on...</option>
                  {addOnsList.map((addon) => (
                    <option key={addon.id} value={addon.id}>
                      {addon.label} (₱{Number(addon.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {promoType === "special_add_on_price" && (
                <div className="space-y-1.5">
                  <Label>Bundle Price (₱)</Label>
                  <Input
                    type="number"
                    value={rewardPrice}
                    onChange={(e) => setRewardPrice(e.target.value)}
                    placeholder="100"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    e.g. Carwash + Vacuum add-on for ₱100 instead of its regular
                    price.
                  </p>
                </div>
              )}

              {promoType === "free_add_on" && (
                <p className="text-[11px] text-muted-foreground">
                  This add-on is automatically included, free, whenever this
                  promo is applied at checkout.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="w-full"
          >
            {isSubmitting
              ? selectedPromo
                ? "Updating..."
                : "Creating..."
              : selectedPromo
                ? "Update Promo"
                : "Create Promo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
