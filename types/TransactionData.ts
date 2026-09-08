import { ServicesData } from "./ServicesData";
import { PromoData } from "./PromoData";
// Define the shape of the JSONB promo column
// Define the joined transaction_add_ons table
export interface TransactionAddOn {
  id: string; // uuid
  transaction_id: string; // uuid
  add_on_id: string; // varchar
  price: number; // bigint maps to number in JS
  created_at: string; // timestamptz string
  label?: string;
  seller_id?: string | null;
}

export interface TransactionStaff {
  staff_id: string;
  name: string;
}

// Main Transaction Type
export interface TransactionData {
  id: string;
  order_id: string;
  customer_name: string;
  contact_number: string;
  plate_number: string;
  vehicle_classification: string;
  vehicle_size: string;
  service_id: string;
  service_price: number;
  total_price: number;
  created_at: string;
  status: string;
  payment_method: string | null;
  vehicle_in: string | null;
  vehicle_out: string | null;
  promo: PromoData;
  transaction_add_ons?: TransactionAddOn[];
  transaction_staff?: TransactionStaff[];

  // Add the joined service object here:
  services?: ServicesData | null;
}
