"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Hash } from "lucide-react";
import { FormErrors } from "@/types/Checkout";

interface Props {
  customerName: string;
  contactNumber: string;
  plateNumber: string;
  errors: FormErrors;
  isSubmitting: boolean;
  onChangeName: (v: string) => void;
  onChangeContact: (v: string) => void;
  onChangePlate: (v: string) => void;
}

export default function CustomerInfoForm({
  customerName,
  contactNumber,
  plateNumber,
  errors,
  isSubmitting,
  onChangeName,
  onChangeContact,
  onChangePlate,
}: Props) {
  return (
    <div className="space-y-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <User className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Step 1: Customer Information
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <div className="space-y-2 relative">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Juan Dela Cruz"
              value={customerName}
              disabled={isSubmitting}
              onChange={(e) => onChangeName(e.target.value)}
              className={`pl-9 h-11 bg-background ${
                errors.customerName ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              type="tel"
              placeholder="0912 345 6789"
              value={contactNumber}
              disabled={isSubmitting}
              onChange={(e) => onChangeContact(e.target.value)}
              className={`pl-9 h-11 bg-background ${
                errors.contactNumber ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.contactNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.contactNumber}</p>
          )}
        </div>

        <div className="space-y-2 relative">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Plate Number
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="ABC 1234"
              value={plateNumber}
              disabled={isSubmitting}
              onChange={(e) => onChangePlate(e.target.value)}
              className={`pl-9 h-11 bg-background uppercase ${
                errors.plateNumber ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.plateNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.plateNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
}
