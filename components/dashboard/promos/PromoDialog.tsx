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
import { Plus } from "lucide-react";
import { PromoPayload } from "@/types/PromoPayload";
import { PromoData } from "@/types/PromoData";

interface Props {
  onSubmit: (payload: PromoPayload) => Promise<void>;
  selectedPromo?: PromoData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PromoDialog({
  onSubmit,
  selectedPromo,
  open,
  onOpenChange,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "fixed_amount"
  >("percentage");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open && selectedPromo) {
      setName(selectedPromo.name);
      setDescription(selectedPromo.description || "");
      setDiscountType(selectedPromo.discount_type);
      setValue(selectedPromo.value.toString());
      setIsActive(selectedPromo.is_active);
    } else if (open && !selectedPromo) {
      resetForm();
    }
  }, [open, selectedPromo]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDiscountType("percentage");
    setValue("");
    setIsActive(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !value) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        description,
        discount_type: discountType,
        value: Number(value),
        is_active: isActive,
      });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* Added space and fixed terminology */}
          <DialogTitle>{selectedPromo ? "Update" : "Create"} Promo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
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
