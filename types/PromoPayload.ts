export interface PromoPayload {
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  is_active: boolean;
}
