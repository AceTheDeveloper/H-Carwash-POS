import { PromoType } from "./PromoData";

export interface PromoPayload {
  name: string;
  description?: string;
  promo_type: PromoType;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  reward_add_on_id?: string | null;
  reward_price?: number | null;
  is_active: boolean;
  /** Optional — the server generates a unique code on create if omitted. */
  code?: string;
}
