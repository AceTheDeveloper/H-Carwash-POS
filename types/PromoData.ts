import { AddOnsData } from "./AddOnsData";

export type PromoType = "discount" | "free_add_on" | "special_add_on_price";

export interface PromoData {
  id: string;
  name: string;
  description?: string;
  promo_type: PromoType;
  /** Only meaningful for "discount" promos. */
  discount_type: "percentage" | "fixed_amount";
  /** Discount amount for "discount" promos. 0 for reward promos. */
  value: number;
  /** The add-on granted by "free_add_on" / "special_add_on_price" promos. */
  reward_add_on_id?: string | null;
  /** Price charged for the reward add-on. 0 (or null) means free. */
  reward_price?: number | null;
  /** Populated by the API join — full add-on record, used for display and
   *  to actually add the item to the cart at checkout. */
  reward_add_on?: AddOnsData | null;
  is_active: boolean;
  /** Unique code encoded into the promo's QR image; scanned at checkout. */
  code: string;
  created_at?: string;
}
