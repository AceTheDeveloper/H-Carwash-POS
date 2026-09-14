"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Hash, Car, Ticket } from "lucide-react";
import { FormErrors } from "@/types/Checkout";

interface Props {
  customerName: string;
  contactNumber: string;
  plateNumber: string;
  carBrand: string;
  errors: FormErrors;
  isSubmitting: boolean;
  orderID: string;
  onChangeName: (v: string) => void;
  onChangeContact: (v: string) => void;
  onChangePlate: (v: string) => void;
  onCarBrandChange: (v: string) => void;
  setOrderID: (v: string) => void;
}

export default function CustomerInfoForm({
  customerName,
  contactNumber,
  plateNumber,
  carBrand,
  errors,
  isSubmitting,
  orderID,
  onChangeName,
  onChangeContact,
  onChangePlate,
  onCarBrandChange,
  setOrderID,
}: Props) {
  return (
    <div className="space-y-4 bg-card p-5 rounded-2xl border border-border/60 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
            Step 1: Customer Information
          </h2>
        </div>

        <div className="space-y-1.5 w-full sm:w-40 shrink-0">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Serial No
          </Label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="0001"
              value={orderID}
              disabled={isSubmitting}
              onChange={(e) => setOrderID(e.target.value)}
              className={`pl-9 h-10 bg-background font-mono text-right ${
                errors.orderID ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.orderID && (
            <p className="text-xs text-red-500 mt-1">{errors.orderID}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
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

        <div className="space-y-2 relative">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Car Brand
          </Label>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Toyota, Honda, etc."
              value={carBrand}
              disabled={isSubmitting}
              onChange={(e) => onCarBrandChange(e.target.value)}
              className={`pl-9 h-11 bg-background ${
                errors.carBrand ? "border-red-500" : ""
              }`}
            />
          </div>
          {errors.carBrand && (
            <p className="text-xs text-red-500 mt-1">{errors.carBrand}</p>
          )}
        </div>
      </div>
    </div>
  );
}
