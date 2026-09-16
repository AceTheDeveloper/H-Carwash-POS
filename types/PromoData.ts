export interface PromoData {
  id: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  is_active: boolean;
  /** Unique code encoded into the promo's QR image; scanned at checkout. */
  code: string;
  created_at?: string;
}
