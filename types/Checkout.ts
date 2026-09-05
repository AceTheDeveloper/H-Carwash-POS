import { ServicesData } from "@/types/ServicesData";
import { AddOnsData } from "@/types/AddOnsData";

export type VehicleSpecification = "4-wheels" | "2-wheels";
export type PaymentMethod = "cash" | "qr";

export type FormErrors = {
  customerName?: string;
  contactNumber?: string;
  plateNumber?: string;
  paymentMethod?: string;
  staff?: string;
};

export interface StaffMember {
  id: string;
  name: string;
}

export interface SizeOption {
  size: string;
  price: number;
}

export interface CheckoutPayload {
  customer_name: string;
  contact_number: string;
  plate_number: string;
  vehicle_classification: VehicleSpecification;
  vehicle_size: string;
  service: string;
  service_price: number;
  add_ons: string[];
  add_ons_price: number[];
  payment_method: PaymentMethod;
  staff_in_charge: string[];
  total_price: number;
}
