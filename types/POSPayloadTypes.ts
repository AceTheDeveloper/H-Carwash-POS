export type VehicleClassification = "4 Wheels" | "2 Wheels";

export type VehicleSize =
  | "small"
  | "medium"
  | "large"
  | "extra large"
  | "regular"
  | "big bike";

export interface ServicePackage {
  id: string;
  label: string;
  price: number;
  icon: string;
  inclusions: string[];
}

export interface AddOns {
  id: string;
  label: string;
  price: number;
  icon: string;
}

export interface AddOnItem {
  id: string;
  price: number; // Snapshot price at checkout
}

export interface POSPayload {
  customer_name: string;
  contact_number: string;
  plate_number: string;
  vehicle_classification: VehicleClassification;
  vehicle_size: VehicleSize;
  service: string; // Service ID
  service_price: number; // Snapshot price of the service
  add_ons: AddOnItem[]; // Array of add-ons with their snapshot prices
  total_price: number; // Combined total
}
