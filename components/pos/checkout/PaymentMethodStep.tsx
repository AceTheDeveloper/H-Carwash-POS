"use client";

import { Banknote, CreditCard, HandCoins, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaymentMethod } from "@/types/Checkout";

interface Props {
  value: PaymentMethod | null;
  error?: string;
  unpaidNote: string;
  unpaidNoteError?: string;
  isSubmitting: boolean;
  onUnpaidNoteChange: (note: string) => void;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodStep({
  value,
  error,
  unpaidNote,
  unpaidNoteError,
  isSubmitting,
  onUnpaidNoteChange,
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("card")}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
            value === "card"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Card
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onChange("unpaid")}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
            value === "unpaid"
              ? "border-amber-500 bg-amber-500/10 text-amber-600"
              : "border-border/60 bg-background text-muted-foreground hover:border-amber-500/40"
          }`}
        >
          <HandCoins className="w-4 h-4" />
          Unpaid
        </button>
      </div>

      {value === "unpaid" && (
        <div className="space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <label
            htmlFor="unpaid-note"
            className="text-xs font-semibold text-amber-700 dark:text-amber-500"
          >
            Who is this for? (partner / particulars)
          </label>
          <Input
            id="unpaid-note"
            value={unpaidNote}
            disabled={isSubmitting}
            onChange={(e) => onUnpaidNoteChange(e.target.value)}
            placeholder="e.g. Partner hotel, owner's car"
            className="bg-background"
          />
          <p className="text-[11px] text-muted-foreground">
            No payment is collected. The order is listed under Unpaids and an
            admin can settle it later.
          </p>
          {unpaidNoteError && (
            <p className="text-xs text-red-500">{unpaidNoteError}</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
