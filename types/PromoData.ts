export interface PromoData {
  id: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed_amount";
  value: number;
  is_active: boolean;
  created_at?: string;
}
