"use client";

import {
  Banknote,
  CreditCard,
  Loader2,
  QrCode,
  Receipt,
  Settings2,
  Tag,
} from "lucide-react";
import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";
import {
  PaymentMethod,
  StaffMember,
  VehicleSpecification,
} from "@/types/Checkout";

interface Props {
  selectedService: ServicesData | null;
  selectedSizeSize?: string;
  vehicleSpecification: VehicleSpecification;
  servicePrice: number;
  selectedAddOns: AddOnsData[];
  paymentMethod: PaymentMethod | null;
  selectedStaff: string[];
  staffList: StaffMember[];
  totalPrice: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export default function OrderSummary({
  selectedService,
  selectedSizeSize,
  vehicleSpecification,
  servicePrice,
  selectedAddOns,
  paymentMethod,
  selectedStaff,
  staffList,
  totalPrice,
  isSubmitting,
  canSubmit,
  onSubmit,
}: Props) {
  return (
    <div className="flex-1 bg-card border border-border/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <div className="bg-muted/30 p-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Order Summary</h2>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto bg-background/50 space-y-4">
        {!selectedService && selectedAddOns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-70 mt-10 lg:mt-0">
            <Tag className="w-12 h-12 mb-4 text-muted-foreground/40 stroke-[1.5]" />
            <p className="text-sm font-medium">No items selected</p>
            <p className="text-xs mt-1 max-w-[200px]">
              Follow steps on the left to build order.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedService && (
              <div className="p-4 bg-card border border-primary/20 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col pr-4">
                    <span className="font-bold text-foreground text-sm">
                      {selectedService.service_name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 capitalize inline-flex items-center gap-1">
                      <Settings2 className="w-3 h-3" />
                      {vehicleSpecification.replace("-", " ")} •{" "}
                      {selectedSizeSize || "Select size"}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-foreground">
                    ₱
                    {servicePrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}

            {selectedAddOns.map((addon) => (
              <div
                key={addon.id}
                className="p-3 bg-card border border-border/60 rounded-xl shadow-sm flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Add-On
                  </span>
                  <span className="font-medium text-foreground text-sm">
                    {addon.label}
                  </span>
                </div>
                <span className="font-semibold text-sm text-foreground">
                  ₱
                  {Number(addon.price).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}

            {paymentMethod && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                <span>Payment</span>
                <span className="font-medium text-foreground capitalize flex items-center gap-1">
                  {paymentMethod === "cash" ? (
                    <Banknote className="w-3 h-3" />
                  ) : (
                    <QrCode className="w-3 h-3" />
                  )}
                  {paymentMethod === "qr" ? "QR Code" : "Cash"}
                </span>
              </div>
            )}

            {selectedStaff.length > 0 && (
              <div className="flex items-start justify-between text-xs text-muted-foreground">
                <span>Staff</span>
                <span className="font-medium text-foreground text-right max-w-[60%]">
                  {selectedStaff
                    .map((id) => staffList.find((s) => s.id === id)?.name)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-5 bg-card border-t border-border/50 space-y-4">
        <div className="flex justify-between items-center pt-2">
          <span className="text-base text-muted-foreground font-medium">
            Total Amount
          </span>
          <span className="text-3xl font-extrabold tracking-tight text-primary">
            ₱
            {totalPrice.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full py-4 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Complete Transaction
            </>
          )}
        </button>
      </div>
    </div>
  );
}
