"use client";

import { Banknote, CreditCard, QrCode } from "lucide-react";
import { PaymentMethod } from "@/types/Checkout";

interface Props {
  value: PaymentMethod | null;
  error?: string;
  isSubmitting: boolean;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodStep({
  value,
  error,
  isSubmitting,
  onChange,
}: Props) {
  return (
    <div className="bg-card p-5 rounded-2xl border border-border/60 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <CreditCard className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Step 5: Payment Method
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("cash")}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
            value === "cash"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Banknote className="w-4 h-4" />
          Cash
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("qr")}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
            value === "qr"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
